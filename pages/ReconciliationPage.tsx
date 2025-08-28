// This file was previously TechnicalForms.tsx and has been repurposed for the new Reconciliation module.
import React, { useState, useEffect } from 'react';
import { useReconciliation } from '../contexts/ReconciliationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Reconciliation, ReconciliationStatus, ReconciliationType, Invoice } from '../types';
import { useData } from '../contexts/DataContext';
import Button from '../components/common/Button';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { generateReconciliationEmail, analyzeDisagreement } from '../services/aiService';
import Loader from '../components/common/Loader';
import { downloadReconciliationAsPdf } from '../services/pdfService';
import { useNotification } from '../contexts/NotificationContext';
import { getInvoicesForReconciliation } from '../services/erpApiService';
import Autocomplete from '../components/common/Autocomplete';

const ReconciliationPage = () => {
    const { t } = useLanguage();
    const { reconciliations } = useReconciliation();
    const { customers } = useData();
    const { showNotification } = useNotification();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReconciliation, setSelectedReconciliation] = useState<Reconciliation | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleOpenModal = (rec: Reconciliation | null) => {
        setSelectedReconciliation(rec);
        setIsModalOpen(true);
    };

    const handleDownloadPdf = async (rec: Reconciliation) => {
        setIsDownloading(true);
        const customer = customers.find(c => c.id === rec.customerId);
        if (!customer || !customer.currentCode) {
            showNotification('genericError', 'error');
            setIsDownloading(false);
            return;
        }

        const invoices = await getInvoicesForReconciliation(customer.currentCode, rec.period);
        const result = await downloadReconciliationAsPdf(rec, customer, invoices, t);

        if (result.success) {
            showNotification('reconciliationPdfDownloaded', 'success');
        } else {
            showNotification('pdfError', 'error');
        }
        setIsDownloading(false);
    };


    const statusClasses: Record<ReconciliationStatus, string> = {
        pending: 'bg-yellow-100 text-yellow-800',
        agreed: 'bg-green-100 text-green-800',
        disagreed: 'bg-red-100 text-red-800',
    };
    
    const columns = [
        { headerKey: 'customer', accessor: (item: Reconciliation) => customers.find(c => c.id === item.customerId)?.name || 'Bilinmeyen' },
        { headerKey: 'type', accessor: (item: Reconciliation) => t(item.type) },
        { headerKey: 'period', accessor: (item: Reconciliation) => item.period },
        { headerKey: 'amount', accessor: (item: Reconciliation) => `${item.amount.toLocaleString('tr-TR')} TL` },
        { headerKey: 'status', accessor: (item: Reconciliation) => <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[item.status]}`}>{t(item.status)}</span>},
        { headerKey: 'actions', accessor: (item: Reconciliation) => (
            <div className="flex gap-2">
                <Button size="sm" variant="info" onClick={() => handleOpenModal(item)} icon="fas fa-eye" title={t('details')} />
                <Button size="sm" variant="secondary" onClick={() => handleDownloadPdf(item)} icon="fas fa-file-pdf" title={t('downloadPdf')} />
            </div>
        ) }
    ];

    return (
        <div>
            {isDownloading && <Loader fullScreen />}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">{t('reconciliations')}</h1>
                <Button onClick={() => handleOpenModal(null)} icon="fas fa-plus">{t('createReconciliation')}</Button>
            </div>
            <DataTable columns={columns.map(c => ({...c, header: t(c.headerKey)}))} data={reconciliations} emptyStateMessage={t('noReconciliationYet')} />
            {isModalOpen && (
                <ReconciliationModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)}
                    reconciliation={selectedReconciliation}
                />
            )}
        </div>
    );
};

const ReconciliationModal = ({ isOpen, onClose, reconciliation }: { isOpen: boolean, onClose: () => void, reconciliation: Reconciliation | null }) => {
    const { t } = useLanguage();
    const { addReconciliation, updateReconciliation } = useReconciliation();
    const { customers } = useData();
    const { showNotification } = useNotification();
    
    const [formData, setFormData] = useState({
        customerId: reconciliation?.customerId || '',
        type: reconciliation?.type || 'current_account' as ReconciliationType,
        period: reconciliation?.period || new Date().toISOString().slice(0, 7),
        amount: reconciliation?.amount || 0,
        notes: reconciliation?.notes || '',
    });
    
    const [syncedInvoices, setSyncedInvoices] = useState<Invoice[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [aiEmail, setAiEmail] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [disagreementResponse, setDisagreementResponse] = useState(reconciliation?.customerResponse || '');
    const [aiAnalysis, setAiAnalysis] = useState(reconciliation?.aiAnalysis || '');

    const handleSyncFromErp = async () => {
        if (!formData.customerId || !formData.period) return;
        setIsSyncing(true);

        const customer = customers.find(c => c.id === formData.customerId);
        if (!customer || !customer.currentCode) {
            showNotification('genericError', 'error');
            setIsSyncing(false);
            return;
        }

        const invoices = await getInvoicesForReconciliation(customer.currentCode, formData.period);
        setSyncedInvoices(invoices);
        const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        setFormData(p => ({ ...p, amount: totalAmount }));

        setIsSyncing(false);
    };

    useEffect(() => {
        const fetchDetails = async () => {
            if (reconciliation) {
                const customer = customers.find(c => c.id === reconciliation.customerId);
                if (customer && customer.currentCode) {
                     const invoices = await getInvoicesForReconciliation(customer.currentCode, reconciliation.period);
                     setSyncedInvoices(invoices);
                }
            }
        };
        fetchDetails();
    }, [reconciliation, customers]);

    const handleGenerateEmail = async () => {
        const customerId = reconciliation?.customerId || formData.customerId;
        if(!customerId) return;
        setIsAiLoading(true);
        const customer = customers.find(c => c.id === customerId);
        if(!customer) {
            setIsAiLoading(false);
            return;
        }
        const result = await generateReconciliationEmail(customer, t(formData.type), formData.period, formData.amount);
        if(result.success) setAiEmail(result.text);
        setIsAiLoading(false);
    };

    const handleAnalyzeDisagreement = async () => {
        if(!disagreementResponse || !reconciliation) return;
        setIsAiLoading(true);
        const result = await analyzeDisagreement(disagreementResponse);
        if(result.success) {
            setAiAnalysis(result.text);
            await updateReconciliation(reconciliation.id, { aiAnalysis: result.text, customerResponse: disagreementResponse });
        }
        setIsAiLoading(false);
    };

    const handleSubmit = async () => {
        if(reconciliation) {
            await updateReconciliation(reconciliation.id, formData);
        } else {
            await addReconciliation(formData);
        }
        onClose();
    };
    
    const handleStatusUpdate = async (status: ReconciliationStatus) => {
        if(!reconciliation) return;
        await updateReconciliation(reconciliation.id, { status });
        onClose();
    };

    const openMailClient = () => {
        const customer = customers.find(c => c.id === (reconciliation?.customerId || formData.customerId));
        if(!customer || !customer.email) return;
        const subject = `${t(formData.type)} Mutabakatı - ${formData.period}`;
        const mailto = `mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(aiEmail)}`;
        window.open(mailto, '_blank');
        if(reconciliation) {
            updateReconciliation(reconciliation.id, { lastEmailSent: new Date().toISOString() });
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={reconciliation ? t('reconciliationDetails') : t('createReconciliation')} size="3xl">
            <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                {reconciliation ? (
                    // Detail/Update View
                    <div className="space-y-4">
                         <div className="bg-cnk-bg-light p-4 rounded-lg grid grid-cols-2 gap-4">
                            <p><strong>{t('customer')}:</strong> {customers.find(c => c.id === reconciliation.customerId)?.name}</p>
                            <p><strong>{t('period')}:</strong> {reconciliation.period}</p>
                            <p><strong>{t('type')}:</strong> {t(reconciliation.type)}</p>
                            <p><strong>{t('amount')}:</strong> {reconciliation.amount.toLocaleString('tr-TR')} TL</p>
                            <p className="col-span-2"><strong>{t('status')}:</strong> {t(reconciliation.status)}</p>
                         </div>
                        
                        {reconciliation.status === 'pending' && (
                            <div className="flex gap-2 p-4 border-t">
                               <Button variant="success" onClick={() => handleStatusUpdate('agreed')} icon="fas fa-check">{t('agree')}</Button>
                               <Button variant="danger" onClick={() => handleStatusUpdate('disagreed')} icon="fas fa-times">{t('disagree')}</Button>
                            </div>
                        )}

                        {reconciliation.status === 'disagreed' && (
                            <fieldset className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                                <legend className="font-semibold text-red-700 px-2">{t('disagreementDetails')}</legend>
                                <label htmlFor="customerResponse" className="font-semibold text-sm">{t('customerResponse')}</label>
                                <textarea id="customerResponse" value={disagreementResponse} onChange={(e) => setDisagreementResponse(e.target.value)} rows={3} className="w-full mt-1 p-2 border rounded-md" />
                                <Button onClick={handleAnalyzeDisagreement} isLoading={isAiLoading} icon="fas fa-robot" className="mt-2">{t('aiAnalyzeDisagreement')}</Button>
                                {(aiAnalysis || isAiLoading) && 
                                    <div className="mt-2 p-3 bg-blue-500/10 rounded-md whitespace-pre-wrap border border-blue-500/20">
                                        <h4 className="font-bold text-blue-700">{t('aiAnalysis')}:</h4>
                                        {isAiLoading ? <Loader size="sm" /> : <p className="text-sm">{aiAnalysis}</p>}
                                    </div>
                                }
                            </fieldset>
                        )}
                        <Button onClick={handleGenerateEmail} isLoading={isAiLoading} icon="fas fa-robot">{t('aiGenerateEmail')}</Button>
                        {(aiEmail || isAiLoading) && (
                            <div className="mt-2">
                                {isAiLoading ? <Loader /> : (
                                <>
                                    <textarea value={aiEmail} onChange={e => setAiEmail(e.target.value)} rows={8} className="w-full p-2 border rounded-md bg-cnk-bg-light" />
                                    <Button onClick={openMailClient} icon="fas fa-paper-plane" className="mt-2">{t('sendEmail')}</Button>
                                </>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    // Create View
                    <div className="space-y-4">
                        <div>
                            <label className="font-semibold">{t('customer')}</label>
                             <Autocomplete
                                items={customers.map(c => ({ id: c.id, name: c.name }))}
                                onSelect={(id) => setFormData(p => ({ ...p, customerId: id }))}
                                placeholder={t('searchCustomer')}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <Input label={t('period')} type="month" value={formData.period} onChange={e => setFormData(p => ({...p, period: e.target.value}))} />
                             <div>
                                 <label className="font-semibold">{t('type')}</label>
                                 <select value={formData.type} onChange={e => setFormData(p => ({...p, type: e.target.value as ReconciliationType}))} className="w-full mt-1 p-2 border rounded-md bg-cnk-bg-light">
                                    <option value="current_account">{t('current_account')}</option>
                                    <option value="ba">{t('ba')}</option>
                                    <option value="bs">{t('bs')}</option>
                                </select>
                            </div>
                             <div className="self-end">
                                <Button onClick={handleSyncFromErp} isLoading={isSyncing} icon="fas fa-sync" className="w-full">{t('syncFromErp')}</Button>
                             </div>
                        </div>
                        <Input label={t('amount')} type="number" value={String(formData.amount)} onChange={e => setFormData(p => ({...p, amount: parseFloat(e.target.value) || 0}))} readOnly />
                        
                        {syncedInvoices.length > 0 && (
                             <div>
                                <h4 className="font-semibold text-lg mb-2">{t('accountTransactions')}</h4>
                                <div className="max-h-48 overflow-y-auto border rounded-md">
                                    <table className="w-full text-sm">
                                        <thead className="bg-cnk-bg-light">
                                            <tr>
                                                <th className="p-2 text-left">{t('invoiceNo')}</th>
                                                <th className="p-2 text-left">{t('date')}</th>
                                                <th className="p-2 text-right">{t('amount')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {syncedInvoices.map(inv => (
                                            <tr key={inv.id} className="border-t">
                                                <td className="p-2">{inv.id}</td>
                                                <td className="p-2">{new Date(inv.date).toLocaleDateString()}</td>
                                                <td className="p-2 text-right">{inv.totalAmount.toLocaleString('tr-TR')} TL</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end border-t pt-4">
                            <Button onClick={handleSubmit} disabled={!formData.customerId || isSyncing}>{t('save')}</Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ReconciliationPage;