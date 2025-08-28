
import React from 'react';

interface LoaderProps {
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
}

const Loader = ({ size = 'md', fullScreen = false }: LoaderProps) => {
    const sizeClasses = {
        sm: 'w-6 h-6 border-4',
        md: 'w-12 h-12 border-[5px]',
        lg: 'w-16 h-16 border-8',
    };

    const loader = (
        <div className={`loader animate-spin rounded-full border-solid border-primary border-t-transparent ${sizeClasses[size]}`}></div>
    );

    if (fullScreen) {
        return (
            <div className="loader-overlay fixed inset-0 z-[10002] flex items-center justify-center bg-white/80">
                {loader}
            </div>
        );
    }

    return loader;
};

export default Loader;
