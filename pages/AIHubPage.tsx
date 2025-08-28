
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import Button from '../components/common/Button';
import { useNotification } from '../contexts/NotificationContext';
import * as aiService from '../services/aiService';

interface AICardProps {
    title: string;
    description: string;
    icon: string;
    placeholder: string;
    buttonText: string;
    onAction: (input: string) => Promise<{ success: boolean; text: string }>;
    isTextArea?: boolean;
}

const AICard = ({ title, description, icon, placeholder, buttonText, onAction, isTextArea = false }: AICardProps) => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { showNotification } = useNotification();
    const { t } = useLanguage();

    const handleAction = async () => {
        if (!input) return;
        setIsLoading(true);
        setOutput('');
        try {
            const result = await onAction(input);
            if(result.success) {
                setOutput(result.text);
            } else {
                showNotification('aiError', 'error');
                setOutput(result.text);
            }
        } catch(e) {
            showNotification('aiError', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="rounded-xl border border-cnk-border bg-cnk-panel p-6 shadow-sm flex flex-col">
            <div className="flex items-start gap-4 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cnk-accent/10 text-cnk-accent text-2xl">
                    <i className={`fas ${icon}`}></i>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-cnk-txt-primary">{title}</h2>
                    <p className="text-sm text-cnk-txt-muted">{description}</p>
                </div>
            </div>
            <div className="flex-grow flex flex-col">
                {isTextArea ? (
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={placeholder}
                        rows={5}
                        className="w-full flex-grow mt-1 p-2 border border-cnk-border bg-cnk-bg rounded-md"
                    />
                ) : (
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={placeholder}
                        className="w-full mt-1 p-2 border border-cnk-border bg-cnk-bg rounded-md"
                    />
                )}
                <Button onClick={handleAction} isLoading={isLoading} className="mt-3">{buttonText}</Button>
                {output && (
                    <div className="mt-4 p-3 bg-cnk-bg rounded-md border border-cnk-border flex-grow">
                        <h3 className="font-semibold text-cnk-accent">{t('aiHubOutput')}:</h3>
                        <p className="text-cnk-txt-secondary whitespace-pre-wrap text-sm">{output}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const AIHubPage = () => {
    const { t } = useLanguage();
    const { customers } = useData();

    const aiCards: AICardProps[] = [
        {
            title: t('aiHubSalesExpertTitle'),
            description: t('aiHubSalesExpertDesc'),
            icon: 'fa-envelope-open-text',
            placeholder: t('aiHubInputPlaceholder'),
            buttonText: t('aiHubGenerate'),
            onAction: aiService.generateMarketingEmail
        },
        {
            title: t('aiHubCrmExpertTitle'),
            description: t('aiHubCrmExpertDesc'),
            icon: 'fa-users-cog',
            placeholder: 'Analiz edilecek müşteri notlarını buraya yapıştırın...',
            buttonText: t('aiHubAnalyze'),
            onAction: aiService.analyzeCustomerInteractionForHub,
            isTextArea: true,
        },
        {
            title: t('aiHubMarketExpertTitle'),
            description: t('aiHubMarketExpertDesc'),
            icon: 'fa-chart-pie',
            placeholder: t('aiHubInputPlaceholder'),
            buttonText: t('aiHubGenerate'),
            onAction: aiService.createMarketReport
        },
        {
            title: t('aiHubFinanceExpertTitle'),
            description: t('aiHubFinanceExpertDesc'),
            icon: 'fa-file-invoice-dollar',
            placeholder: 'Finansal verileri buraya girin (örn: Gelir: 50000, Gider: 30000)',
            buttonText: t('aiHubAnalyze'),
            onAction: aiService.getFinancialSummary
        },
        {
            title: t('aiHubSoftwareExpertTitle'),
            description: t('aiHubSoftwareExpertDesc'),
            icon: 'fa-code',
            placeholder: 'Teknik sorunuzu buraya yazın...',
            buttonText: t('aiHubAsk'),
            onAction: aiService.answerTechnicalQuestion
        },
        {
            title: t('aiHubAgentModeTitle'),
            description: t('aiHubAgentModeDesc'),
            icon: 'fa-user-secret',
            placeholder: t('aiHubAgentInputPlaceholder'),
            buttonText: t('aiHubExecute'),
            onAction: aiService.executeAgentTask,
            isTextArea: true,
        },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {aiCards.map(card => <AICard key={card.title} {...card} />)}
        </div>
    );
};

export default AIHubPage;
