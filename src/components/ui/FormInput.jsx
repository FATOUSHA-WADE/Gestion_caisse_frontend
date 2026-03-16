import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Composant Input réutilisable avec validation
 * @param {Object} props - Propriétés du composant
 */
export default function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  placeholder,
  required = false,
  icon,
  className = '',
  disabled = false,
  showPasswordToggle = false,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const hasError = touched && error;
  
  // Determine if we should show the password toggle
  const isPassword = type === 'password';
  const showToggle = showPasswordToggle && isPassword;
  
  // Determine the actual input type
  const inputType = isPassword && showToggle 
    ? (showPassword ? 'text' : 'password')
    : type;
  
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label 
          htmlFor={name} 
          className="block text-sm font-semibold text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          // Disable native browser validation
          noValidate
          className={`
            w-full p-2 border rounded-lg focus:outline-none focus:ring-2 
            transition-all duration-200
            ${(icon || showToggle) ? 'pr-10' : ''}
            ${hasError 
              ? 'border-red-500 focus:ring-red-300 bg-red-50' 
              : 'border-gray-300 focus:ring-orange-300 focus:border-orange-500'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
          {...props}
        />
        
        {/* Custom password toggle icon */}
        {showToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        )}
        
        {/* Regular icon */}
        {icon && !showToggle && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        )}
      </div>
      
      {hasError && (
        <p className="mt-1 text-sm text-red-500 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
