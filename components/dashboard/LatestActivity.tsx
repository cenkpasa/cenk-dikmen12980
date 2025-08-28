import React from 'react';
import { useNotificationCenter } from '../../contexts/NotificationCenterContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { ViewState } from '../../App';
import { Notification } from '../../types';

interface LatestActivityProps {
    setView: (view: ViewState) => void;
}

const LatestActivity = ({ setView }: LatestActivityProps) => {
    const { t } = useLanguage();
    const { notifications, markAsRead } = useNotificationCenter();

    const latestActivities = notifications.slice(0, 5);

    const getIconForType = (type: Notification['type']) => {
        const iconMap = {
            customer: { icon: 'fa-user-plus', color: 'text-blue-500' },
            appointment: { icon: 'fa-calendar-check', color: 'text-green-500' },
            offer: { icon: 'fa-file-invoice-dollar', color: 'text-purple-500' },
            interview: { icon: 'fa-file-signature', color: 'text-orange-500' },
            system: { icon: 'fa-cog', color: 'text-slate-500' },
            reconciliation: { icon: 'fa-handshake', color: 'text-teal-500' },
        };
        return iconMap[type] || iconMap.system;
    };

    const handleActivityClick = (notification: Notification) => {
        if (notification.link) {
            if (!notification.isRead) {
                markAsRead(notification.id);
            }
            setView({ page: notification.link.page, id: notification.link.id });
        }
    };

    return (
        <div className="bg-cnk-panel-light p-5 rounded-xl shadow-sm border border-cnk-border-light h-full">
            <h3 className="font-semibold text-cnk-txt-primary-light mb-4">{t('latestActivityTitle')}</h3>
            {latestActivities.length > 0 ? (
                <ul className="space-y-4">
                    {latestActivities.map((activity) => {
                        const iconInfo = getIconForType(activity.type);
                        const isClickable = !!activity.link;
                        return (
                            <li 
                                key={activity.id} 
                                onClick={() => isClickable && handleActivityClick(activity)}
                                className={`flex items-start ${isClickable ? 'cursor-pointer group' : ''}`}
                            >
                                <div className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 flex-shrink-0 ${iconInfo.color}`}>
                                    <i className={`fas ${iconInfo.icon}`}></i>
                                </div>
                                <div className="flex-grow">
                                    <p className={`text-sm text-cnk-txt-secondary-light ${isClickable ? 'group-hover:text-cnk-accent-primary' : ''}`}>
                                        {t(activity.messageKey, activity.replacements)}
                                    </p>
                                    <p className="text-xs text-cnk-txt-muted-light">
                                        {new Date(activity.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-sm text-cnk-txt-muted-light text-center mt-8">{t('noRecentActivity')}</p>
            )}
        </div>
    );
};

export default LatestActivity;