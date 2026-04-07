/**
 * Hook de validation réutilisable pour les formulaires
 * @param {Object} initialValues - Valeurs initiales du formulaire
 * @param {Object} validationRules - Règles de validation pour chaque champ
 * @returns {Object} - Fonctions et états pour gérer le formulaire
 */
import { useState, useCallback } from 'react';

export function useFormValidation(initialValues = {}, validationRules = {}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Valide un seul champ
  const validateField = useCallback((name, value) => {
    const rules = validationRules[name];
    if (!rules) return null;

    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return rules.requiredMessage || `Veuillez saisir ${name}`;
    }

    // Min length validation
    if (rules.minLength && value && value.length < rules.minLength) {
      return rules.minLengthMessage || `Le champ doit contenir au moins ${rules.minLength} caractères`;
    }

    // Max length validation
    if (rules.maxLength && value && value.length > rules.maxLength) {
      return rules.maxLengthMessage || `Le champ ne peut pas dépasser ${rules.maxLength} caractères`;
    }

    // Email validation
    if (rules.email && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return rules.emailMessage || 'Veuillez entrer une adresse email valide';
      }
    }

    // Phone validation - Senegal format: 77XXXXXXX, 78XXXXXXX, +22177XXXXXXX, +22178XXXXXXX
    if (rules.phone && value) {
      const cleaned = value.replace(/[\s\-\(\)\.]/g, '');
      let phone = cleaned;
      
      if (phone.startsWith('+221')) {
        phone = phone.substring(3);
      } else if (phone.startsWith('221')) {
        phone = phone.substring(2);
      } else if (phone.startsWith('00221')) {
        phone = phone.substring(4);
      } else if (phone.startsWith('0')) {
        phone = phone.substring(1);
      }
      
      const digitsOnly = phone.replace(/\D/g, '');
      const validPrefix = digitsOnly.startsWith('77') || digitsOnly.startsWith('78');
      
      if (digitsOnly.length !== 9 || !validPrefix) {
        return rules.phoneMessage || 'Numéro invalide. Formats acceptés: 77XXXXXXX, 78XXXXXXX, +22177XXXXXXX, +22178XXXXXXX';
      }
    }

    // Custom validation
    if (rules.custom && typeof rules.custom === 'function') {
      const customError = rules.custom(value, values);
      if (customError) {
        return customError;
      }
    }

    return null;
  }, [validationRules, values]);

  // Valide tous les champs
  const validateAll = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach((fieldName) => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules, validateField]);

  // Gère le changement de valeur d'un champ
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setValues((prev) => ({ ...prev, [name]: newValue }));

    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, newValue);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);

  // Gère le blur (quand l'utilisateur quitte le champ)
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    
    setTouched((prev) => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, [validateField]);

  // Réinitialise le formulaire
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // Définit les valeurs du formulaire
  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  // Définit une erreur pour un champ
  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateField,
    validateAll,
    resetForm,
    setFieldValue,
    setFieldError,
    setErrors,
    setTouched,
    setValues,
    isValid: Object.keys(errors).filter(key => errors[key]).length === 0
  };
}

export default useFormValidation;
