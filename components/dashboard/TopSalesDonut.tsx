import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const TopSalesDonut = () => {
    const { t } = useLanguage();
    const percentage = 66;
    const circumference = 2 * Math.PI * 45; // r=45
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="bg-cnk-panel-light p-5 rounded-xl shadow-sm border border-cnk-border-light h-full flex flex-col items-center justify-center">
            <h3 className="font-semibold text-cnk-txt-primary-light mb-4">{t('topSalesDonutTitle')}</h3>
            <div className="relative w-40 h-40">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="transparent" stroke="#e2e8f0" strokeWidth="10" />
                    <circle
                        cx="50" cy="50" r="45" fill="transparent"
                        stroke="#3b82f6" strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        transform="rotate(-90 50 50)"
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-cnk-txt-primary-light">{percentage}</span>
                </div>
            </div>
             <p className="text-sm text-cnk-txt-muted-light mt-2 text-center">Standart Planlar <br /> 100</p>
        </div>
    );
};

export default TopSalesDonut;