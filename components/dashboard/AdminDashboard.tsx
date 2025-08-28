import React, { useMemo } from 'react';
import StatCard from './StatCard';
import BarChart from './BarChart';
import LatestActivity from './LatestActivity';
import TopSalesDonut from './TopSalesDonut';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ViewState } from '../../App';
import { useErp } from '../../contexts/ErpContext';
import AIInsightCenter from './AIInsightCenter';

const AdminDashboard = ({ setView }: { setView: (view: ViewState) => void; }) => {
    const { customers, appointments } = useData();
    const { users } = useAuth();
    const { invoices } = useErp();
    const { t } = useLanguage();
    
    const totalMonthlySales = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return invoices
            .filter(inv => {
                const invDate = new Date(inv.date);
                return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
            })
            .reduce((sum, inv) => sum + inv.totalAmount, 0);
    }, [invoices]);

    const pendingAppointments = appointments.filter(a => new Date(a.start) >= new Date()).length;

    return (
        <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard titleKey="dashboard_totalCustomers" value={String(customers.length)} change={t('customerCount', { count: String(customers.length) })} color="blue" />
                <StatCard titleKey="dashboard_pendingAppointments" value={String(pendingAppointments)} change={t('appointmentCount', { count: String(pendingAppointments) })} color="pink" />
                <StatCard titleKey="dashboard_totalUsers" value={String(users.length)} change={t('userCount', { count: String(users.length) })} color="yellow" />
                <StatCard titleKey="dashboard_monthlySales" value={`${totalMonthlySales.toLocaleString('tr-TR')}₺`} change={t('totalTeamSales')} color="green" />
            </div>

            {/* Charts & AI */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2"><BarChart /></div>
                <div className="lg:col-span-1"><AIInsightCenter setView={setView} /></div>
            </div>
            
            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2"><LatestActivity setView={setView} /></div>
                <div className="lg:col-span-1"><TopSalesDonut /></div>
            </div>
        </div>
    );
};

export default AdminDashboard;