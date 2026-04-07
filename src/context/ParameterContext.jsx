import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axios";

const ParameterContext = createContext(null);

export function ParameterProvider({ children }) {
  const [parameters, setParameters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch parameters from API
  const fetchParameters = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        // Use default parameters if not logged in
        setParameters(getDefaultParameters());
        setLoading(false);
        return;
      }

      const response = await API.get("/parametres", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const data = response.data.data;
        setParameters(data);
        // Apply theme color immediately
        applyThemeColor(data.couleurPrincipale);
        // Store in localStorage for offline access
        localStorage.setItem("parameters", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Error fetching parameters:", err);
      setError(err);
      // Try to use cached parameters
      const cached = localStorage.getItem("parameters");
      if (cached) {
        try {
          setParameters(JSON.parse(cached));
        } catch {
          setParameters(getDefaultParameters());
        }
      } else {
        setParameters(getDefaultParameters());
      }
    } finally {
      setLoading(false);
    }
  };

  // Get default parameters
  const getDefaultParameters = () => ({
    nomCommerce: "GESTICOM",
    telephone: "",
    email: "",
    devise: "FCFA",
    tauxTva: 0,
    messagePiedRecu: "Merci de votre visite ! À bientôt.",
    logo: null,
    couleurPrincipale: "#f97316",
    modesPaiement: ["ESPECES", "CARTE", "ORANGE_MONEY", "WAVE"],
    alertesStock: true,
    generationRecuAuto: true,
    langue: "fr",
    // UI settings
    modeFluide: false,
    modeRTL: false,
    navigationPosition: "vertical",
    // Theme settings
    themeMode: "light",
    customBgColor: null,
    customTextColor: null,
    customAccentColor: null
  });

  // Apply theme color to CSS variables
  const applyThemeColor = (color) => {
    if (color) {
      document.documentElement.style.setProperty("--theme-primary", color);
      // Also set RGB values for opacity variations
      const rgb = hexToRgb(color);
      if (rgb) {
        document.documentElement.style.setProperty("--theme-primary-rgb", `${rgb.r}, ${rgb.g}, ${rgb.b}`);
      }
    }
  };

  // Apply full theme (mode + colors)
  const applyFullTheme = (params) => {
    const themeMode = params?.themeMode || 'light';
    const accentColor = params?.customAccentColor || params?.couleurPrincipale || '#f97316';
    const bgColor = params?.customBgColor;
    const textColor = params?.customTextColor;

    // Set accent color
    applyThemeColor(accentColor);

    // Apply theme mode class
    document.documentElement.classList.remove('light', 'dark', 'custom');
    document.documentElement.classList.add(themeMode);

    // Apply custom colors if in custom mode
    if (themeMode === 'custom') {
      if (bgColor) {
        document.documentElement.style.setProperty("--custom-bg", bgColor);
      }
      if (textColor) {
        document.documentElement.style.setProperty("--custom-text", textColor);
      }
    }
  };

  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Update parameters
  const updateParameters = async (newData) => {
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      
      // Append all fields to formData
      Object.keys(newData).forEach(key => {
        if (key === 'logo' && newData[key] instanceof File) {
          formData.append(key, newData[key]);
        } else if (key === 'logo' && !newData[key]) {
          // Skip empty logo
        } else if (key === 'modesPaiement') {
          formData.append(key, JSON.stringify(newData[key]));
        } else if (newData[key] !== undefined) {
          formData.append(key, newData[key]);
        }
      });

      const response = await API.put("/parametres", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        const data = response.data.data;
        setParameters(data);
        applyThemeColor(data.couleurPrincipale);
        localStorage.setItem("parameters", JSON.stringify(data));
        return { success: true, data };
      }
      return { success: false, message: response.data.message };
    } catch (err) {
      console.error("Error updating parameters:", err);
      return { 
        success: false, 
        message: err.response?.data?.message || "Erreur lors de la mise à jour" 
      };
    }
  };

  // Fetch parameters on mount
  useEffect(() => {
    fetchParameters();
  }, []);

  // Apply theme color when parameters change
  useEffect(() => {
    if (parameters) {
      applyFullTheme(parameters);
    }
  }, [parameters]);

  return (
    <ParameterContext.Provider value={{ 
      parameters, 
      loading, 
      error, 
      fetchParameters, 
      updateParameters,
      applyThemeColor,
      applyFullTheme 
    }}>
      {children}
    </ParameterContext.Provider>
  );
}

// Hook to use parameters
export const useParameters = () => {
  const context = useContext(ParameterContext);
  if (!context) {
    throw new Error("useParameters must be used within a ParameterProvider");
  }
  return context;
};

export default ParameterContext;
