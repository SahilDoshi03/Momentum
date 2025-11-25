import React, { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface DropdownProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    align?: 'left' | 'right';
    className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
    trigger,
    children,
    align = 'left',
    className,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)}>
                {trigger}
            </div>

            {isOpen && (
                <div
                    className={cn(
                        "absolute z-50 mt-2 w-56 rounded-md bg-[var(--bg-secondary)] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-[var(--border)]",
                        align === 'right' ? 'right-0' : 'left-0'
                    )}
                >
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

interface DropdownItemProps {
    children: React.ReactNode;
    onClick?: () => void;
    active?: boolean;
    className?: string;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
    children,
    onClick,
    active,
    className,
}) => {
    return (
        <div
            className={cn(
                "block px-4 py-2 text-sm cursor-pointer hover:bg-[var(--hover)] text-[var(--text-primary)]",
                active && "bg-[var(--active)] text-[var(--primary)]",
                className
            )}
            role="menuitem"
            onClick={onClick}
        >
            {children}
        </div>
    );
};

interface DropdownDividerProps {
    className?: string;
}

export const DropdownDivider: React.FC<DropdownDividerProps> = ({ className }) => {
    return <div className={cn("h-px my-1 bg-[var(--border)]", className)} />;
};

interface DropdownHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export const DropdownHeader: React.FC<DropdownHeaderProps> = ({ children, className }) => {
    return (
        <div className={cn("px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider", className)}>
            {children}
        </div>
    );
};
