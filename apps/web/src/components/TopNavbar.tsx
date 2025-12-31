'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logout, getCurrentUser, AuthUser } from '@/lib/auth';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';
import { ProfileIcon } from '@/components/ui/ProfileIcon';
import { Sun, Moon, User, Settings, X } from '@/components/icons';


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
  // Mobile menu toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Mobile menu toggle


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

        {/* Right side - Desktop */}
        <div className="hidden md:flex items-center space-x-2">
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

          {/* User Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2"
              data-testid="user-menu"
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

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center">
          {/* Theme Toggle Mobile - keeping it accessible outside menu for ease */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-8 h-8 p-0 mr-2"
          >
            {!mounted ? (
              <div className="w-4 h-4" />
            ) : theme === 'dark' ? (
              <Sun width={16} height={16} />
            ) : (
              <Moon width={16} height={16} />
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1"
          >
            {/* Need to import Menu and X icons. Assuming X exists based on previous file list. */}
            {isMobileMenuOpen ? (
              // Use a simple X SVG if not imported yet or just text
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay/Drawer */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed top-0 right-0 h-full w-64 bg-[var(--bg-secondary)] border-l border-[var(--border)] shadow-xl z-50 p-4 transform transition-transform md:hidden flex flex-col">
            <div className="flex justify-end mb-4">
              <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(false)}>
                <X width={24} height={24} />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Mobile Breadcrumbs */}
              {displayBreadcrumbs.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 text-sm pb-2 border-b border-[var(--border)]">
                  {displayBreadcrumbs.map((item, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <span className="text-[var(--text-primary)]">/</span>}
                      {item.href ? (
                        <Link
                          href={item.href}
                          className="text-[var(--text-primary)] hover:text-[var(--text-secondary)] font-medium"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <span className="text-[var(--text-primary)] font-medium">{item.label}</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}

              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-start space-x-3 px-3 py-2 text-[var(--text-primary)]">
                  {user && (
                    <>
                      <ProfileIcon user={user} size="sm" />
                      <span className="font-medium">{user.fullName}</span>
                    </>
                  )}
                </div>

                <Link
                  href="/profile"
                  className="block px-3 py-2 text-sm text-start text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="block px-3 py-2 text-sm text-start text-[var(--text-primary)] hover:bg-[var(--bg-primary)] rounded"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  className="block w-full text-start px-3 py-2 text-sm text-red-500 hover:bg-[var(--bg-primary)] rounded"
                  onClick={async () => {
                    try {
                      await logout();
                      router.push('/login');
                    } catch (error) {
                      console.error('Logout failed', error);
                    }
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Click outside to close user menu (desktop) */}
      {isUserMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </nav>
  );
};
