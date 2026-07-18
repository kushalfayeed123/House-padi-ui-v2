"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types/auth";

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  signOut: () => Promise<void>; // Added signOut to the interface
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("user_data");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("user_data");
      }
    }
    setIsLoading(false);
  }, []);

  const signOut = async () => {
    // 1. Clear local storage so the user doesn't reappear on reload
    localStorage.removeItem("user_data");
    
    // 2. Clear state
    setUser(null);
    
    // 3. Optional: Add an API call here if your backend needs to invalidate the session
    // await apiClient.post('/api/auth/signout');

    // 4. Force a hard refresh to reset the app state
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};