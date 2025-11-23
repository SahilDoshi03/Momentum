'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser, validateToken } from '@/lib/auth';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            // Public routes that don't require authentication
            const publicRoutes = ['/login', '/register'];

            if (publicRoutes.includes(pathname)) {
                setIsAuthenticated(true);
                setIsLoading(false);
                return;
            }

            const user = getCurrentUser();

            if (!user) {
                router.push('/login');
                return;
            }

            // Validate the token
            const isValid = await validateToken();

            if (!isValid) {
                // Clear invalid user data
                localStorage.removeItem('currentUser');
                localStorage.removeItem('authToken');
                router.push('/login');
                return;
            }

            setIsAuthenticated(true);
            setIsLoading(false);
        };

        checkAuth();
    }, [pathname, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto"></div>
                    <p className="mt-4 text-[var(--text-primary)]">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
