
import React from 'react';

export const AtemiMXLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 120 30" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#1e40af', stopOpacity: 1 }} />
            </linearGradient>
        </defs>
        <text x="0" y="22" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="bold" fill="url(#logoGradient)">
            Atemi
        </text>
        <text x="75" y="22" fontFamily="Arial, sans-serif" fontSize="24" fontWeight="300" fill="#4b5563">
            MX
        </text>
    </svg>
);
