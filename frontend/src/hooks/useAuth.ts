import { useState, useEffect } from 'react';
import { User } from '../types/models';
import { apiClient } from '../utils/apiClient';
import { localStorageHelpers } from '../utils/localStorageHelpers';

export function useAuth(): {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
} {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorageHelpers.getToken());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      if (!email) {
        throw new Error('Email is required');
      }
      if (!password) {
        throw new Error('Password is required');
      }

      const response = await apiClient.post('/auth/login', { email, password });
      const { token: authToken, user: userData } = response.data;
      
      localStorageHelpers.setToken(authToken);
      setToken(authToken);
      setUser(userData);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
      setLoading(false);
    }
  };

  const logout = (): void => {
    localStorageHelpers.removeToken();
    setToken(null);
    setUser(null);
    setError(null);
    apiClient.post('/auth/logout');
  };

  const refreshToken = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiClient.post('/auth/refresh');
      const { token: newToken, user: userData } = response.data;
      
      localStorageHelpers.setToken(newToken);
      setToken(newToken);
      setUser(userData);
      setLoading(false);
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout();
      } else {
        setError('Session expired');
        setLoading(false);
      }
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<void> => {
    if (!user) {
      throw new Error('Not authenticated');
    }
    
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.put(`/users/${user.id}`, userData);
      const updatedUser = response.data;
      
      setUser(updatedUser);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshToken();
    }
  }, []);

  return {
    user,
    token,
    loading,
    error,
    login,
    logout,
    refreshToken,
    updateProfile
  };
}