import { apiClient } from "../lib/api-client";
import { LoginCredentials, AuthResponse, RegisterData } from "../types/auth";

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/api/auth/login", credentials);
    
    if (data.access_token) {
      // Store ONLY tokens in localStorage. Profile comes strictly from the endpoint.
      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
    }
    return data;
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    // The backend's register schema keys landlords as "landlord" (profiles/RBAC
    // use "owner"); the app models the role as "owner". Translate at the wire
    // boundary so both spellings stay valid.
    const payload = {
      ...userData,
      role: userData.role === "owner" ? "landlord" : userData.role,
    };

    const { data } = await apiClient.post<AuthResponse>("/api/auth/register", payload);
    
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/";
  }
};