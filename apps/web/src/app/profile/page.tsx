'use client';

import React from 'react';
import { TopNavbar } from '@/components/TopNavbar';
import { Profile } from '@/components/Profile';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <TopNavbar breadcrumbs={[{ label: 'Profile' }]} />
      <Profile />
    </div>
  );
}
