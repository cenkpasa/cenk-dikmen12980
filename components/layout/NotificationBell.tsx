import React, { useState, useRef, useEffect } from 'react';
import { useNotificationCenter } from '../../contexts/NotificationCenterContext';
import NotificationPanel from './NotificationPanel';
import { ViewState } from '../../App';

interface NotificationBellProps {
    setView: (view: ViewState) => void;
}

const NotificationBell = ({ setView }: NotificationBellProps) => {
    const { unreadCount } = useNotificationCenter();
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsPanelOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);


    return (
        <div className="relative" ref={wrapperRef}>
            <button 
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                className="relative h-10 w-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                aria-label="Notifications"
            >
                <i className="fas fa-bell"></i>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        {unreadCount}
                    </span>
                )}
            </button>
            {isPanelOpen && <NotificationPanel setView={setView} onClose={() => setIsPanelOpen(false)} />}
        </div>
    );
};

export default NotificationBell;