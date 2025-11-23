import React from 'react';

interface IconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const Sort: React.FC<IconProps> = ({ width = 16, height = 16, className }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <path
      d="M3 6h18M7 12h10M10 18h4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

