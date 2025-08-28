import React from 'react';

interface EmptyStateProps {
    icon: string;
    message: string;
    action?: React.ReactNode;
}

const EmptyState = ({ icon, message, action }: EmptyStateProps) => {
    return (
        <div className="text-center p-8">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-slate-100 text-slate-400 mx-auto mb-4 text-3xl">
                <i className={icon}></i>
            </div>
            <p className="text-slate-500">{message}</p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
};

export default EmptyState;