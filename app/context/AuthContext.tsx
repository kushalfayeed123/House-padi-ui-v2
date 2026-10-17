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

// The backend's RBAC uses "owner" for landlords (see tour_ops.py), while
// Supabase metadata has historically carried "landlord". Normalise once here so
// every role check in the UI (Header, AuthGuard, DashboardLoader) is consistent.
export const normalizeRole = (role?: string | null): UserProfile["role"] =>
  role === "landlord" || role === "owner" ? "owner" : "renter";

// The server-side middleware can't read localStorage, so mirror the role into a
// cookie it can read. Cleared on sign-out and whenever the token is invalid.
export const persistRoleCookie = (role?: string | null) => {
  if (typeof document === "undefined") return;
  if (role) {
    document.cookie = `user_role=${role}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
  } else {
    document.cookie = "user_role=; path=/; max-age=0; samesite=lax";
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch profile strictly from the /api/profile endpoint using the stored token
  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      persistRoleCookie(null);
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await apiClient.get("/api/profile");
      if (data && data.profile) {
        const profile = {
          ...data.profile,
          role: normalizeRole(data.profile.role),
        } as UserProfile;

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
        persistRoleCookie(profile.role);

        setUser(profile); // Maps directly to your public.profiles columns
      } else {
        persistRoleCookie(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user profile from endpoint:", error);
      // Clear invalid or expired tokens
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      persistRoleCookie(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Auth bootstrap: the token lives in localStorage, so the profile lookup
    // can only happen in the browser after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
  }, [fetchProfile]);

  const signOut = async () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("housepadi_chat_user_id");
    persistRoleCookie(null);
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