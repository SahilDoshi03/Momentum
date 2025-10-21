import React from 'react';

interface IconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const Filter: React.FC<IconProps> = ({ width = 16, height = 16, className }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <polygon
      points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

