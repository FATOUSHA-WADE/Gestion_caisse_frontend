import axios from "axios";

const getBaseURL = () => {
  if (typeof window === 'undefined') {
    return '/api';
  }
  
  const { hostname } = window.location;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168') || hostname.includes('10.0')) {
    return '/api';
  }
  
  return '/api';
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.includes('/auth/');
    
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default API;