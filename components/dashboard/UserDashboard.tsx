import React, { useMemo } from 'react';
import StatCard from './StatCard';
import LatestActivity from './LatestActivity';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ViewState } from '../../App';
import { useErp } from '../../contexts/ErpContext';
import PersonalGoalTracker from './PersonalGoalTracker';
// import UpcomingAppointments from './UpcomingAppointments'; // This can be a future component

const UserDashboard = ({ setView }: { setView: (view: ViewState) => void; }) => {
    const { currentUser } = useAuth();
    const { appointments } = useData();
    const { invoices } = useErp();
    const { t } = useLanguage();
    
    const userSales = useMemo(() => {
        if (!currentUser) return 0;
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return invoices
            .filter(inv => {
                const invDate = new Date(inv.date);
                return inv.userId === currentUser.id && invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
            })
            .reduce((sum, inv) => sum + inv.totalAmount, 0);
    }, [invoices, currentUser]);

    const userAppointments = useMemo(() => {
        if (!currentUser) return [];
        return appointments.filter(a => a.userId === currentUser.id && new Date(a.start) >= new Date());
    }, [appointments, currentUser]);

    if (!currentUser) return null;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-cnk-txt-primary-light">{t('welcomeMessage', { name: currentUser.name })}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <PersonalGoalTracker 
                        target={currentUser.salesTarget || 0} 
                        current={userSales} 
                    />
                </div>
                <div className="space-y-4">
                     <StatCard titleKey="dashboard_yourSales" value={`${userSales.toLocaleString('tr-TR')}₺`} change="" color="green" />
                     <StatCard titleKey="dashboard_upcomingAppointments" value={String(userAppointments.length)} change="" color="pink" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3">
                    <LatestActivity setView={setView} />
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
