import React from 'react';

interface IconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const CheckCircle: React.FC<IconProps> = ({ width = 16, height = 16, className }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <path
      d="M22 11.08V12a10 10 0 1 1-5.93-9.14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <polyline
      points="22,4 12,14.01 9,11.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

