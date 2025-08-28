import React, { useState } from 'react';
import { Customer } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';
import { analyzeOpportunities, suggestNextStep, analyzeSentiment } from '../../services/aiService';
import { useNotification } from '../../contexts/NotificationContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import ActivityTimeline from './ActivityTimeline';
import { ViewState } from '../../App';
import Loader from '../common/Loader';


interface CustomerDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    customer: Customer;
    onEdit: (customer: Customer) => void;
    setView: (view: ViewState) => void;
}

const InfoItem = ({ label, value }: { label: string, value?: string }) => {
    return (
        <div>
            <p className="text-xs text-cnk-txt-muted-light">{label}</p>
            <p className="font-medium text-cnk-txt-primary-light">{value || '-'}</p>
        </div>
    );
};

const AIAnalysisSection = ({ title, icon, analysisData, onRun, isLoading }: { title: string, icon: string, analysisData?: { result: string, timestamp: string }, onRun: () => void, isLoading: boolean }) => {
    const { t } = useLanguage();
    return (
        <div className="bg-cnk-bg-light p-3 rounded-lg border border-cnk-border-light/50">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-cnk-txt-primary-light flex items-center gap-2">
                    <i className={`fas ${icon} text-cnk-accent-primary`}></i>
                    <span>{title}</span>
                </h4>
                <Button size="sm" onClick={onRun} isLoading={isLoading} icon="fas fa-robot">{t('analyze')}</Button>
            </div>
            {isLoading ? <Loader size="sm" /> : (
                analysisData?.result ? (
                    <div>
                        <p className="text-xs text-cnk-txt-muted-light mb-1">{t('analysisDate')}: {new Date(analysisData.timestamp).toLocaleString()}</p>
                        <p className="text-sm text-cnk-txt-secondary-light whitespace-pre-wrap">{analysisData.result}</p>
                    </div>
                ) : (
                    <p className="text-sm text-cnk-txt-muted-light italic">Henüz analiz yapılmamış.</p>
                )
            )}
        </div>
    );
};


const CustomerDetailModal = ({ isOpen, onClose, customer, onEdit, setView }: CustomerDetailModalProps) => {
    const { t } = useLanguage();
    const { updateCustomer } = useData();
    const { showNotification } = useNotification();
    const [activeTab, setActiveTab] = useState<'timeline' | 'ai'>('timeline');
    const [loadingAI, setLoadingAI] = useState<Record<string, boolean>>({
        opportunity: false,
        nextStep: false,
        sentiment: false,
    });

    const handleCreateAppointment = () => {
        onClose();
        setView({ page: 'appointments' });
    };
    
    const handleRunAnalysis = async (type: 'opportunity' | 'nextStep' | 'sentiment') => {
        setLoadingAI(prev => ({ ...prev, [type]: true }));
        try {
            let promise;
            switch(type) {
                case 'opportunity': promise = analyzeOpportunities(customer); break;
                case 'nextStep': promise = suggestNextStep(customer); break;
                case 'sentiment': promise = analyzeSentiment(customer.notes || ''); break;
            }
            const result = await promise;

            if (result.success) {
                const analysisResult = { result: result.text, timestamp: new Date().toISOString() };
                let updatedCustomer = { ...customer };
                if (type === 'opportunity') updatedCustomer.aiOpportunityAnalysis = analysisResult;
                if (type === 'nextStep') updatedCustomer.aiNextStepSuggestion = analysisResult;
                if (type === 'sentiment') updatedCustomer.aiSentimentAnalysis = analysisResult;
                await updateCustomer(updatedCustomer);
            } else {
                showNotification('aiError', 'error');
            }

        } catch (error) {
             showNotification('aiError', 'error');
        } finally {
            setLoadingAI(prev => ({ ...prev, [type]: false }));
        }
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('customerDetail')} size="4xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Panel: Info */}
                <div className="md:col-span-1 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
                            {customer.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-cnk-txt-primary-light">{customer.name}</h3>
                            <p className="text-sm text-cnk-txt-secondary-light">{customer.commercialTitle}</p>
                        </div>
                    </div>
                    <div className="space-y-3 text-sm">
                        <InfoItem label={t('email')} value={customer.email} />
                        <InfoItem label={t('phone')} value={customer.phone1} />
                        <InfoItem label={t('address')} value={customer.address} />
                    </div>
                    <div className="border-t pt-4 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => onEdit(customer)} icon="fas fa-edit">{t('edit')}</Button>
                        <Button size="sm" variant="secondary" onClick={handleCreateAppointment} icon="fas fa-calendar-plus">{t('addAppointment')}</Button>
                    </div>
                </div>

                {/* Right Panel: Tabs */}
                <div className="md:col-span-2">
                    <div className="flex border-b border-cnk-border-light mb-4">
                        <button onClick={() => setActiveTab('timeline')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${activeTab === 'timeline' ? 'border-b-2 border-cnk-accent-primary text-cnk-accent-primary' : 'text-cnk-txt-muted-light'}`}>
                            <i className="fas fa-history"></i>
                            <span>{t('activityTimeline')}</span>
                        </button>
                        <button onClick={() => setActiveTab('ai')} className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${activeTab === 'ai' ? 'border-b-2 border-cnk-accent-primary text-cnk-accent-primary' : 'text-cnk-txt-muted-light'}`}>
                            <i className="fas fa-robot"></i>
                            <span>{t('aiAnalysis')}</span>
                        </button>
                    </div>

                    {activeTab === 'timeline' && <ActivityTimeline customerId={customer.id} />}
                    
                    {activeTab === 'ai' && (
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            <AIAnalysisSection 
                                title={t('opportunityAnalysis')}
                                icon="fa-lightbulb"
                                analysisData={customer.aiOpportunityAnalysis}
                                onRun={() => handleRunAnalysis('opportunity')}
                                isLoading={loadingAI.opportunity}
                            />
                             <AIAnalysisSection 
                                title={t('suggestNextStep')}
                                icon="fa-shoe-prints"
                                analysisData={customer.aiNextStepSuggestion}
                                onRun={() => handleRunAnalysis('nextStep')}
                                isLoading={loadingAI.nextStep}
                            />
                             <AIAnalysisSection 
                                title={t('sentimentAnalysis')}
                                icon="fa-smile-beam"
                                analysisData={customer.aiSentimentAnalysis}
                                onRun={() => handleRunAnalysis('sentiment')}
                                isLoading={loadingAI.sentiment}
                            />
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default CustomerDetailModal;