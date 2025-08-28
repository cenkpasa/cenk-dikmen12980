
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { MESSAGES } from '../constants';

type Language = 'tr' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, replacements?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
    const [language, setLanguageState] = useState<Language>(() => {
        return (localStorage.getItem('appLang') as Language) || 'tr';
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('appLang', lang);
    };

    const t = useCallback((key: string, replacements: Record<string, string> = {}) => {
        let text = MESSAGES[language][key] || key;
        for (const repKey in replacements) {
            text = text.replace(`{${repKey}}`, replacements[repKey]);
        }
        return text;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
