import { useState, useEffect } from 'react';
import { User } from '../types/models';
import apiClient from '../utils/apiClient';
import * as localStorageHelpers from '../utils/localStorageHelpers';

export function useAuth(): { user: User | null; token: string | null; loading: boolean; error: string | null; login: (email: string, password: string) => Promise<void>; logout: () => void; refreshToken: () => Promise<void>; updateProfile: (userData: Partial<User>) => Promise<void> } {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorageHelpers.getToken());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    setError(null);
    
    if (!email) {
      throw new Error('Email is required');
    }
    
    if (!password) {
      throw new Error('Password is required');
    }

    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token: responseToken, user: responseUser } = response.data;
      
      localStorageHelpers.setToken(responseToken);
      setToken(responseToken);
      setUser(responseUser);
      setLoading(false);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed');
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
    setLoading(true);
    
    try {
      const response = await apiClient.post('/auth/refresh');
      const { token: newToken, user: responseUser } = response.data;
      
      localStorageHelpers.setToken(newToken);
      setToken(newToken);
      setUser(responseUser);
      setLoading(false);
    } catch (error: any) {
      if (error.response?.status === 401) {
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
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.put(`/users/${user.id}`, userData);
      const updatedUser = response.data;
      
      setUser(updatedUser);
      setLoading(false);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update profile');
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