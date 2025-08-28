import React from 'react';

const CnkLogo = ({ className = 'h-10' }: { className?: string }) => (
    <svg viewBox="0 0 130 35" className={className} xmlns="http://www.w3.org/2000/svg">
        <rect width="130" height="35" rx="5" fill="#1e293b" />
        <path d="M8 4 H 28 V 31 H 8 V 26 L 18 21 L 8 16 V 11 L 18 16 L 8 21 V 4" stroke="#c00000" strokeWidth="2" fill="none" />
        <text x="35" y="25" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="white">CNK</text>
        <text x="80" y="25" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="#f1f5f9" opacity="0.8">Pro</text>
    </svg>
);

export default CnkLogo;
