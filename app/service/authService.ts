import { apiClient } from "../lib/api-client";
import { LoginCredentials, AuthResponse, RegisterData } from "../types/auth";

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/api/auth/login", credentials);
    
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user_data", JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata.full_name,
        role: data.user.user_metadata.role
      }));
    }
    return data;
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/api/auth/register", userData);
    return data;
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_data");
    window.location.href = "/"; // Force hard refresh to clear state
  }
};