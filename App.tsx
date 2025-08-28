import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useNotification } from './contexts/NotificationContext';
import LoginPage from './pages/LoginPage';
import SidebarLeft from './components/layout/SidebarLeft';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Appointments from './pages/Appointments';
import InterviewFormPage from './pages/InterviewFormPage';
import OfferPage from './pages/OfferPage';
import Users from './pages/Users';
import CalculationToolsPage from './pages/CalculationToolsPage';
import Profile from './pages/Profile';
import Loader from './components/common/Loader';
import { Page as PageType } from './types';
import EmailPage from './pages/EmailPage';
import AIHubPage from './pages/AIHubPage';
import LocationTrackingPage from './pages/LocationTrackingPage';
import ErpIntegrationPage from './pages/ErpIntegrationPage';
import Header from './components/layout/Header';
import { useSettings } from './contexts/SettingsContext';
import { runAIAgent } from './services/aiAgentService';
import { useNotificationCenter } from './contexts/NotificationCenterContext';
import AISettingsPage from './pages/AISettingsPage';
import ReportPage from './pages/ReportPage';
import EmailDraftsPage from './pages/EmailDraftsPage';
import ReconciliationPage from './pages/ReconciliationPage';
import AuditLogPage from './pages/AuditLogPage';

export type ViewState = {
    page: PageType;
    id?: string;
};

const PageContent = ({ view, setView }: { view: ViewState; setView: (view: ViewState) => void; }) => {
    switch (view.page) {
        case 'dashboard': return <Dashboard setView={setView} />;
        case 'customers': return <Customers setView={setView} />;
        case 'email': return <EmailPage />;
        case 'appointments': return <Appointments />;
        case 'gorusme-formu': return <InterviewFormPage setView={setView} view={view} />;
        case 'teklif-yaz': return <OfferPage setView={setView} view={view} />;
        case 'personnel': return <Users />;
        case 'konum-takip': return <LocationTrackingPage />;
        case 'hesaplama-araclari': return <CalculationToolsPage />;
        case 'yapay-zeka': return <AIHubPage />;
        case 'erp-entegrasyonu': return <ErpIntegrationPage />;
        case 'profile': return <Profile />;
        case 'ai-ayarlari': return <AISettingsPage />;
        case 'raporlar': return <ReportPage />;
        case 'email-taslaklari': return <EmailDraftsPage setView={setView} />;
        case 'mutabakat': return <ReconciliationPage />;
        case 'audit-log': return <AuditLogPage />;
        default: return <Dashboard setView={setView} />;
    }
};

const App = () => {
    const { currentUser, loading } = useAuth();
    const { NotificationContainer } = useNotification();
    const [view, setView] = useState<ViewState>({ page: 'dashboard' });
    const [isLeftSidebarOpen, setLeftSidebarOpen] = useState(false);

    const { settings } = useSettings();
    const { addNotification } = useNotificationCenter();

    useEffect(() => {
        const initializeAIAgent = async () => {
            if (settings) {
                const insights = await runAIAgent(settings);
                await Promise.all(
                    insights.map(insight => addNotification(insight))
                );
            }
        };
        const timer = setTimeout(initializeAIAgent, 3000);
        return () => clearTimeout(timer);
    }, [settings, addNotification]);
    
    useEffect(() => {
        if (!currentUser) {
            setLeftSidebarOpen(false);
        }
    }, [currentUser]);

    if (loading) {
        return <Loader fullScreen={true} />;
    }

    if (!currentUser) {
        return (
            <>
                <NotificationContainer />
                <LoginPage />
            </>
        );
    }
    
    return (
        <div className="app-container grid min-h-screen bg-cnk-bg-light text-cnk-txt-secondary-light md:grid-cols-[260px_1fr]">
            <NotificationContainer />
            
            <SidebarLeft view={view} setView={setView} isOpen={isLeftSidebarOpen} setIsOpen={setLeftSidebarOpen} />
            
            <div className="flex flex-col flex-grow min-w-0">
                <Header 
                    view={view} 
                    onToggleLeftSidebar={() => setLeftSidebarOpen(true)}
                    setView={setView}
                />
                <main className="main-content flex-grow overflow-y-auto bg-cnk-bg-light p-4 md:p-6">
                     <div id="page-content" className="min-h-[calc(100vh-120px)]">
                        <PageContent view={view} setView={setView} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;