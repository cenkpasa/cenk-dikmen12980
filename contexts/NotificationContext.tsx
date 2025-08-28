
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useLanguage } from './LanguageContext';

interface Notification {
    id: number;
    messageKey: string;
    type: 'success' | 'error' | 'warning' | 'info';
    replacements?: Record<string, string>;
}

interface NotificationContextType {
    showNotification: (messageKey: string, type?: Notification['type'], replacements?: Record<string, string>) => void;
    NotificationContainer: () => React.JSX.Element;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationComponentProps {
    notification: Notification;
    onDismiss: (id: number) => void;
}

const NotificationComponent = ({ notification, onDismiss }: NotificationComponentProps) => {
    const { t } = useLanguage();
    const message = t(notification.messageKey, notification.replacements);

    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(notification.id);
        }, 3000);
        return () => clearTimeout(timer);
    }, [notification.id, onDismiss]);

    const typeClasses = {
        success: 'border-green-500',
        error: 'border-red-500',
        warning: 'border-amber-500',
        info: 'border-blue-500',
    };
    const iconClasses = {
        success: 'fa-check-circle text-green-500',
        error: 'fa-times-circle text-red-500',
        warning: 'fa-exclamation-triangle text-amber-500',
        info: 'fa-info-circle text-blue-500',
    };

    return (
        <div className={`notification relative flex w-full max-w-sm animate-slideInRight items-center gap-4 overflow-hidden rounded-lg bg-white p-4 shadow-lg border-l-4 ${typeClasses[notification.type]}`}>
            <div className={`icon text-2xl ${iconClasses[notification.type]}`}>
                <i className={`fas ${iconClasses[notification.type]}`}></i>
            </div>
            <div className="message flex-grow text-sm text-text-dark">{message}</div>
            <button onClick={() => onDismiss(notification.id)} className="close-btn text-gray-400 hover:text-gray-600">
                <i className="fas fa-times"></i>
            </button>
        </div>
    );
};

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const showNotification = useCallback((messageKey: string, type: Notification['type'] = 'info', replacements: Record<string, string> = {}) => {
        const newNotification: Notification = {
            id: Date.now(),
            messageKey,
            type,
            replacements
        };
        setNotifications(prev => [...prev, newNotification]);
    }, []);

    const dismissNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const NotificationContainer = () => (
        <div id="notification-container" className="fixed top-5 right-5 z-[10001] flex flex-col gap-3">
            {notifications.map(n => (
                <NotificationComponent key={n.id} notification={n} onDismiss={dismissNotification} />
            ))}
        </div>
    );

    return (
        <NotificationContext.Provider value={{ showNotification, NotificationContainer }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
