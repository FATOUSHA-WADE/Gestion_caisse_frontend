// Configuration des URLs d'API pour le développement et la production

const getApiBaseUrl = () => {
  // En développement local
  if (import.meta.env.DEV) {
    return 'http://localhost:3000/api';
  }
  
  // En production (Vercel), utiliser l'URL du backend Render
  return 'https://gestion-caisse.onrender.com/api';
};

const getStaticBaseUrl = () => {
  // En développement local
  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }
  
  // En production (Vercel), utiliser l'URL du backend Render (sans /api)
  return 'https://gestion-caisse.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();
export const STATIC_BASE_URL = getStaticBaseUrl();

/**
 * Obtenir l'URL complète pour une image
 */
export const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${STATIC_BASE_URL}/${path}`;
};

/**
 * Obtenir l'URL pour les fichiers uploads
 */
export const getUploadUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  return `${STATIC_BASE_URL}/uploads/${filename}`;
};

/**
 * Obtenir l'URL pour les images de produits
 */
export const getProductImageUrl = (filename) => {
  if (!filename) return null;
  return `${STATIC_BASE_URL}/images/${filename}`;
};
