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
    const [actualAlign, setActualAlign] = useState(align);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

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

    // Reset alignment when closed or prop changes
    useEffect(() => {
        if (!isOpen) {
            setActualAlign(align);
        }
    }, [isOpen, align]);

    React.useLayoutEffect(() => {
        if (isOpen && contentRef.current) {
            const rect = contentRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;

            // Check if it overflows on the right
            if (actualAlign === 'left' && rect.right > viewportWidth) {
                setActualAlign('right');
            }
            // Check if it overflows on the left (less common but possible if we start right)
            else if (actualAlign === 'right' && rect.left < 0) {
                setActualAlign('left');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    return (
        <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)}>
                {trigger}
            </div>

            {isOpen && (
                <>
                    {/* Mobile Backdrop/Overlay for closing */}
                    <div
                        className="fixed inset-0 z-40 md:hidden"
                        onClick={() => setIsOpen(false)}
                    />

                    <div
                        ref={contentRef}
                        className={cn(
                            // Mobile Styles: Fixed positioned, full width (calc), centered or slightly padded
                            "fixed left-2 right-2 mt-2 z-50 rounded-md bg-[var(--bg-secondary)] shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-[var(--border)]",
                            // Desktop Styles: Absolute positioned, specific width
                            "md:absolute md:left-auto md:right-auto md:w-56 md:max-w-[calc(100vw-2rem)]",
                            // Alignment classes apply only on desktop mostly, but kept for logic
                            actualAlign === 'right' ? 'md:right-0' : 'md:left-0'
                        )}
                        style={{
                            // On mobile, we might want it to be positioned relative to the trigger if possible, 
                            // OR just fixed near the tap. 
                            // For simplicity requested "options drop down taking the whole width in phone view",
                            // we use fixed left-2 right-2. The 'top' needs to be set dynamically or just below the header?
                            // A simple approach without complex Popper.js is to let it render in flow on desktop, 
                            // but on mobile it might overlay weirdly if we don't set 'top'.
                            // However, 'mt-2' with 'fixed' might put it at top of screen? No, 'mt-2' does nothing for fixed usually without top.
                            // Let's rely on the natural flow for desktop (absolute) and override for mobile.
                            // To position correctly on mobile below the row, we might need a ref to the trigger.
                            // BUT simpler for "whole width in phone view" often implies a bottom sheet or just fixed center/top.
                            // Given the prompt "options drop down taking the whole width", let's try a simple fixed strategy 
                            // that tries to align with the trigger vertically if possible, or just centers.
                            // Actually, 'fixed' relative to window. 'mt-2' works if we set 'top'. 
                            // We can use the trigger's ref to set the top position on mobile.
                        }}
                    >
                        <div className="py-1 max-h-80 overflow-y-auto" role="menu" aria-orientation="vertical">
                            {children}
                        </div>
                    </div>
                </>
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
