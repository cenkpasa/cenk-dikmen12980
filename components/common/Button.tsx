import React, { ButtonHTMLAttributes, ReactNode } from 'react';
import Loader from './Loader';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'info' | 'login';
    size?: 'sm' | 'md' | 'lg';
    icon?: string;
    isLoading?: boolean;
    children?: ReactNode;
}

const Button = ({ 
    children, 
    variant = 'primary', 
    size = 'md', 
    icon, 
    isLoading = false, 
    className = '', 
    ...props 
}: ButtonProps) => {
    const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantClasses = {
        primary: 'bg-cnk-accent-primary text-white hover:bg-blue-600 focus:ring-cnk-accent-primary',
        secondary: 'bg-cnk-bg-light text-cnk-txt-secondary-light hover:bg-cnk-border-light focus:ring-cnk-border-light border border-cnk-border-light',
        danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 focus:ring-red-500 border border-red-500/30',
        success: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 focus:ring-emerald-500 border border-emerald-500/30',
        info: 'bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 focus:ring-sky-500 border border-sky-500/30',
        login: 'bg-emerald-500 text-white hover:bg-emerald-600 focus:ring-emerald-500 font-bold tracking-wider uppercase'
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <Loader size="sm" />
            ) : (
                <>
                    {icon && <i className={`${icon} ${children ? 'mr-2' : ''}`}></i>}
                    {children}
                </>
            )}
        </button>
    );
};

export default Button;
