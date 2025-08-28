import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { AISettings } from '../types';
import { db } from '../services/dbService';
import { useAuth } from './AuthContext';

interface SettingsContextType {
    settings: AISettings | null;
    updateSettings: (newSettings: Partial<AISettings>) => Promise<void>;
    loadingSettings: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_AI_SETTINGS: Omit<AISettings, 'userId'> = {
    isAgentActive: true,
    enableFollowUpDrafts: true,
    enableAtRiskAlerts: true,
    followUpDays: 3,
    atRiskDays: 30,
};

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const { currentUser } = useAuth();
    const [settings, setSettings] = useState<AISettings | null>(null);
    const [loadingSettings, setLoadingSettings] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            if (!currentUser) {
                setSettings(null);
                setLoadingSettings(false);
                return;
            }

            setLoadingSettings(true);
            let userSettings = await db.aiSettings.get(currentUser.id);

            if (!userSettings) {
                userSettings = {
                    userId: currentUser.id,
                    ...DEFAULT_AI_SETTINGS,
                };
                await db.aiSettings.put(userSettings);
            }
            setSettings(userSettings);
            setLoadingSettings(false);
        };

        loadSettings();
    }, [currentUser]);

    const updateSettings = async (newSettings: Partial<AISettings>) => {
        if (!settings) return;

        const updated = { ...settings, ...newSettings };
        await db.aiSettings.put(updated);
        setSettings(updated);
    };

    const value = { settings, updateSettings, loadingSettings };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};
