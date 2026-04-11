// Configuration des URLs d'API pour le développement et la production

const getApiBaseUrl = () => {
  // En développement local
  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }
  
  // En production (Vercel), utiliser l'URL du backend Render
  return 'https://gestion-caisse.onrender.com';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * Obtenir l'URL complète pour une image
 * @param {string} path - Chemin de l'image (ex: uploads/filename.png)
 * @returns {string} URL complète de l'image
 */
export const getImageUrl = (path) => {
  if (!path) return null;
  
  // Si c'est déjà une URL complète (http ou https)
  if (path.startsWith('http')) return path;
  
  // Sinon, construire l'URL complète
  return `${API_BASE_URL}/${path}`;
};

/**
 * Obtenir l'URL pour les fichiers uploads
 * @param {string} filename - Nom du fichier ou URL complète
 * @returns {string} URL complète
 */
export const getUploadUrl = (filename) => {
  if (!filename) return null;
  // Si c'est déjà une URL complète (http ou https), la retourner directement
  if (filename.startsWith('http')) return filename;
  // Sinon, construire l'URL
  return `${API_BASE_URL}/uploads/${filename}`;
};

/**
 * Obtenir l'URL pour les images de produits
 * @param {string} filename - Nom du fichier image
 * @returns {string} URL complète
 */
export const getProductImageUrl = (filename) => {
  if (!filename) return null;
  // Les images produits sont dans le dossier images
  return `${API_BASE_URL}/images/${filename}`;
};
