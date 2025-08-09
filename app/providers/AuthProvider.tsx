"use client";
import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { account, ID } from '../lib/appwrite';
import type { Models } from 'appwrite';

type User = Models.User<Models.Preferences>;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Add a small delay to ensure client is properly initialized
        await new Promise(resolve => setTimeout(resolve, 50));
        const currentUser = await account.get();
        setUser(currentUser);
      } catch (error) {
        // Log the error for debugging but don't throw
        console.log("No active session found:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      // First, ensure any existing session is cleared
      try {
        await account.deleteSession('current');
      } catch {
        // Ignore errors if no session exists
      }
      
      // Create new session
      const session = await account.createEmailPasswordSession(email, password);
      
      // Wait a moment for session to be established
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get user data
      const currentUser = await account.get();
      setUser(currentUser);
    } catch (error) {
      console.error("Login failed:", error);
      setUser(null);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await account.deleteSession("current");
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<void> => {
    try {
      // Create the user account
      await account.create(ID.unique(), email, password, name);
      
      // Create session
      await account.createEmailPasswordSession(email, password);
      
      // Wait a moment for session to be established
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get user data
      const currentUser = await account.get();
      setUser(currentUser);
    } catch (error) {
      console.error("Registration failed:", error);
      setUser(null);
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}