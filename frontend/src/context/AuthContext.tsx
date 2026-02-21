import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authAPI } from '../api/client';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'FLEET_MANAGER' | 'DISPATCHER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('ff_token');
    const storedUser = localStorage.getItem('ff_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('ff_token', data.token);
    localStorage.setItem('ff_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('ff_token');
    localStorage.removeItem('ff_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

// Role helpers
export const ROLE_LABELS: Record<string, string> = {
  FLEET_MANAGER: 'Fleet Manager',
  DISPATCHER: 'Dispatcher',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
};

export const canAccess = (userRole: string | undefined, allowed: string[]) =>
  allowed.includes(userRole || '');
