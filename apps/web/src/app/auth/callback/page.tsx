'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';

function AuthCallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get('token');

            if (token) {
                try {
                    // Store token
                    localStorage.setItem('authToken', token);

                    // Fetch user data
                    const response = await apiClient.getCurrentUser();

                    if (response.success && response.data) {
                        localStorage.setItem('currentUser', JSON.stringify(response.data));
                        router.push('/');
                    } else {
                        router.push('/login?error=auth_failed');
                    }
                } catch (error) {
                    console.error('Auth callback error:', error);
                    router.push('/login?error=auth_failed');
                }
            } else {
                router.push('/login?error=no_token');
            }
        };

        handleCallback();
    }, [router, searchParams]);

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto"></div>
                <p className="mt-4 text-[var(--text-primary)]">Authenticating...</p>
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto"></div>
                    <p className="mt-4 text-[var(--text-primary)]">Loading...</p>
                </div>
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}
