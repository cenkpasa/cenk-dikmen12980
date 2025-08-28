import React from 'react';
import { useNotificationCenter } from '../../contexts/NotificationCenterContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Notification } from '../../types';
import { ViewState } from '../../App';
import Button from '../common/Button';

interface NotificationPanelProps {
    setView: (view: ViewState) => void;
    onClose: () => void;
}

const NotificationPanel = ({ setView, onClose }: NotificationPanelProps) => {
    const { notifications, markAsRead, markAllAsRead } = useNotificationCenter();
    const { t } = useLanguage();

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            setView({ page: notification.link.page, id: notification.link.id });
        }
        onClose();
    };

    const getIconForType = (type: Notification['type']) => {
        const iconMap = {
            customer: 'fa-user-plus',
            appointment: 'fa-calendar-check',
            offer: 'fa-file-invoice-dollar',
            interview: 'fa-file-signature',
            system: 'fa-cog',
        };
        return iconMap[type] || 'fa-info-circle';
    };

    return (
        <div className="absolute top-full right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-2xl border border-slate-200 z-50">
            <div className="flex justify-between items-center p-3 border-b">
                <h3 className="font-semibold">Bildirimler</h3>
                <Button size="sm" variant="secondary" onClick={markAllAsRead}>{t('markAllAsRead')}</Button>
            </div>
            <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                    notifications.map(notif => (
                        <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`flex items-start gap-3 p-3 border-b hover:bg-slate-50 cursor-pointer ${!notif.isRead ? 'bg-blue-50' : ''}`}
                        >
                            <div className="flex-shrink-0 mt-1">
                                <i className={`fas ${getIconForType(notif.type)} text-slate-500`}></i>
                            </div>
                            <div className="flex-grow">
                                <p className="text-sm text-text-dark">{t(notif.messageKey, notif.replacements)}</p>
                                <p className="text-xs text-slate-400">{new Date(notif.timestamp).toLocaleString()}</p>
                            </div>
                            {!notif.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>}
                        </div>
                    ))
                ) : (
                    <p className="p-4 text-center text-sm text-slate-500">Yeni bildirim yok.</p>
                )}
            </div>
        </div>
    );
};

export default NotificationPanel;