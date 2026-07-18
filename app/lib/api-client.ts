import axios from "axios";

export const apiClient = axios.create({ baseURL: "http://localhost:8000" });

apiClient.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});