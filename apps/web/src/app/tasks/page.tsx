'use client';

import React from 'react';
import { TopNavbar } from '@/components/TopNavbar';
import { MyTasks } from '@/components/MyTasks';

export default function TasksPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <TopNavbar breadcrumbs={[{ label: 'My Tasks' }]} />
      <MyTasks />
    </div>
  );
}
