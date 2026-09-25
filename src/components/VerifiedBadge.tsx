import React from 'react';

interface VerifiedBadgeProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  className = '',
  size = 'sm',
}) => {
  const sizeMap = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const currentSize = sizeMap[size] || sizeMap.sm;

  return (
    <svg
      className={`${currentSize} inline-block shrink-0 drop-shadow-sm select-none ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Cont Verificat"
    >
      {/* 8-pointed starburst seal (two 45-degree overlapping rounded squares with 8 uniform peaks) */}
      <g fill="#10B981">
        {/* Base rounded square */}
        <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="3.5" />
        {/* Rotated 45-degree rounded square creating all 8 uniform rounded peaks */}
        <rect
          x="3.75"
          y="3.75"
          width="16.5"
          height="16.5"
          rx="3.5"
          transform="rotate(45 12 12)"
        />
      </g>

      {/* Crisp centered white checkmark */}
      <path
        d="M7.4 12.2l3.1 3.1 6.1-6.1"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
