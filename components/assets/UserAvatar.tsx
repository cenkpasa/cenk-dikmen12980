import React from 'react';

const UserAvatar = ({ className = 'h-24 w-24'}: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#475569" />
        <circle cx="50" cy="40" r="20" fill="#e2e8f0" />
        <path d="M20,90 a30,20 0 1,1 60,0" fill="#e2e8f0" />
    </svg>
);

export default UserAvatar;
