'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProfileIcon } from '@/components/ui/ProfileIcon';
import { getCurrentUser } from '@/lib/auth';
import { Sun, Moon } from '@/components/icons';

export const Profile: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    bio: '',
    initials: '',
  });

  // Mock current user
  const currentUser = getCurrentUser() || {
    id: 'user-1',
    fullName: 'John Doe',
    email: 'john@example.com',
    initials: 'JD',
    bio: 'Product Manager',
    avatar: null,
  };

  React.useEffect(() => {
    setFormData({
      fullName: currentUser.fullName,
      email: currentUser.email,
      bio: currentUser.bio || '',
      initials: currentUser.initials,
    });
  }, [currentUser]);

  const handleSave = () => {
    console.log('Saving profile:', formData);
    setIsEditing(false);
    // In a real app, this would update the user data
  };

  const handleCancel = () => {
    setFormData({
      fullName: currentUser.fullName,
      email: currentUser.email,
      bio: currentUser.bio || '',
      initials: currentUser.initials,
    });
    setIsEditing(false);
  };

  const handleAvatarChange = () => {
    console.log('Avatar change requested');
    // In a real app, this would open a file picker
  };

  const handlePasswordChange = () => {
    console.log('Password change requested');
    // In a real app, this would open a password change modal
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-secondary)] mb-2">Profile</h1>
        <p className="text-[var(--text-primary)]">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[var(--text-secondary)] mb-4">
              Personal Information
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                <ProfileIcon user={currentUser} size="lg" />
                <div>
                  <Button onClick={handleAvatarChange} variant="outline" size="sm">
                    Change Avatar
                  </Button>
                  <p className="text-sm text-[var(--text-primary)] mt-1">
                    Click to upload a new profile picture
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={!isEditing}
                />
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <Input
                label="Bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                placeholder="Tell us about yourself"
              />

              <Input
                label="Initials"
                value={formData.initials}
                onChange={(e) => setFormData({ ...formData, initials: e.target.value })}
                disabled={!isEditing}
                placeholder="JD"
              />
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Security */}
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[var(--text-secondary)] mb-4">
              Security
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-[var(--text-primary)]">Password</h3>
                  <p className="text-sm text-[var(--text-primary)]">Last changed 3 months ago</p>
                </div>
                <Button variant="outline" onClick={handlePasswordChange}>
                  Change Password
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[var(--text-secondary)] mb-4">
              Preferences
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-[var(--text-primary)] mb-2">Theme</h3>
                <div className="flex space-x-2">
                  <Button
                    variant={theme === 'light' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('light')}
                    className="flex items-center space-x-2"
                  >
                    <Sun width={16} height={16} />
                    <span>Light</span>
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className="flex items-center space-x-2"
                  >
                    <Moon width={16} height={16} />
                    <span>Dark</span>
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-[var(--text-primary)] mb-2">Notifications</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span className="text-sm text-[var(--text-primary)]">Email notifications</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span className="text-sm text-[var(--text-primary)]">Task reminders</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span className="text-sm text-[var(--text-primary)]">Weekly summaries</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-[var(--text-secondary)] mb-4">
              Account
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-primary)]">Member since</span>
                <span className="text-[var(--text-secondary)]">January 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-primary)]">Last active</span>
                <span className="text-[var(--text-secondary)]">2 hours ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-primary)]">Projects</span>
                <span className="text-[var(--text-secondary)]">3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
