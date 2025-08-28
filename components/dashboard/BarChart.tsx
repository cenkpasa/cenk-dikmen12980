import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const BarChart = () => {
    const { t } = useLanguage();
    const data = [
        { day: 'Pzt', value: 65 }, { day: 'Sal', value: 59 }, { day: 'Çar', value: 80 },
        { day: 'Per', value: 81 }, { day: 'Cum', value: 56 }, { day: 'Cmt', value: 55 },
        { day: 'Paz', value: 40 }
    ];

    return (
        <div className="bg-cnk-panel-light p-5 rounded-xl shadow-sm border border-cnk-border-light h-full">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-cnk-txt-primary-light">{t('barChartTitle')}</h3>
                <button className="text-sm text-cnk-txt-muted-light bg-cnk-bg-light px-3 py-1 rounded-md hover:bg-cnk-border-light">
                    {t('week')} <i className="fas fa-chevron-down ml-1 text-xs"></i>
                </button>
            </div>
            <div className="flex items-end h-48 space-x-2">
                {data.map(item => (
                    <div key={item.day} className="flex-1 flex flex-col items-center justify-end">
                        <div 
                            className="w-4/5 bg-blue-400 rounded-t-md transition-all hover:bg-blue-500" 
                            style={{ height: `${item.value}%` }}
                            title={`${item.day}: ${item.value}`}
                        ></div>
                        <p className="text-xs text-cnk-txt-muted-light mt-1">{item.day}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BarChart;
