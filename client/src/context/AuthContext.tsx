import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { UserRole } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

type User = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: string;
  specialization?: string;
  profileImage?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    // Check for user in localStorage on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      const data = await response.json();
      if (!data.user) {
        throw new Error('Invalid response from server');
      }
      
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect based on role
      const redirectPath = data.user.role === UserRole.DOCTOR ? '/dashboard' : '/dashboard';
      setLocation(redirectPath);
      
      toast({
        title: 'Login Successful',
        description: `Welcome, ${data.user.fullName}!`,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid username or password',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      const data = await response.json();
      if (!data.user) {
        throw new Error('Invalid response from server');
      }
      
      setUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect to login
      setLocation('/login');
      
      toast({
        title: 'Registration Successful',
        description: 'Please login with your credentials',
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setLocation('/login');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out',
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
