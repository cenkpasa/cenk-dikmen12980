import React, { ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

const Modal = ({ isOpen, onClose, title, children, footer, size = 'lg' }: ModalProps) => {
    if (!isOpen) return null;

    const sizeClasses = {
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        '5xl': 'max-w-5xl'
    };

    return (
        <div 
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 transition-opacity p-4"
            onClick={onClose}
        >
            <div
                className={`relative mx-4 w-full ${sizeClasses[size]} transform rounded-xl bg-cnk-panel-light text-cnk-txt-secondary-light p-6 shadow-xl transition-all flex flex-col`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between border-b border-cnk-border-light pb-4 flex-shrink-0">
                    <h3 className="text-xl font-semibold text-cnk-accent-primary">{title}</h3>
                    <button onClick={onClose} className="text-2xl text-cnk-txt-muted-light hover:text-cnk-txt-primary-light">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="modal-body my-4 overflow-y-auto pr-2 flex-grow">
                    {children}
                </div>
                {footer && (
                    <div className="modal-actions flex justify-end gap-3 border-t border-cnk-border-light pt-4 flex-shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;