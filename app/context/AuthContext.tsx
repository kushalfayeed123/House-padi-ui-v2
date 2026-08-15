"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UserProfile } from "../types/user_profile";
import { apiClient } from "../lib/api-client";

interface AuthContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile strictly from the /api/profile endpoint using the stored token
  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await apiClient.get("/api/profile");
      if (data && data.profile) {
        const profile = data.profile;

        // Check if a different user is logging in on this browser
        const previousChatUserId = localStorage.getItem("housepadi_chat_user_id");
        if (previousChatUserId && previousChatUserId !== profile.id) {
          // Clear previous user's chat session data
          localStorage.removeItem("housepadi_chat_messages");
          localStorage.removeItem("housepadi_thread_id");
          localStorage.removeItem("housepadi_chat_minimized");
          localStorage.removeItem("housepadi_chat_open");
        }

        // Bind current chat session to this user ID
        localStorage.setItem("housepadi_chat_user_id", profile.id);

        setUser(profile); // Maps directly to your public.profiles columns
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user profile from endpoint:", error);
      // Clear invalid or expired tokens
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const signOut = async () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, signOut, refreshProfile: fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};