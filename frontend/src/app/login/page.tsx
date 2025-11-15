'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { login, getCurrentUser, validateToken } from '@/lib/auth';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Redirect if already logged in
    const checkAuth = async () => {
      const user = getCurrentUser();
      if (user) {
        const isValid = await validateToken();
        if (isValid) {
          router.push('/');
        } else {
          // Clear invalid user data
          localStorage.removeItem('currentUser');
        }
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const user = await login(formData.username, formData.password);
      if (user) {
        router.push('/');
      } else {
        setError('Invalid username or password');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-[var(--primary)] rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">T</span>
          </div>
          <h2 className="text-3xl font-bold text-[var(--text-secondary)]">Welcome back</h2>
          <p className="text-[var(--text-primary)] mt-2">Sign in to your account</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <Input
            label="Username"
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="Enter your username"
            required
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Enter your password"
            required
          />

          {error && (
            <div className="text-[var(--danger)] text-sm text-center">{error}</div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>

          <div className="text-center">
            <span className="text-[var(--text-primary)]">Don't have an account? </span>
            <Link
              href="/register"
              className="text-[var(--primary)] hover:underline"
            >
              Sign up
            </Link>
          </div>
        </form>

        <div className="text-center text-sm text-[var(--text-primary)]">
          <p>Demo credentials:</p>
          <p>Username: john_doe</p>
          <p>Password: password123</p>
        </div>
      </div>
    </div>
  );
}
