import React, { useState, useMemo, useEffect, ChangeEvent } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { Offer, OfferItem, Customer } from '../types';
import DataTable from '../components/common/DataTable';
import Button from '../components/common/Button';
import { downloadOfferAsPdf, getOfferHtml } from '../services/pdfService';
import Loader from '../components/common/Loader';
import { ViewState } from '../App';
import { generateFollowUpEmail, enhanceDescription } from '../services/aiService';
import { ASSETS } from '../constants';
import CnkLogo from '../components/assets/CnkLogo';
import Modal from '../components/common/Modal';
import { v4 as uuidv4 } from 'uuid';
import Autocomplete from '../components/common/Autocomplete';

interface OfferPageProps {
    view: ViewState;
    setView: (view: ViewState) => void;
}

interface OfferListPageProps {
    setView: (view: ViewState) => void;
}

const OfferListPage = ({ setView }: OfferListPageProps) => {
    const { offers, customers } = useData();
    const { t } = useLanguage();
    const [isDownloading, setIsDownloading] = useState(false);
    const { showNotification } = useNotification();
    const { currentUser } = useAuth();

    const handleDownload = async (offer: Offer) => {
        setIsDownloading(true);
        const customer = customers.find(c => c.id === offer.customerId);
        const result = await downloadOfferAsPdf(offer, customer, t, ASSETS.CNK_LOGO_BASE64);
        if (result.success) {
            showNotification('pdfDownloaded', 'success');
        } else {
            showNotification('pdfError', 'error');
        }
        setIsDownloading(false);
    };

    const columns = [
        { header: t('offerCode'), accessor: (item: Offer) => <span className="font-mono text-sm">{item.teklifNo}</span> },
        { 
            header: t('customers'), 
            accessor: (item: Offer) => customers.find(c => c.id === item.customerId)?.name || t('unknownCustomer')
        },
        { header: t('offerDetails'), accessor: (item: Offer) => item.firma.yetkili },
        { header: t('amount'), accessor: (item: Offer) => `${item.genelToplam.toFixed(2)} TL`, className: 'font-semibold' },
        { header: t('createdAt'), accessor: (item: Offer) => new Date(item.createdAt).toLocaleDateString() },
        {
            header: t('actions'),
            accessor: (item: Offer) => (
                <div className="flex gap-2">
                    <Button variant="info" size="sm" onClick={() => setView({ page: 'teklif-yaz', id: item.id })} icon="fas fa-eye" title={currentUser?.role === 'admin' ? `${t('view')}/${t('edit')}` : t('view')} />
                    <Button variant="primary" size="sm" onClick={() => handleDownload(item)} icon="fas fa-file-pdf" title={t('downloadPdf')} />
                </div>
            ),
        },
    ];

    return (
        <div>
            {isDownloading && <Loader fullScreen={true} />}
            <div className="flex items-center justify-end mb-6">
                <Button variant="primary" onClick={() => setView({ page: 'teklif-yaz', id: 'create' })} icon="fas fa-plus">{t('createOffer')}</Button>
            </div>
            <DataTable
                columns={columns}
                data={offers}
                emptyStateMessage={t('noOfferYet')}
            />
        </div>
    );
};

interface OfferFormProps {
    setView: (view: ViewState) => void;
    offerId?: string;
}

