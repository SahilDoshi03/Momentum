// Authentication utilities with real backend integration

import { apiClient, User } from './api';

export interface AuthUser extends User {
  id: string;
  avatar?: string | null;
}

export const getCurrentUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null;
  
  const userData = localStorage.getItem('currentUser');
  if (!userData) return null;
  
  try {
    const user = JSON.parse(userData);
    return {
      ...user,
      id: user._id,
      avatar: user.profileIcon?.url || null,
    };
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

export const login = async (email: string, password: string): Promise<AuthUser | null> => {
  try {
    const response = await apiClient.login(email, password);
    
    if (response.success && response.data) {
      const user = response.data.user;
      const token = response.data.token;
      const authUser: AuthUser = {
        ...user,
        id: user._id,
        avatar: user.profileIcon?.url || null,
      };
      
      localStorage.setItem('currentUser', JSON.stringify(user));
      if (token) {
        localStorage.setItem('authToken', token);
      }
      return authUser;
    }
    
    return null;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await apiClient.logout();
  } catch (error) {
    console.error('Logout failed:', error);
  } finally {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
    }
  }
};

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
};

export const register = async (userData: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<AuthUser> => {
  try {
    const response = await apiClient.register(userData);
    
    if (response.success && response.data) {
      const user = response.data.user;
      const token = response.data.token;
      const authUser: AuthUser = {
        ...user,
        id: user._id,
        avatar: user.profileIcon?.url || null,
      };
      
      localStorage.setItem('currentUser', JSON.stringify(user));
      if (token) {
        localStorage.setItem('authToken', token);
      }
      return authUser;
    }
    
    throw new Error('Registration failed');
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
};

export const validateToken = async (): Promise<boolean> => {
  try {
    const response = await apiClient.validateToken();
    return response.success && response.data?.valid === true;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
};
