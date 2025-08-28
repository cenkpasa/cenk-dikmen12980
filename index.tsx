import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ErpProvider } from './contexts/ErpContext';
import { PersonnelProvider } from './contexts/PersonnelContext';
import { NotificationCenterProvider } from './contexts/NotificationCenterContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ReconciliationProvider } from './contexts/ReconciliationContext';
import { seedDatabase } from './services/dbService';
import Loader from './components/common/Loader';

const AppProviders = () => (
    <LanguageProvider>
      <NotificationProvider>
        <AuthProvider>
          <SettingsProvider>
            <NotificationCenterProvider>
              <DataProvider>
                  <ErpProvider>
                    <PersonnelProvider>
                      <ReconciliationProvider>
                        <App />
                      </ReconciliationProvider>
                    </PersonnelProvider>
                  </ErpProvider>
              </DataProvider>
            </NotificationCenterProvider>
          </SettingsProvider>
        </AuthProvider>
      </NotificationProvider>
    </LanguageProvider>
);


const AppInitializer = () => {
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const initialize = async () => {
            try {
                await seedDatabase();
            } catch (error) {
                console.error("Database seeding failed:", error);
            } finally {
                setIsInitialized(true);
            }
        };
        initialize();
    }, []);

    if (!isInitialized) {
        return <Loader fullScreen={true} />;
    }

    return <AppProviders />;
};


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppInitializer />
  </React.StrictMode>
);
