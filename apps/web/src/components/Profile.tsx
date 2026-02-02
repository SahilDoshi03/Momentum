'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProfileIcon } from '@/components/ui/ProfileIcon';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { ChangePasswordModal } from '@/components/ui/ChangePasswordModal';
import { getCurrentUser, AuthUser, logout } from '@/lib/auth';
import { Sun, Moon } from '@/components/icons';
import { apiClient } from '@/lib/api';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const Profile: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    bio: '',
    initials: '',
  });

  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => {
      // Ensure we have a user ID before attempting upload
      if (!currentUser?.id) {
        throw new Error('User not found');
      }
      return apiClient.uploadAvatar(currentUser.id, file);
    },
    onSuccess: (response) => {
      if (response.success && response.data) {
        const apiUser = response.data;
        const authUser: AuthUser = {
          ...apiUser,
          id: apiUser._id,
          avatar: apiUser.profileIcon?.url || null,
        };

        // Update cache
        queryClient.setQueryData(['currentUser'], authUser);
        localStorage.setItem('currentUser', JSON.stringify(apiUser));
        toast.success('Avatar updated successfully');
      }
    },
    onError: (err) => {
      console.error('Avatar upload failed', err);
      toast.error('Failed to upload avatar');
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: Partial<AuthUser>) =>
      apiClient.updateUser(data.id!, {
        fullName: data.fullName,
        bio: data.bio,
      }),
    onSuccess: (response) => {
      if (response.success && response.data) {
        const apiUser = response.data;
        const authUser: AuthUser = {
          ...apiUser,
          id: apiUser._id,
          avatar: apiUser.profileIcon?.url || null,
        };

        // Update cache
        queryClient.setQueryData(['currentUser'], authUser);

        // Update localStorage
        localStorage.setItem('currentUser', JSON.stringify(apiUser));

        toast.success('Profile updated successfully');
        setIsEditing(false);
      }
    },
    onError: () => {
      toast.error('Failed to update profile');
    }
  });
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => apiClient.deleteUser(userId),
    onSuccess: async () => {
      toast.success('Account deleted successfully');
      await logout();
      router.push('/login');
    },
    onError: (error) => {
      console.error('Failed to delete account', error);
      toast.error('Failed to delete account');
      setIsDeleteModalOpen(false);
    }
  });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  const handleDeleteAccount = async () => {
    if (!currentUser?.id) return;
    deleteUserMutation.mutate(currentUser.id);
  };

  const { data: currentUser, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      // First try to get user from localStorage for immediate render (optional, but good for UX if data is fresh)
      const stored = getCurrentUser();
      // We could return stored if we wanted to rely on it, but let's verify with API

      try {
        const response = await apiClient.validateToken();
        if (response.success && response.data?.user) {
          const apiUser = response.data.user;
          const user: AuthUser = {
            ...apiUser,
            id: apiUser._id,
            avatar: apiUser.profileIcon?.url || null,
          };
          // Save to localStorage
          localStorage.setItem('currentUser', JSON.stringify(user));
          return user;
        }
      } catch (error) {
        console.error('Failed to validate token', error);
      }

      if (stored) return stored;
      return null;
    },
    // We can add retry: false if we want to fail fast on auth errors
    retry: false
  });

  // Sync form data when user loads
  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName || '',
        email: currentUser.email || '',
        bio: currentUser.bio || '',
        initials: currentUser.initials || '',
      });
    } else if (!isLoading && !currentUser) {
      // Redirect if done loading and no user
      router.push('/login');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-[var(--text-primary)]">Loading profile...</p>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const handleSave = async () => {
    updateUserMutation.mutate({
      ...currentUser,
      fullName: formData.fullName,
      bio: formData.bio
    });
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
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate size/type if needed
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      uploadAvatarMutation.mutate(file);
    }
    // Reset value
    event.target.value = '';
  };

  const handlePasswordChange = () => {
    setIsChangePasswordModalOpen(true);
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
                  <Button onClick={handleAvatarChange} variant="outline" size="sm" disabled={uploadAvatarMutation.isPending}>
                    {uploadAvatarMutation.isPending ? 'Uploading...' : 'Change Avatar'}
                  </Button>
                  <p className="text-sm text-[var(--text-primary)] mt-1">
                    Click to upload a new profile picture
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="fullName"
                  label="Full Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={!isEditing}
                />
                <Input
                  id="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>

              <Input
                id="bio"
                label="Bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                placeholder="Tell us about yourself"
              />

              <Input
                id="initials"
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
                  <Button onClick={handleSave} disabled={updateUserMutation.isPending}>
                    {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
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
          {currentUser.hasPassword && (
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
          )}
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

            <div className="space-y-3">
              <Button
                variant="danger"
                className="w-full"
                onClick={async () => {
                  try {
                    await logout();
                    router.push('/login');
                  } catch (error) {
                    console.error('Logout failed', error);
                    toast.error('Failed to logout');
                  }
                }}
              >
                Sign Out
              </Button>

              <Button
                variant="outline"
                className="w-full border-red-500 text-red-500 hover:bg-red-600 hover:text-white hover:border-red-600"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                Delete Account
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--border)] space-y-3">
              <Button
                variant="danger"
                className="w-full"
                onClick={async () => {
                  try {
                    await logout();
                    router.push('/login');
                  } catch (error) {
                    console.error('Logout failed', error);
                    toast.error('Failed to logout');
                  }
                }}
              >
                Sign Out
              </Button>

              <Button
                variant="outline"
                className="w-full border-red-500 text-red-500 hover:bg-red-600 hover:text-white hover:border-red-600"
                onClick={() => setIsDeleteModalOpen(true)}
              >
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete your account? This action cannot be undone."
        confirmText="Delete Account"
        variant="danger"
        isLoading={deleteUserMutation.isPending}
      />
    </div>
  );
};
