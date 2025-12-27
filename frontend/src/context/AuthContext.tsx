import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAuthToken, setAuthToken, removeAuthToken } from '../utils/localStorageHelpers';
import { apiClient } from '../utils/apiClient';
import { User } from '../types/models';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await apiClient.get('/auth/me');
          setUser(response.data.user);
        } catch (error) {
          removeAuthToken();
          setToken(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      setAuthToken(response.data.token);
      setToken(response.data.token);
      setUser(response.data.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = (): void => {
    removeAuthToken();
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export { AuthContext };