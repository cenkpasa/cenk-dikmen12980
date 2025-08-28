import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Page } from '../../types';
import { ViewState } from '../../App';
import CnkLogo from '../assets/CnkLogo';

interface NavLink {
    page: Page;
    labelKey: string;
    icon: string;
    adminOnly?: boolean;
}

const NAV_LINKS: NavLink[] = [
    { page: 'dashboard', labelKey: 'dashboard', icon: 'fas fa-tachometer-alt' },
    { page: 'customers', labelKey: 'customerList', icon: 'fas fa-users' },
    { page: 'appointments', labelKey: 'appointmentsTitle', icon: 'fas fa-calendar-check' },
    { page: 'gorusme-formu', labelKey: 'interviewFormsTitle', icon: 'fas fa-file-signature' },
    { page: 'teklif-yaz', labelKey: 'offerManagement', icon: 'fas fa-file-invoice-dollar' },
    { page: 'mutabakat', labelKey: 'reconciliation', icon: 'fas fa-handshake' },
    { page: 'email-taslaklari', labelKey: 'emailDrafts', icon: 'fas fa-envelope-open-text' },
    { page: 'yapay-zeka', labelKey: 'aiHubTitle', icon: 'fas fa-robot' },
    { page: 'raporlar', labelKey: 'reports', icon: 'fas fa-chart-line', adminOnly: true },
    { page: 'personnel', labelKey: 'personnelManagement', icon: 'fas fa-user-cog', adminOnly: true },
    { page: 'konum-takip', labelKey: 'locationTracking', icon: 'fas fa-map-marker-alt', adminOnly: true },
    { page: 'erp-entegrasyonu', labelKey: 'erpIntegration', icon: 'fas fa-cogs', adminOnly: true },
    { page: 'hesaplama-araclari', labelKey: 'calculationTools', icon: 'fas fa-calculator' },
    { page: 'profile', labelKey: 'profileTitle', icon: 'fas fa-user' },
    { page: 'ai-ayarlari', labelKey: 'aiSettings', icon: 'fas fa-cogs', adminOnly: true },
];

interface SidebarLeftProps {
    view: ViewState;
    setView: (view: ViewState) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
}

const SidebarLeft = ({ view, setView, isOpen, setIsOpen }: SidebarLeftProps) => {
    const { logout, currentUser } = useAuth();
    const { language, setLanguage, t } = useLanguage();

    const handleLinkClick = (newPage: Page) => {
        setView({ page: newPage });
        if (window.innerWidth < 768) {
            setIsOpen(false);
        }
    };

    return (
        <>
            <div 
                className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            ></div>
            <nav className={`fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-cnk-sidebar-dark text-cnk-sidebar-txt-dark transition-transform duration-300 md:relative md:transform-none ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-center gap-4 p-5">
                    <CnkLogo className="h-12" />
                </div>
                <ul className="flex-grow space-y-2 p-3">
                    {NAV_LINKS.map(link => {
                        if (link.adminOnly && currentUser?.role !== 'admin') {
                            return null;
                        }
                        const isActive = view.page === link.page;

                        return (
                            <li key={link.page}>
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handleLinkClick(link.page); }}
                                    className={`relative flex items-center justify-between rounded-md px-4 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-cnk-accent-primary text-white' : 'hover:bg-cnk-accent-primary/10 text-cnk-sidebar-txt-dark'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <i className={`${link.icon} w-5 text-center text-lg`}></i>
                                        <span>{t(link.labelKey)}</span>
                                    </div>
                                </a>
                            </li>
                        );
                    })}
                    <li>
                         <a href="#" onClick={(e) => {e.preventDefault(); logout();}} className="flex items-center gap-4 rounded-md px-4 py-3 text-sm font-medium transition-colors text-cnk-sidebar-txt-muted-dark hover:bg-cnk-accent-primary/10 hover:text-white">
                             <i className="fas fa-sign-out-alt w-5 text-center text-lg"></i>
                             <span>{t('loggedOut')}</span>
                         </a>
                    </li>
                </ul>
                <div className="mt-auto border-t border-slate-700 p-4">
                    <select 
                        id="language-select"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as 'tr' | 'en')}
                        className="w-full cursor-pointer rounded-lg border border-slate-600 bg-slate-700 p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cnk-accent-primary/50"
                    >
                        <option value="tr">Türkçe</option>
                        <option value="en">English</option>
                    </select>
                </div>
            </nav>
        </>
    );
};

export default SidebarLeft;