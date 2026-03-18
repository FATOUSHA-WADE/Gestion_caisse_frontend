import axios from "axios";

// Configuration basée sur l'environnement
const getApiUrl = () => {
  const env = import.meta.env.VITE_APP_ENV || 'development';
  
  if (env === 'production') {
    return import.meta.env.VITE_API_URL_PRODUCTION || 'https://gestion-caisse.onrender.com/api';
  }
  
  return import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
};

const API = axios.create({
  baseURL: getApiUrl()
});

// Intercepteur pour ajouter le token d'authentification
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default API;