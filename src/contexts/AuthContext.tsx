/**
 * Authentication Context - Simplified for Demo
 * Provides authentication state and methods throughout the app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { mockUsers, MockUser, delay } from '../data/mockData';

interface AuthContextType {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;
  user: MockUser | null;
  error: string | null;
  
  // Authentication methods
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setupMFA?: () => Promise<void>;
  verifyMFA?: (code: string) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  confirm_password: string;
  firstName: string;
  lastName: string;
  role: 'renter' | 'operator';
  profile: {
    first_name: string;
    last_name: string;
    nationality: string;
    date_of_birth: string;
  };
  terms_accepted: boolean;
  marketing_consent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<MockUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for existing session
        const savedUser = localStorage.getItem('autolodge_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        localStorage.removeItem('autolodge_user');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate API delay
      await delay(1000);
      
      // Find user by email (mock authentication)
      const foundUser = mockUsers.find(u => u.email === email);
      
      if (!foundUser) {
        throw new Error('Invalid email or password');
      }
      
      // Simple password validation (in real app, this would be secure)
      if (password.length < 6) {
        throw new Error('Invalid email or password');
      }
      
      // Save to localStorage
      localStorage.setItem('autolodge_user', JSON.stringify(foundUser));
      
      setUser(foundUser);
      setIsAuthenticated(true);
      
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate API delay
      await delay(1500);
      
      // Check if user already exists
      const existingUser = mockUsers.find(u => u.email === data.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      // Create new user
      const newUser: MockUser = {
        id: mockUsers.length + 1,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        isVerified: false,
        trustScore: 0,
        profile: {
          first_name: data.firstName,
          last_name: data.lastName,
          nationality: data.profile.nationality,
          date_of_birth: data.profile.date_of_birth,
          preferences: {
            currency: 'USD',
            language: 'en',
            notifications: {
              email: true,
              sms: false,
              push: true
            }
          }
        },
        verification_status: {
          email_verified: false,
          phone_verified: false,
          identity_verified: false,
          license_verified: false,
          verification_level: 'unverified'
        },
        updated_at: new Date().toISOString()
      };
      
      // Add to mock users (in real app, this would be API call)
      mockUsers.push(newUser);
      
      // Save to localStorage
      localStorage.setItem('autolodge_user', JSON.stringify(newUser));
      
      setUser(newUser);
      setIsAuthenticated(true);
      
    } catch (error: any) {
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('autolodge_user');
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    clearError,
    setupMFA: async () => {
      // Mock MFA setup
      console.log('MFA setup called');
    },
    verifyMFA: async (code: string) => {
      // Mock MFA verification
      console.log('MFA verification called with code:', code);
    }
  };

  return (
    <AuthContext.Provider value={value}>
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