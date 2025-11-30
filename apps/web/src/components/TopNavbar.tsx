'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logout, getCurrentUser, AuthUser } from '@/lib/auth';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';
import { ProfileIcon } from '@/components/ui/ProfileIcon';
import { Sun, Moon, User, Settings } from '@/components/icons';


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
    <nav className="flex items-center justify-between h-12 px-4 bg-[var(--bg-secondary)] border-b border-[var(--border)]">
      {/* Left side - Logo and Breadcrumbs */}
      <div className="flex items-center space-x-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[var(--primary)] rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <span className="font-semibold text-[var(--text-secondary)]">Taskcafe</span>
        </Link>

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

      {/* Center - Navigation (if on project page) */}
      {projectID && (
        <div className="flex items-center space-x-1">
          <Link
            href={`/project/${projectID}`}
            className="px-3 py-1 text-sm text-[var(--text-primary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] rounded"
          >
            Board
          </Link>
        </div>
      )}

      {/* Right side - Theme toggle and User menu */}
      <div className="flex items-center space-x-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-8 h-8 p-0"
        >
          {!mounted ? (
            // Show a placeholder during SSR to prevent hydration mismatch
            <div className="w-4 h-4" />
          ) : theme === 'dark' ? (
            <Sun width={16} height={16} />
          ) : (
            <Moon width={16} height={16} />
          )}
        </Button>

        {/* User Menu */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center space-x-2"
          >
            {user && (
              <>
                <ProfileIcon user={user} size="sm" />
                <span className="text-sm text-[var(--text-primary)]">{user.fullName}</span>
              </>
            )}
          </Button>

          {/* Dropdown Menu */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-primary)] border border-[var(--border)] rounded-md shadow-lg z-50">
              <div className="py-1">
                <Link
                  href="/profile"
                  className="flex items-center px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <User width={16} height={16} className="mr-3" />
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  <Settings width={16} height={16} className="mr-3" />
                  Settings
                </Link>
                <div className="border-t border-[var(--border)] my-1" />
                <button
                  className="flex items-center w-full px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                  onClick={async () => {
                    try {
                      await logout();
                      router.push('/login');
                    } catch (error) {
                      console.error('Logout failed', error);
                    }
                    setIsUserMenuOpen(false);
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close user menu */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </nav>
  );
};
