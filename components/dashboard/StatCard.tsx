import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface StatCardProps {
    titleKey: string;
    value: string;
    change: string;
    color: 'yellow' | 'pink' | 'green' | 'blue';
}

const StatCard = ({ titleKey, value, change, color }: StatCardProps) => {
    const { t } = useLanguage();

    const colorClasses = {
        yellow: 'from-amber-400 to-amber-500',
        pink: 'from-pink-400 to-pink-500',
        green: 'from-emerald-400 to-emerald-500',
        blue: 'from-blue-400 to-blue-500',
    };
    
    return (
        <div className="bg-cnk-panel-light p-5 rounded-xl shadow-sm border border-cnk-border-light">
            <div className={`w-full h-1.5 bg-gradient-to-r ${colorClasses[color]} rounded-full mb-3`}></div>
            <p className="text-sm text-cnk-txt-muted-light">{t(titleKey)}</p>
            <div className="flex items-end justify-between mt-1">
                <p className="text-3xl font-bold text-cnk-txt-primary-light">{value}</p>
                <div className="flex items-center text-xs font-semibold text-cnk-txt-muted-light">
                    <span>{change}</span>
                </div>
            </div>
        </div>
    );
};

export default StatCard;
