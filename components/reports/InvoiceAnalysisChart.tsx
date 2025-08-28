import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ChartData {
    monthly: {
        labels: string[];
        data: number[];
    };
    categories: { name: string; value: number }[];
    summary: {
        totalCustomers: number;
        avgSpendPerCustomer: number;
    };
}

const StatCard = ({ label, value }: { label: string, value: string | number }) => (
    <div className="bg-cnk-bg-light p-4 rounded-lg text-center">
        <p className="text-sm font-medium text-cnk-txt-muted-light">{label}</p>
        <p className="text-2xl font-bold text-cnk-accent-primary">{value}</p>
    </div>
);

const InvoiceAnalysisChart = ({ chartData }: { chartData: ChartData }) => {
    const { t } = useLanguage();

    const { monthly, categories, summary } = chartData;
    const maxMonthly = Math.max(...monthly.data, 1);
    const totalCategorySpending = categories.reduce((sum, cat) => sum + cat.value, 0);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <StatCard label={t('totalCustomersInReport')} value={summary.totalCustomers} />
                <StatCard label={t('avgSpendPerCustomer')} value={`${summary.avgSpendPerCustomer.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}`} />
            </div>

            {/* Monthly Trend */}
            <div className="bg-cnk-bg-light p-4 rounded-lg">
                <h4 className="font-bold mb-4">{t('monthlySpendingTrend')}</h4>
                <div className="flex items-end h-48 space-x-2 border-l border-b border-cnk-border-light pl-2 pb-2">
                    {monthly.data.map((value, index) => (
                        <div key={monthly.labels[index]} className="flex-1 flex flex-col items-center justify-end group" title={`${new Date(monthly.labels[index] + '-02').toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}: ${value.toLocaleString('tr-TR')} TL`}>
                            <div 
                                className="w-4/5 bg-blue-400 rounded-t-md transition-all hover:bg-blue-500" 
                                style={{ height: `${(value / maxMonthly) * 100}%` }}
                            ></div>
                            <p className="text-xs text-cnk-txt-muted-light mt-1 whitespace-nowrap group-hover:font-bold">{new Date(monthly.labels[index] + '-02').toLocaleString('tr-TR', { month: 'short', year: '2-digit' })}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-cnk-bg-light p-4 rounded-lg">
                 <h4 className="font-bold mb-4">{t('categoryDistribution')}</h4>
                 <div className="space-y-2">
                    {categories.slice(0, 5).map(cat => {
                        const percentage = totalCategorySpending > 0 ? (cat.value / totalCategorySpending) * 100 : 0;
                        return (
                            <div key={cat.name}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-cnk-txt-secondary-light">{cat.name}</span>
                                    <span className="font-semibold text-cnk-txt-primary-light">{cat.value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                                </div>
                                <div className="w-full bg-cnk-border-light rounded-full h-2.5" title={`%${percentage.toFixed(1)}`}>
                                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                </div>
                            </div>
                        );
                    })}
                 </div>
            </div>
        </div>
    );
};

export default InvoiceAnalysisChart;