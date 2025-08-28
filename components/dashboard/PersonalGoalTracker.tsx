import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import * as aiService from '../../services/aiService';

const PersonalGoalTracker = ({ target, current }: { target: number, current: number }) => {
    const { t } = useLanguage();
    const [aiSuggestion, setAiSuggestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const progress = target > 0 ? (current / target) * 100 : 0;
    const remaining = Math.max(0, target - current);
    const daysLeft = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();

    const getAiSuggestion = async () => {
        setIsLoading(true);
        const result = await aiService.analyzeSalesPerformance('Mevcut Kullanıcı', target, current, daysLeft);
        if (result.success) {
            setAiSuggestion(result.text);
        }
        setIsLoading(false);
    };

    return (
        <div className="bg-cnk-panel-light p-6 rounded-xl shadow-sm border border-cnk-border-light h-full">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg text-cnk-txt-primary-light">{t('monthlySalesTarget')}</h3>
                <span className="font-bold text-cnk-accent-primary text-xl">{target.toLocaleString('tr-TR')} ₺</span>
            </div>
            <div className="w-full bg-cnk-bg-light rounded-full h-4 my-3">
                <div 
                    className="bg-cnk-accent-green h-4 rounded-full text-white text-xs flex items-center justify-center transition-all duration-500" 
                    style={{ width: `${Math.min(progress, 100)}%`}}
                >
                    {progress > 10 && `%${progress.toFixed(0)}`}
                </div>
            </div>
            <div className="flex justify-between text-sm text-cnk-txt-secondary-light">
                <span>{t('achieved')}: {current.toLocaleString('tr-TR')} ₺</span>
                <span>{t('remaining')}: {remaining.toLocaleString('tr-TR')} ₺</span>
            </div>
            <div className="mt-4 pt-4 border-t border-cnk-border-light">
                <button onClick={getAiSuggestion} disabled={isLoading} className="text-sm text-cnk-accent-primary hover:underline disabled:opacity-50">
                    <i className="fas fa-robot mr-2"></i>
                    {t('getAISuggestionForTarget')}
                </button>
                {isLoading && <p className="text-sm mt-2">Analiz ediliyor...</p>}
                {aiSuggestion && (
                    <div className="mt-2 p-3 bg-cnk-bg-light rounded-md text-sm whitespace-pre-wrap">
                        {aiSuggestion}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PersonalGoalTracker;
