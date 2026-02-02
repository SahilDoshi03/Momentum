import React from 'react';

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    width,
    height,
    borderRadius = '0.5rem',
}) => {
    const style: React.CSSProperties = {
        width,
        height,
        borderRadius,
    };

    return (
        <div
            className={`animate-pulse bg-[var(--bg-secondary)] border border-[var(--border)] selection:bg-none ${className}`}
            style={style}
        />
    );
};
