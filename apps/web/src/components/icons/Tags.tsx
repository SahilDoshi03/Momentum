import React from 'react';

interface IconProps {
  width?: number;
  height?: number;
  className?: string;
}

export const Tags: React.FC<IconProps> = ({ width = 16, height = 16, className }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <path
      d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="7"
      y1="7"
      x2="7.01"
      y2="7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

