import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ViewState } from '../../App';
import NotificationBell from './NotificationBell';
import CnkLogo from '../assets/CnkLogo';

interface HeaderProps {
    view: ViewState;
    setView: (view: ViewState) => void;
    onToggleLeftSidebar: () => void;
}

const Header = ({ view, setView, onToggleLeftSidebar }: HeaderProps) => {
    const { t } = useLanguage();

    const PAGE_TITLES: Record<string, string> = {
        'dashboard': 'dashboard',
        'customers': 'customerList',
        'email': 'emailTitle',
        'appointments': 'appointmentsTitle',
        'gorusme-formu': 'interviewFormsTitle',
        'teklif-yaz': 'offerManagement',
        'personnel': 'personnelManagement',
        'hesaplama-araclari': 'calculationTools',
        'profile': 'profileTitle',
        'yapay-zeka': 'aiHubTitle',
        'konum-takip': 'locationTracking',
        'erp-entegrasyonu': 'erpIntegration',
        'ai-ayarlari': 'aiSettings',
        'raporlar': 'reports',
        'email-taslaklari': 'emailDrafts',
        'mutabakat': 'mutabakat'
    };
    
    const pageTitleKey = PAGE_TITLES[view.page] || 'dashboard';

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-cnk-border-light bg-cnk-panel-light px-4 md:px-6">
            <div className="flex items-center gap-4">
                <button onClick={onToggleLeftSidebar} className="text-2xl text-cnk-txt-muted-light md:hidden">
                    <i className="fas fa-bars"></i>
                </button>
                <div className="hidden md:block">
                    <h1 className="text-xl font-semibold text-cnk-txt-primary-light">{t(pageTitleKey)}</h1>
                </div>
            </div>
            
            <div className="md:hidden">
                <CnkLogo className="h-10"/>
            </div>

            <div className="flex items-center gap-4">
                <NotificationBell setView={setView}/>
            </div>
        </header>
    );
};

export default Header;