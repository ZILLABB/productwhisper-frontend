import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiService } from '../services/api';
import type { User } from '../types/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export type { AuthContextType };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;
  const isAdmin = false;

  useEffect(() => {
    const loadUser = async () => {
      try {
        const accessToken = localStorage.getItem('pw_access_token');
        if (accessToken) {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
        }
      } catch (err) {
        console.error('Failed to load user:', err);
        apiService.logout();
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await apiService.login(email, password);
      setUser(userData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await apiService.register(username, email, password);
      setUser(userData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const updatedUser = await apiService.updateProfile(data);
      setUser(updatedUser);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      throw err;
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      await apiService.updatePassword(currentPassword, newPassword);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    updatePassword,
    isAuthenticated,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
