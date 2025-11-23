import React from 'react';

interface IconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const Moon: React.FC<IconProps> = ({ width = 16, height = 16, className }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

