import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/dbService';
import { Notification, Page } from '../types';
import { v4 as uuidv4 } from 'uuid';

export type NewNotificationData = {
    messageKey: string;
    replacements?: Record<string, string>;
    type: 'customer' | 'appointment' | 'offer' | 'interview' | 'system';
    link?: { page: Page, id?: string };
};

interface NotificationCenterContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (data: NewNotificationData) => Promise<void>;
    markAsRead: (notificationId: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

const NotificationCenterContext = createContext<NotificationCenterContextType | undefined>(undefined);

export const NotificationCenterProvider = ({ children }: { children: ReactNode }) => {
    
    const notifications = useLiveQuery(
        () => db.notifications.orderBy('timestamp').reverse().toArray(),
        []
    ) || [];

    const unreadCount = useLiveQuery(
        () => db.notifications.where('isRead').equals(0).count(),
        [],
        0
    );

    const addNotification = useCallback(async (data: NewNotificationData) => {
        const newNotification: Notification = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            isRead: false,
            ...data,
        };
        await db.notifications.add(newNotification);
    }, []);

    const markAsRead = useCallback(async (notificationId: string) => {
        await db.notifications.update(notificationId, { isRead: true });
    }, []);

    const markAllAsRead = useCallback(async () => {
        const unreadIds = (await db.notifications.where('isRead').equals(0).primaryKeys()).map(String);
        if (unreadIds.length > 0) {
            await db.notifications.bulkUpdate(unreadIds.map(id => ({ key: id, changes: { isRead: true } })));
        }
    }, []);

    const value = {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
    };

    return (
        <NotificationCenterContext.Provider value={value}>
            {children}
        </NotificationCenterContext.Provider>
    );
};

export const useNotificationCenter = (): NotificationCenterContextType => {
    const context = useContext(NotificationCenterContext);
    if (!context) {
        throw new Error('useNotificationCenter must be used within a NotificationCenterProvider');
    }
    return context;
};