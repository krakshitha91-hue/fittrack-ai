import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.PROD
    ? "https://fittrack-ai-backend-g4f5.onrender.com"
    : "http://localhost:5000"
);
const normalizedApiUrl = API_URL.replace(/\/+$/, "");

const api = axios.create({
  baseURL: normalizedApiUrl.endsWith("/api")
    ? normalizedApiUrl
    : `${normalizedApiUrl}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export { API_URL };
export default api;
