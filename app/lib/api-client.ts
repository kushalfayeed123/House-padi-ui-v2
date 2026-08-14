/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const getBaseUrl = () => {
  // 1. Allow explicit override via environment variable if provided
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 2. Automatically fallback based on Next.js environment
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8000";
  }

  // 3. Default production fallback (Replace with your actual Render/Cloud backend URL)
  return "https://house-padi-engine-v2.onrender.com";
};

export const apiClient = axios.create({ 
  baseURL: getBaseUrl() 
});

const redirectToLogin = (reason: string) => {
  if (typeof window === "undefined") return;

  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;
  const loginUrl = `/login?returnUrl=${encodeURIComponent(`${currentPath}${currentSearch}`)}`;

  if (currentPath === "/login") return;

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem("auth_redirect_reason", reason);
    window.location.assign(loginUrl);
  }
};

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window === "undefined") {
      return Promise.reject(error);
    }

    const status = error?.response?.status;
    if (status === 401) {
      redirectToLogin("Your session has expired. Please sign in again.");
    }

    return Promise.reject(error);
  }
);