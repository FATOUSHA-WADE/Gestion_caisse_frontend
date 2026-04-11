import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import loginImage from "../assets/login.png";
import { FiShoppingCart } from "react-icons/fi";
import { FormInput, Button, Alert } from "../components/ui";
import { useFormValidation } from "../hooks/useFormValidation";

// Règles de validation pour le formulaire de login
const loginValidationRules = {
  telephone: {
    required: true,
    requiredMessage: "Veuillez saisir votre numéro de téléphone",
    phone: true,
    phoneMessage: "Veuillez entrer un numéro de téléphone valide",
  },
  password: {
    required: true,
    requiredMessage: "Veuillez saisir votre mot de passe",
    minLength: 1,
    minLengthMessage: "Le mot de passe doit contenir au moins 1 caractère",
  },
};

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
  } = useFormValidation(
    { telephone: "", password: "" },
    loginValidationRules
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    setApiError("");

    // Validate all fields before submitting
    const isValid = validateAll();
    
    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      console.log('[Login] Tentative de connexion...');
      const res = await API.post("/auth/login", {
        telephone: values.telephone,
        password: values.password,
      });

      console.log('[Login] Réponse:', res.data);
      
      if (res.data.success) {
        login(res.data.data.token, res.data.data.user);
        navigate("/ventes", { replace: true });
      }
    } catch (error) {
      console.error('[Login] Erreur:', error);
      console.error('[Login] Response:', error.response?.data);
      
      // Get error message from various sources
      let errorMessage = "Erreur de connexion. Veuillez vérifier que le serveur est démarré et réessayer.";
      
      if (error.response?.status === 401) {
        errorMessage = "Identifiants incorrects. Veuillez vérifier votre numéro de téléphone et votre mot de passe.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message && error.message.includes('Network')) {
        errorMessage = "Erreur de connexion. Le serveur n'est pas joignable. Veuillez vérifier que le serveur est démarré.";
      }
      
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#222] items-center justify-center">
      {/* Image à gauche */}
      <div className="hidden md:flex w-1/2 h-full items-center justify-center relative">
        <img 
          src={loginImage}
          className="w-full h-full object-cover"
          alt="Login"
        />

        <div className="absolute bottom-8 left-8 flex items-center">
          <div className="bg-orange-500 w-10 h-10 rounded-lg flex items-center justify-center mr-2">
            <FiShoppingCart className="text-white" size={20} />
          </div>
          <span className="text-orange-500 text-xl font-bold tracking-wide">
            GESTICOM
          </span>
        </div>
      </div>

      {/* Formulaire à droite */}
      <div className="flex flex-col items-center justify-center w-full md:w-1/2 h-full bg-white p-6">
        <div className="flex flex-col items-center mb-6 mt-4">
          <div className="bg-orange-500 w-10 h-10 rounded-lg flex items-center justify-center mr-2">
            <FiShoppingCart className="text-white" size={20} />
          </div>
          <span className="text-orange-500 text-2xl font-bold tracking-wide">GESTICOM</span>
        </div>
        
        <h2 className="text-xl font-bold mb-2 text-center">Connexion</h2>
        <p className="mb-6 text-center text-gray-600">Entrez vos identifiants pour accéder au système</p>
        
        {/* Message d'erreur API */}
        {apiError && (
          <Alert 
            type="error" 
            message={apiError} 
            onClose={() => setApiError("")}
            className="w-full max-w-sm mb-4"
          />
        )}
        
        <form onSubmit={handleLogin} noValidate className="w-full max-w-sm flex flex-col gap-4">
          <FormInput
            label="Numéro de Téléphone"
            name="telephone"
            type="text"
            value={values.telephone}
            onChange={handleChange}
            onBlur={handleBlur}
            error={errors.telephone}
            touched={touched.telephone}
            placeholder="77.. ou +22177..."
            required
          />
          
          <div>
            <FormInput
              label="Mot de passe"
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={errors.password}
              touched={touched.password}
              placeholder="********"
              required
              showPasswordToggle
            />
            
            {/* Lien Mot de passe oublié */}
            <div className="flex justify-end mt-2">
              <Link 
                to="/forgot-password" 
                className="text-sm text-orange-500 hover:text-orange-700 hover:underline transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </div>
          
          <Button 
            type="submit" 
            fullWidth 
            loading={loading}
            className="mt-2"
          >
            Se Connecter
          </Button>
        </form>
      </div>
    </div>
  );
}