const OfferForm = ({ setView, offerId }: OfferFormProps) => {
    const { t } = useLanguage();
    const { offers, customers, addOffer, updateOffer } = useData();
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    
    const isCreateMode = offerId === 'create';
    const isReadOnly = !isCreateMode && currentUser?.role !== 'admin';
    const [existingOffer, setExistingOffer] = useState<Offer | null>(null);

    // State only holds the source of truth, not derived values like totals.
    const [formState, setFormState] = useState<Omit<Offer, 'id' | 'createdAt' | 'teklifNo' | 'toplam' | 'kdv' | 'genelToplam' | 'aiFollowUpEmail'> & { aiFollowUpEmail?: string }>({
        customerId: '',
        firma: { yetkili: '', telefon: '', eposta: '', vade: '', teklifTarihi: new Date().toISOString().slice(0,10) },
        teklifVeren: { yetkili: currentUser?.name || '', telefon: '', eposta: '' },
        items: [],
        notlar: '',
        aiFollowUpEmail: ''
    });
    
    const [aiEmail, setAiEmail] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [enhancingItemId, setEnhancingItemId] = useState<string|null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Calculate totals on the fly. useMemo ensures this only recalculates when items change.
    const { toplam, kdv, genelToplam } = useMemo(() => {
        const subTotal = formState.items.reduce((acc, item) => acc + (item.tutar || 0), 0);
        const vat = subTotal * 0.20;
        const grandTotal = subTotal + vat;
        return {
            toplam: subTotal,
            kdv: vat,
            genelToplam: grandTotal
        };
    }, [formState.items]);

    useEffect(() => {
        const offer = offers.find(o => o.id === offerId);
        setExistingOffer(offer || null);
        if (offer) {
             setFormState({
                customerId: offer.customerId,
                firma: offer.firma,
                teklifVeren: offer.teklifVeren,
                items: offer.items,
                notlar: offer.notlar,
                aiFollowUpEmail: offer.aiFollowUpEmail
            });
            setAiEmail(offer.aiFollowUpEmail || '');
        }
    }, [offerId, offers]);


    const handleCustomerSelect = (custId: string) => {
        const customer = customers.find(c => c.id === custId);
        setFormState(prev => ({
            ...prev,
            customerId: custId,
            firma: {
                ...prev.firma,
                yetkili: customer?.name || '', // Assuming customer name is the contact person
                telefon: customer?.phone1 || '',
                eposta: customer?.email || '',
            }
        }));
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, section: 'firma' | 'teklifVeren') => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [section]: {...prev[section], [id]: value }}));
    };
    
    const handleItemChange = (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
        const { name, value } = e.target;
        setFormState(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (item.id !== itemId) return item;
                
                const updatedItem = { ...item };
                
                if (name === 'miktar' || name === 'fiyat') {
                    (updatedItem as any)[name] = parseFloat(value) || 0;
                } else {
                    (updatedItem as any)[name] = value;
                }
                
                updatedItem.tutar = updatedItem.miktar * updatedItem.fiyat;

                return updatedItem;
            })
        }));
    };

    const addItem = () => {
        const newItem: OfferItem = { id: uuidv4(), cins: '', miktar: 1, birim: 'Adet', fiyat: 0, tutar: 0, teslimSuresi: '' };
        setFormState(prev => ({ ...prev, items: [...prev.items, newItem] }));
    };

    const removeItem = (itemId: string) => {
        setFormState(prev => ({ ...prev, items: prev.items.filter(item => item.id !== itemId)}));
    };
    
    const handleEnhanceDescription = async (itemId: string) => {
        const item = formState.items.find(i => i.id === itemId);
        if (!item || !item.cins) return;
        setEnhancingItemId(itemId);
        try {
            const result = await enhanceDescription(item.cins);
            if (result.success) {
                setFormState(prev => ({
                    ...prev,
                    items: prev.items.map(i => i.id === itemId ? { ...i, cins: result.text } : i)
                }));
                showNotification('descriptionEnhanced', 'success');
            } else {
                showNotification('aiError', 'error');
            }
        } catch(error) {
            showNotification('aiError', 'error');
        } finally {
            setEnhancingItemId(null);
        }
    };

    const handleSubmit = () => {
        if(!formState.customerId || formState.items.length === 0) {
            showNotification('fieldsRequired', 'error');
            return;
        }

        const offerData: Omit<Offer, 'id' | 'createdAt' | 'teklifNo'> = {
            ...formState,
            toplam,
            kdv,
            genelToplam,
        };

        if (isCreateMode) {
            addOffer(offerData);
            showNotification('offerAdded', 'success');
        } else if (existingOffer) {
            updateOffer({ ...existingOffer, ...offerData });
            showNotification('offerUpdated', 'success');
        }

        setView({ page: 'teklif-yaz' });
    };

    const handleGenerateEmail = async () => {
        if (!existingOffer) return;
        setIsAiLoading(true);
        try {
            const customer = customers.find(c => c.id === existingOffer.customerId);
            const result = await generateFollowUpEmail(existingOffer, customer);
            if(result.success) {
                setAiEmail(result.text);
            } else {
                showNotification('aiError', 'error');
            }
        } catch(error) {
            showNotification('aiError', 'error');
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSaveEmail = () => {
        if (!existingOffer) return;
        const updatedOffer = { ...existingOffer, aiFollowUpEmail: aiEmail };
        updateOffer(updatedOffer);
        showNotification('emailSaved', 'success');
    };

    const InputField = ({label, id, value, onChange, section, readOnly=false}: {label: string, id: string, value: string, onChange: (e: ChangeEvent<HTMLInputElement>) => void, section: 'firma' | 'teklifVeren' | '', readOnly?: boolean}) => (
        <div className="flex items-center"><span className="w-24 font-semibold">{label}</span><span>:</span><input type="text" id={id} value={value} onChange={onChange} readOnly={readOnly} className="ml-2 flex-grow bg-transparent focus:outline-none focus:bg-slate-100 p-1 rounded"/></div>
    );
    
    return (
        <div className="max-w-5xl mx-auto">
            <div className="flex justify-end items-center mb-6">
                 <Button onClick={() => setView({ page: 'teklif-yaz' })} variant="secondary" icon="fas fa-arrow-left">{t('backToList')}</Button>
            </div>
            
            <fieldset disabled={isReadOnly} className="border-2 border-cnk-border-light p-6 disabled:bg-slate-50">
                <div className="flex justify-between items-start pb-4 border-b-2 border-cnk-border-light">
                    <CnkLogo className="h-20" />
                    <div className="text-right text-sm">
                        <p>İvedik OSB Melih Gökçek Blv.</p><p>No:15/1 Yenimahalle / ANKARA</p><p>satis@cnkkesicitakim.com.tr</p><p className="font-bold text-cnk-accent-pink">www.cnkkesicitakim.com.tr</p>
                    </div>
                </div>
                
                <h2 className="text-center text-3xl font-bold my-6 border-b-2 border-cnk-txt-primary-light inline-block px-4 pb-1 mx-auto w-full">FİYAT TEKLİFİ</h2>
                
                <div className="grid grid-cols-2 gap-6 text-sm">
                    <div className="border-2 border-cnk-txt-primary-light p-2 space-y-1">
                        <h3 className="font-bold">{t('nameCompanyName')}:</h3>
                        <Autocomplete
                            items={customers.map(c => ({ id: c.id, name: c.name }))}
                            onSelect={handleCustomerSelect}
                            placeholder={t('selectCustomer')}
                            initialValue={customers.find(c => c.id === formState.customerId)?.name || ''}
                            disabled={isReadOnly}
                        />
                        <InputField label={t('yetkili')} id="yetkili" value={formState.firma.yetkili} onChange={(e) => handleInputChange(e, 'firma')} readOnly={isReadOnly} section="firma" />
                        <InputField label={t('phone')} id="telefon" value={formState.firma.telefon} onChange={(e) => handleInputChange(e, 'firma')} readOnly={isReadOnly} section="firma" />
                        <InputField label={t('email')} id="eposta" value={formState.firma.eposta} onChange={(e) => handleInputChange(e, 'firma')} readOnly={isReadOnly} section="firma" />
                        <InputField label={t('vade')} id="vade" value={formState.firma.vade} onChange={(e) => handleInputChange(e, 'firma')} readOnly={isReadOnly} section="firma" />
                        <InputField label={t('date')} id="teklifTarihi" value={formState.firma.teklifTarihi} onChange={(e) => handleInputChange(e, 'firma')} readOnly={isReadOnly} section="firma" />
                        <InputField label={t('teklifNo')} id="teklifNo" value={existingOffer?.teklifNo || 'Otomatik'} onChange={() => {}} section="" readOnly={true}/>
                    </div>
                    <div className="border-2 border-cnk-txt-primary-light p-2 space-y-1">
                        <h3 className="font-bold">Teklif Veren Firma:</h3>
                        <InputField label={t('yetkili')} id="yetkili" value={formState.teklifVeren.yetkili} onChange={(e) => handleInputChange(e, 'teklifVeren')} readOnly={isReadOnly} section="teklifVeren" />
                        <InputField label={t('phone')} id="telefon" value={formState.teklifVeren.telefon} onChange={(e) => handleInputChange(e, 'teklifVeren')} readOnly={isReadOnly} section="teklifVeren" />
                        <InputField label={t('email')} id="eposta" value={formState.teklifVeren.eposta} onChange={(e) => handleInputChange(e, 'teklifVeren')} readOnly={isReadOnly} section="teklifVeren" />
                    </div>
                </div>
                
                <p className="my-4 text-sm">Firmamızdan istemiş olduğunuz ürünlerimizle ilgili fiyat teklifimizi aşağıda bilgilerinize sunar iyi çalışmalar dileriz.</p>
                <p className="text-right text-sm mb-4">Saygılarımızla,</p>
                
                {/* Items Table */}
                <div className="overflow-x-auto">
                    <table className="w-full border-2 border-cnk-accent-pink text-xs text-center">
                       <thead className="bg-cnk-accent-pink text-white">
                           <tr>
                               <th className="p-2 border border-cnk-accent-pink">MALZEMENİN CİNSİ</th><th className="p-2 border border-cnk-accent-pink">MİKTAR</th>
                               <th className="p-2 border border-cnk-accent-pink">BİRİM</th><th className="p-2 border border-cnk-accent-pink">FİYAT</th>
                               <th className="p-2 border border-cnk-accent-pink">TUTAR</th><th className="p-2 border border-cnk-accent-pink">TESLİM SÜRESİ</th>
                               {!isReadOnly && <th className="p-2 border border-cnk-accent-pink"></th>}
                           </tr>
                       </thead>
                       <tbody>
                            {formState.items.map(item => (
                                <tr key={item.id}>
                                    <td className="relative">
                                        <input name="cins" value={item.cins} onChange={(e) => handleItemChange(e, item.id)} readOnly={isReadOnly} className="w-full p-1 bg-transparent text-center focus:outline-none focus:bg-slate-100"/>
                                        {!isReadOnly && 
                                            <Button 
                                                size="sm" 
                                                variant="secondary" 
                                                className="!p-1 !absolute right-1 top-1/2 -translate-y-1/2"
                                                onClick={() => handleEnhanceDescription(item.id)} 
                                                isLoading={enhancingItemId === item.id}
                                                title={t('enhanceDescription')}
                                            >✨</Button>
                                        }
                                    </td>
                                    <td><input name="miktar" type="number" value={item.miktar} onChange={(e) => handleItemChange(e, item.id)} readOnly={isReadOnly} className="w-16 p-1 bg-transparent text-center focus:outline-none focus:bg-slate-100"/></td>
                                    <td><input name="birim" value={item.birim} onChange={(e) => handleItemChange(e, item.id)} readOnly={isReadOnly} className="w-20 p-1 bg-transparent text-center focus:outline-none focus:bg-slate-100"/></td>
                                    <td><input name="fiyat" type="number" value={item.fiyat} onChange={(e) => handleItemChange(e, item.id)} readOnly={isReadOnly} className="w-20 p-1 bg-transparent text-center focus:outline-none focus:bg-slate-100"/></td>
                                    <td><input name="tutar" value={item.tutar.toFixed(2)} readOnly className="w-20 p-1 bg-slate-100 text-center focus:outline-none"/></td>
                                    <td><input name="teslimSuresi" value={item.teslimSuresi} onChange={(e) => handleItemChange(e, item.id)} readOnly={isReadOnly} className="w-24 p-1 bg-transparent text-center focus:outline-none focus:bg-slate-100"/></td>
                                    {!isReadOnly && <td><Button size="sm" variant="danger" type="button" onClick={() => removeItem(item.id)} icon="fas fa-trash"/></td>}
                                </tr>
                            ))}
                       </tbody>
                    </table>
                    {!isReadOnly && <Button size="sm" variant="success" type="button" onClick={addItem} icon="fas fa-plus" className="mt-2">{t('addRow')}</Button>}
                </div>

                <div className="grid grid-cols-3 gap-6 mt-4 text-sm">
                    <div className="col-span-2 border-2 border-cnk-txt-primary-light p-2">
                        <label htmlFor="notlar" className="font-bold">TEKLİF NOT:</label>
                        <textarea id="notlar" value={formState.notlar} onChange={(e) => setFormState(prev => ({...prev, notlar: e.target.value}))} readOnly={isReadOnly} rows={4} className="w-full mt-1 p-1 focus:outline-none focus:bg-slate-100"></textarea>
                    </div>
                    <div className="border-2 border-cnk-txt-primary-light">
                        <div className="flex"><div className="w-1/2 p-1 bg-cnk-accent-pink text-white font-bold border border-cnk-txt-primary-light">TOPLAM</div><div className="w-1/2 p-1 text-right border border-cnk-txt-primary-light">{toplam.toFixed(2)}</div></div>
                        <div className="flex"><div className="w-1/2 p-1 bg-cnk-accent-pink text-white font-bold border border-cnk-txt-primary-light">%20 KDV</div><div className="w-1/2 p-1 text-right border border-cnk-txt-primary-light">{kdv.toFixed(2)}</div></div>
                        <div className="flex"><div className="w-1/2 p-1 bg-cnk-accent-pink text-white font-bold border border-cnk-txt-primary-light">G.TOPLAM</div><div className="w-1/2 p-1 text-right border border-cnk-txt-primary-light font-bold">{genelToplam.toFixed(2)}</div></div>
                    </div>
                </div>

                {!isReadOnly && <div className="text-right mt-6 flex items-center justify-end gap-2">
                    <Button onClick={() => setIsPreviewOpen(true)} variant="secondary" icon="fas fa-eye" type="button">{t('preview')}</Button>
                    <Button onClick={handleSubmit} icon="fas fa-save">{t('saveOffer')}</Button>
                </div>}
            </fieldset>
            
            {isPreviewOpen && (
                <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title={t('offerPreview')} size="4xl">
                    <iframe
                        srcDoc={getOfferHtml(
                            { 
                                ...(existingOffer || { id: 'preview', teklifNo: 'Önizleme', createdAt: new Date().toISOString() }),
                                ...formState,
                                toplam,
                                kdv,
                                genelToplam
                            } as Offer,
                            customers.find(c => c.id === formState.customerId),
                            t,
                            ASSETS.CNK_LOGO_BASE64
                        )}
                        className="w-full h-[70vh] border-0"
                        title={t('offerPreview')}
                    />
                </Modal>
            )}
                 
            {/* AI Assistant */}
            {!isCreateMode && existingOffer && (
                <div className="mt-6 border-t-2 border-cnk-border-light pt-4">
                    <h3 className="text-xl font-bold text-primary mb-2">{t('aiAssistant')}</h3>
                    <Button onClick={handleGenerateEmail} isLoading={isAiLoading} icon="fas fa-robot">{t('generateFollowUpEmail')}</Button>
                    
                    {(isAiLoading || aiEmail) && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                            <h4 className="font-semibold text-text-dark mb-2">{t('aiGeneratedEmail')}</h4>
                            {isAiLoading ? <Loader/> : (
                                <>
                                    <textarea 
                                        value={aiEmail}
                                        onChange={(e) => setAiEmail(e.target.value)}
                                        rows={10}
                                        className="w-full p-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <Button onClick={handleSaveEmail} variant="success" size="sm" icon="fas fa-save" className="mt-2">{t('saveEmail')}</Button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const OfferPage = ({ view, setView }: OfferPageProps) => {
    if (view.id) {
        return <OfferForm setView={setView} offerId={view.id} />;
    }
    return <OfferListPage setView={setView} />;
};

export default OfferPage;