'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logout, getCurrentUser, AuthUser } from '@/lib/auth';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';
import { ProfileIcon } from '@/components/ui/ProfileIcon';
import { Sun, Moon, X } from '@/components/icons';


interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface TopNavbarProps {
  projectName?: string | null;
  projectID?: string | null;
  breadcrumbs?: BreadcrumbItem[];
  // onSaveProjectName?: (name: string) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  projectName,
  projectID,
  breadcrumbs = [],
  // onSaveProjectName,
}) => {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering theme-dependent content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const loadUser = () => {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    };
    loadUser();
    // Listen for storage events to update user info if it changes in another tab/window
    window.addEventListener('storage', loadUser);
    return () => window.removeEventListener('storage', loadUser);
  }, []);

  if (!mounted) return null;

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Combine legacy projectName with breadcrumbs if needed
  const displayBreadcrumbs = [...breadcrumbs];
  if (projectName && displayBreadcrumbs.length === 0) {
    displayBreadcrumbs.push({ label: projectName });
  }


  return (
    <nav className="relative bg-[var(--bg-secondary)] border-b border-[var(--border)]">
      <div className="flex items-center justify-between h-12 px-4">
        {/* Left side - Logo and Breadcrumbs */}
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[var(--primary)] rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="font-semibold text-[var(--text-secondary)] hidden sm:inline">Taskcafe</span>
          </Link>

          {/* Desktop Breadcrumbs */}
          {displayBreadcrumbs.length > 0 && (
            <div className="flex items-center space-x-2">
              {displayBreadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  <span className="text-[var(--text-primary)]">/</span>
                  {item.href ? (
                    <Link href={item.href} className="text-[var(--text-primary)] hover:text-[var(--text-secondary)] font-medium">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-[var(--text-primary)] font-medium">{item.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Center - Navigation (if on project page) - Desktop */}
        {projectID && (
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href={`/project/${projectID}`}
              className="px-3 py-1 text-sm text-[var(--text-primary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] rounded"
            >
              Board
            </Link>
          </div>
        )}

        {/* Right side - Unified */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-8 h-8 p-0"
          >
            {!mounted ? (
              <div className="w-4 h-4" />
            ) : theme === 'dark' ? (
              <Sun width={16} height={16} />
            ) : (
              <Moon width={16} height={16} />
            )}
          </Button>

          {/* User Profile Link */}
          <Link
            href="/profile"
            className="flex items-center space-x-2 p-1 hover:bg-[var(--bg-primary)] rounded"
            data-testid="user-profile-link"
          >
            {user && (
              <>
                <ProfileIcon user={user} size="sm" />
                <span className="text-sm text-[var(--text-primary)] hidden md:inline">{user.fullName}</span>
              </>
            )}
          </Link>

        </div>
      </div>
    </nav >
  );
};
