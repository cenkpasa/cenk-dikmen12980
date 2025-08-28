import React, { useState, useEffect, ReactNode } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Customer } from '../../types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { analyzeOpportunities, suggestNextStep, analyzeSentiment } from '../../services/aiService';
import BusinessCardScanner from '../customers/BusinessCardScanner';
import Input from '../common/Input';
import Loader from '../common/Loader';

interface CustomerFormProps {
    isOpen: boolean;
    onClose: () => void;
    customer: Customer | null;
}

type CustomerFormData = Omit<Customer, 'id' | 'createdAt'>;

interface AIAnalysisTabProps {
    formData: CustomerFormData;
    setFormData: React.Dispatch<React.SetStateAction<CustomerFormData>>;
}

const AIAnalysisTab = ({ formData, setFormData }: AIAnalysisTabProps) => {
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const [analysisLoading, setAnalysisLoading] = useState<Record<string, boolean>>({
        opportunities: false,
        nextStep: false,
        sentiment: false,
    });

    const handleAnalysis = async (type: 'opportunities' | 'nextStep' | 'sentiment') => {
        setAnalysisLoading(prev => ({ ...prev, [type]: true }));
        try {
            let promise;
            const tempCustomerForAnalysis: Customer = {
                id: 'temp', 
                createdAt: new Date().toISOString(),
                ...formData
            };

            switch (type) {
                case 'opportunities': promise = analyzeOpportunities(tempCustomerForAnalysis); break;
                case 'nextStep': promise = suggestNextStep(tempCustomerForAnalysis); break;
                case 'sentiment': promise = analyzeSentiment(formData.notes || ''); break;
            }
            const result = await promise;
            if (result.success) {
                const now = new Date().toISOString();
                const analysisResult = { result: result.text, timestamp: now };
                if (type === 'opportunities') setFormData(prev => ({ ...prev, aiOpportunityAnalysis: analysisResult }));
                if (type === 'nextStep') setFormData(prev => ({ ...prev, aiNextStepSuggestion: analysisResult }));
                if (type === 'sentiment') setFormData(prev => ({ ...prev, aiSentimentAnalysis: analysisResult }));
            } else {
                 showNotification('aiError', 'error');
            }
        } catch (error) {
            showNotification('aiError', 'error');
        } finally {
            setAnalysisLoading(prev => ({ ...prev, [type]: false }));
        }
    };

    const AnalysisSection = ({ title, type, analysisData }: { title: string, type: keyof typeof analysisLoading, analysisData?: { result: string, timestamp: string } }) => (
        <div className="bg-cnk-bg-light p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-cnk-txt-primary-light">{title}</h4>
                <Button size="sm" onClick={() => handleAnalysis(type as any)} isLoading={analysisLoading[type]}>{t('analyze')}</Button>
            </div>
             {analysisData?.result && (
                <div>
                    {analysisData.timestamp && <p className="text-xs text-cnk-txt-muted-light mb-1">{t('analysisDate')}: {new Date(analysisData.timestamp).toLocaleString()}</p>}
                    <p className="text-sm text-cnk-txt-secondary-light whitespace-pre-wrap">{analysisData.result}</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-4">
            <AnalysisSection title={t('opportunityAnalysis')} type="opportunities" analysisData={formData.aiOpportunityAnalysis} />
            <AnalysisSection title={t('suggestNextStep')} type="nextStep" analysisData={formData.aiNextStepSuggestion} />
            <AnalysisSection title={t('sentimentAnalysis')} type="sentiment" analysisData={formData.aiSentimentAnalysis} />
        </div>
    );
};


const CustomerForm = ({ isOpen, onClose, customer }: CustomerFormProps) => {
    const { addCustomer, updateCustomer } = useData();
    const { t } = useLanguage();
    const { showNotification } = useNotification();
    const [activeTab, setActiveTab] = useState('generalInfo');
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const getInitialState = (): CustomerFormData => ({
        name: '', email: '', status: 'active', currentCode: '', commercialTitle: '', address: '',
        country: '', city: '', district: '', postalCode: '', group: '', subgroup1: '', subgroup2: '',
        phone1: '', phone2: '', homePhone: '', mobilePhone1: '', fax: '', taxOffice: '',
        taxNumber: '', nationalId: '', specialCode1: '', specialCode2: '', specialCode3: '',
        registrationDate: new Date().toISOString().slice(0, 10), specialDate: '', webcamImage: '', notes: ''
    });

    const [formData, setFormData] = useState<CustomerFormData>(getInitialState());
    
    useEffect(() => {
        if (isOpen) {
            if (customer) {
                setFormData({
                    ...getInitialState(),
                    ...customer,
                });
            } else {
                setFormData(getInitialState());
            }
            setActiveTab('generalInfo');
        }
    }, [customer, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) {
            showNotification('nameRequired', 'error');
            return;
        }

        if (customer) {
            updateCustomer({ ...customer, ...formData });
            showNotification('customerUpdated', 'success');
        } else {
            addCustomer(formData);
            showNotification('customerAdded', 'success');
        }
        onClose();
    };
    
    const handleCardScanned = (data: any) => {
        setFormData(prev => ({
            ...prev,
            name: data.name || prev.name,
            commercialTitle: data.company || prev.commercialTitle,
            email: data.email || prev.email,
            phone1: data.phone || prev.phone1,
            mobilePhone1: data.mobile || prev.mobilePhone1,
            address: data.address || prev.address,
        }));
        setIsScannerOpen(false);
        showNotification('cardDataTransferred', 'success');
    };
    
    const tabs = [
        { id: 'generalInfo', label: t('generalInfo') },
        { id: 'aiAnalysis', label: t('aiAnalysis'), disabled: !customer },
    ];

    return (
        <>
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={customer ? t('editCustomer') : t('addNewCustomer')}
            size="5xl"
            footer={
                <div className="w-full flex justify-between">
                    {!customer && <Button icon="fas fa-id-card" variant="info" onClick={() => setIsScannerOpen(true)}>{t('scanCard')}</Button>}
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                        <Button variant="primary" onClick={handleSubmit}>{t('save')}</Button>
                    </div>
                </div>
            }
        >
            <div className="flex border-b border-cnk-border-light mb-4">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => !tab.disabled && setActiveTab(tab.id)}
                        disabled={tab.disabled}
                        className={`px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${activeTab === tab.id ? 'border-b-2 border-cnk-accent-primary text-cnk-accent-primary' : 'text-cnk-txt-muted-light'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'generalInfo' && (
                <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-x-6 gap-y-4">
                    <div className="col-span-12 md:col-span-4 space-y-4">
                         <div>
                            <label htmlFor="status" className="mb-2 block text-sm font-semibold text-cnk-txt-secondary-light">{t('status')}</label>
                            <select id="status" value={formData.status} onChange={handleChange} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light px-3 py-2 text-cnk-txt-primary-light shadow-sm">
                                <option value="active">{t('active')}</option>
                                <option value="passive">{t('passive')}</option>
                            </select>
                         </div>
                         <Input label={t('currentCode')} id="currentCode" value={formData.currentCode || ''} onChange={handleChange} />
                         <Input label={t('commercialTitle')} id="commercialTitle" value={formData.commercialTitle || ''} onChange={handleChange} />
                         <Input label={t('nameCompanyName')} id="name" value={formData.name || ''} onChange={handleChange} required/>
                         <div>
                            <label htmlFor="address" className="mb-2 block text-sm font-semibold text-cnk-txt-secondary-light">{t('address')}</label>
                            <textarea id="address" value={formData.address || ''} onChange={handleChange} rows={3} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light px-3 py-2 text-cnk-txt-primary-light shadow-sm"></textarea>
                        </div>
                    </div>
                    <div className="col-span-12 md:col-span-4 space-y-4">
                        <Input label={t('phone1')} id="phone1" value={formData.phone1 || ''} onChange={handleChange} />
                        <Input label={t('mobilePhone1')} id="mobilePhone1" value={formData.mobilePhone1 || ''} onChange={handleChange} />
                        <Input label={t('email')} id="email" type="email" value={formData.email || ''} onChange={handleChange} />
                        <Input label={t('taxOffice')} id="taxOffice" value={formData.taxOffice || ''} onChange={handleChange} />
                        <Input label={t('taxNumber')} id="taxNumber" value={formData.taxNumber || ''} onChange={handleChange} />
                    </div>
                    <div className="col-span-12 md:col-span-4 space-y-2 flex flex-col">
                        <div className="flex justify-between items-center mb-1">
                             <label htmlFor="notes" className="text-sm font-semibold text-cnk-txt-secondary-light">{t('notes')}</label>
                        </div>
                         <textarea id="notes" value={formData.notes || ''} onChange={handleChange} rows={10} className="w-full rounded-lg border border-cnk-border-light bg-cnk-bg-light px-3 py-2 text-cnk-txt-primary-light shadow-sm flex-grow"></textarea>
                    </div>
                </form>
            )}
             {activeTab === 'aiAnalysis' && <AIAnalysisTab formData={formData} setFormData={setFormData} />}
        </Modal>
        {isScannerOpen && <BusinessCardScanner isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={handleCardScanned} />}
        </>
    );
};

export default CustomerForm;