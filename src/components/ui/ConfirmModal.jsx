import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Composant de confirmation modal réutilisable
 * @param {Object} props - Propriétés du composant
 * @param {boolean} props.isOpen - État d'ouverture du modal
 * @param {string} props.title - Titre du modal
 * @param {string} props.message - Message de confirmation
 * @param {string} props.confirmText - Texte du bouton confirmer (défaut: "Supprimer")
 * @param {string} props.cancelText - Texte du bouton annuler (défaut: "Annuler")
 * @param {string} props.type - Type de danger (défaut: "danger")
 * @param {Function} props.onConfirm - Fonction appelée lors de la confirmation
 * @param {Function} props.onCancel - Fonction appelée lors de l'annulation
 */
export default function ConfirmModal({
  isOpen = false,
  title = "Confirmation",
  message = "Êtes-vous sûr de vouloir effectuer cette action?",
  confirmText = "Supprimer",
  cancelText = "Annuler",
  type = "danger",
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6 animate-scale-in">
        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className={`
          w-12 h-12 rounded-full flex items-center justify-center mb-4
          ${type === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}
        `}>
          <AlertTriangle className={`
            w-6 h-6
            ${type === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}
          `} />
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`
              px-4 py-2 text-white rounded-lg transition-colors
              ${type === 'danger' 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-blue-500 hover:bg-blue-600'
              }
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
