// Mock authentication utilities

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  initials: string;
  avatar?: string | null;
  bio?: string;
}

export const mockUsers: User[] = [
  {
    id: 'user-1',
    username: 'john_doe',
    fullName: 'John Doe',
    email: 'john@example.com',
    initials: 'JD',
    avatar: null,
    bio: 'Product Manager',
  },
  {
    id: 'user-2',
    username: 'jane_smith',
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    initials: 'JS',
    avatar: null,
    bio: 'Frontend Developer',
  },
];

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  const userId = localStorage.getItem('currentUserId');
  if (!userId) return null;
  
  return mockUsers.find(user => user.id === userId) || null;
};

export const login = (username: string, password: string): Promise<User | null> => {
  return new Promise((resolve) => {
    // Mock login - accept any username/password
    setTimeout(() => {
      const user = mockUsers.find(u => u.username === username) || mockUsers[0];
      localStorage.setItem('currentUserId', user.id);
      resolve(user);
    }, 500);
  });
};

export const logout = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('currentUserId');
};

export const register = (userData: {
  username: string;
  fullName: string;
  email: string;
  password: string;
}): Promise<User> => {
  return new Promise((resolve) => {
    // Mock registration
    setTimeout(() => {
      const newUser: User = {
        id: `user-${Date.now()}`,
        username: userData.username,
        fullName: userData.fullName,
        email: userData.email,
        initials: userData.fullName.split(' ').map(n => n[0]).join(''),
        avatar: null,
        bio: '',
      };
      
      mockUsers.push(newUser);
      localStorage.setItem('currentUserId', newUser.id);
      resolve(newUser);
    }, 500);
  });
};
