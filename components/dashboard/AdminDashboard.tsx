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
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/dbService';

const AdminDashboard = ({ setView }: { setView: (view: ViewState) => void; }) => {
    const { customers, appointments } = useData();
    const { users } = useAuth();
    const { invoices } = useErp();
    const { t } = useLanguage();
    
    const incomingInvoices = useLiveQuery(() => db.incomingInvoices.toArray(), []) || [];
    const outgoingInvoices = useLiveQuery(() => db.outgoingInvoices.toArray(), []) || [];

    const totalIncoming = useMemo(() => incomingInvoices.reduce((sum, inv) => sum + inv.tutar, 0), [incomingInvoices]);
    const totalOutgoing = useMemo(() => outgoingInvoices.reduce((sum, inv) => sum + inv.tutar, 0), [outgoingInvoices]);
    const difference = totalOutgoing - totalIncoming;

    const pendingAppointments = appointments.filter(a => new Date(a.start) >= new Date()).length;

    return (
        <div className="space-y-6">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard titleKey="totalIncoming" value={`${totalIncoming.toLocaleString('tr-TR')}₺`} change="" color="blue" />
                <StatCard titleKey="totalOutgoing" value={`${totalOutgoing.toLocaleString('tr-TR')}₺`} change="" color="green" />
                <StatCard titleKey="reconciliationDifference" value={`${difference.toLocaleString('tr-TR')}₺`} change="" color="yellow" />
                <StatCard titleKey="dashboard_pendingAppointments" value={String(pendingAppointments)} change={t('appointmentCount', { count: String(pendingAppointments) })} color="pink" />
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