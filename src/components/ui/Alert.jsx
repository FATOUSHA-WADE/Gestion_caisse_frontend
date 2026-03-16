import React from 'react';

/**
 * Composant Alert réutilisable pour les messages d'erreur/succès
 * @param {Object} props - Propriétés du composant
 */
export default function Alert({
  type = 'error', // error, success, warning, info
  message,
  className = '',
  onClose,
}) {
  const typeClasses = {
    error: 'bg-red-500/90 border-red-600 text-white dark:bg-red-600 dark:border-red-700',
    success: 'bg-green-500/90 border-green-600 text-white dark:bg-green-600 dark:border-green-700',
    warning: 'bg-yellow-500/90 border-yellow-600 text-white dark:bg-yellow-600 dark:border-yellow-700',
    info: 'bg-blue-500/90 border-blue-600 text-white dark:bg-blue-600 dark:border-blue-700',
  };

  const iconPaths = {
    error: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  if (!message) return null;

  return (
    <div 
      className={`
        flex items-center p-4 mb-4 border rounded-lg
        ${typeClasses[type]}
        ${className}
      `}
      role="alert"
    >
      <svg 
        className="flex-shrink-0 w-5 h-5 mr-3" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2" 
          d={iconPaths[type]} 
        />
      </svg>
      
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-4 text-white/80 hover:text-white focus:outline-none"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
