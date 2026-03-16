import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import loginImage from "../assets/login.png";
import { FiShoppingCart, FiArrowLeft, FiMail, FiPhone } from "react-icons/fi";
import { FormInput, Button, Alert } from "../components/ui";
import { useFormValidation } from "../hooks/useFormValidation";
import API from "../api/axios";

// Règles de validation pour le formulaire de mot de passe oublié
const forgotPasswordValidationRules = {
  identifier: {
    required: true,
    requiredMessage: "Veuillez saisir votre numéro de téléphone ou email",
  },
};

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetToken, setResetToken] = useState("");
  
  // Pour le code de vérification et le nouveau mot de passe
  const [resetValues, setResetValues] = useState({
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [resetErrors, setResetErrors] = useState({});
  const [resetTouched, setResetTouched] = useState({});

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
  } = useFormValidation(
    { identifier: "" },
    forgotPasswordValidationRules
  );

  // Validation pour le formulaire de réinitialisation
  const validateResetForm = () => {
    const errors = {};
    
    if (!resetValues.code.trim()) {
      errors.code = "Veuillez saisir le code de vérification";
    }
    
    if (!resetValues.newPassword) {
      errors.newPassword = "Veuillez saisir votre nouveau mot de passe";
    } else if (resetValues.newPassword.length < 8) {
      errors.newPassword = "Le mot de passe doit contenir au moins 8 caractères";
    }
    
    if (!resetValues.confirmPassword) {
      errors.confirmPassword = "Veuillez confirmer votre mot de passe";
    } else if (resetValues.newPassword !== resetValues.confirmPassword) {
      errors.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    
    setResetErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitIdentifier = async (e) => {
    e.preventDefault();
    setApiError("");
    setApiSuccess("");

    const isValid = validateAll();
    
    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      // Appel API pour demander la réinitialisation du mot de passe
      const res = await API.post("/auth/forgot-password", {
        identifier: values.identifier,
      });

      if (res.data.success) {
        let successMsg = res.data.email 
          ? `Un code de vérification a été envoyé à ${res.data.email}`
          : "Un code de vérification a été envoyé à votre adresse email";
        
        setApiSuccess(successMsg);
        setShowResetForm(true);
        setResetToken(res.data.token || "");
      }
    } catch (error) {
      console.error(error);
      setApiError(error.response?.data?.message || "Erreur lors de la demande de réinitialisation");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setApiError("");
    setApiSuccess("");

    const isValid = validateResetForm();
    
    if (!isValid) {
      return;
    }

    setLoading(true);

    try {
      // Appel API pour réinitialiser le mot de passe
      const res = await API.post("/auth/reset-password", {
        token: resetToken,
        code: resetValues.code,
        newPassword: resetValues.newPassword,
      });

      if (res.data.success) {
        setApiSuccess(res.data.message || "Mot de passe réinitialisé avec succès!");
        // Rediriger vers la page de login après 2 secondes
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (error) {
      console.error(error);
      setApiError(error.response?.data?.message || "Erreur lors de la réinitialisation du mot de passe");
    } finally {
      setLoading(false);
    }
  };

  const handleResetChange = (e) => {
    const { name, value } = e.target;
    setResetValues(prev => ({ ...prev, [name]: value }));
    
    // Validate on change if field has been touched
    if (resetTouched[name]) {
      const newErrors = { ...resetErrors };
      
      if (name === "code" && !value.trim()) {
        newErrors.code = "Veuillez saisir le code de vérification";
      } else if (name === "code") {
        delete newErrors.code;
      }
      
      if (name === "newPassword" && !value) {
        newErrors.newPassword = "Veuillez saisir votre nouveau mot de passe";
      } else if (name === "newPassword" && value.length < 8) {
        newErrors.newPassword = "Le mot de passe doit contenir au moins 8 caractères";
      } else if (name === "newPassword") {
        delete newErrors.newPassword;
      }
      
      if (name === "confirmPassword" && !value) {
        newErrors.confirmPassword = "Veuillez confirmer votre mot de passe";
      } else if (name === "confirmPassword" && value !== resetValues.newPassword) {
        newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
      } else if (name === "confirmPassword") {
        delete newErrors.confirmPassword;
      }
      
      setResetErrors(newErrors);
    }
  };

  const handleResetBlur = (e) => {
    const { name, value } = e.target;
    setResetTouched(prev => ({ ...prev, [name]: true }));
    
    const newErrors = { ...resetErrors };
    
    if (name === "code" && !value.trim()) {
      newErrors.code = "Veuillez saisir le code de vérification";
    } else if (name === "code") {
      delete newErrors.code;
    }
    
    if (name === "newPassword" && !value) {
      newErrors.newPassword = "Veuillez saisir votre nouveau mot de passe";
    } else if (name === "newPassword" && value.length < 8) {
      newErrors.newPassword = "Le mot de passe doit contenir au moins 8 caractères";
    } else if (name === "newPassword") {
      delete newErrors.newPassword;
    }
    
    if (name === "confirmPassword" && !value) {
      newErrors.confirmPassword = "Veuillez confirmer votre mot de passe";
    } else if (name === "confirmPassword" && value !== resetValues.newPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    } else if (name === "confirmPassword") {
      delete newErrors.confirmPassword;
    }
    
    setResetErrors(newErrors);
  };

  return (
    <div className="flex h-screen w-full bg-[#222] items-center justify-center">
      {/* Image à gauche */}
      <div className="hidden md:flex w-1/2 h-full items-center justify-center relative">
        <img 
          src={loginImage}
          className="w-full h-full object-cover"
          alt="Forgot Password"
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
      <div className="flex flex-col items-center justify-center w-full md:w-1/2 h-full bg-white p-6 overflow-y-auto">
        {/* Bouton retour */}
        <div className="absolute top-4 left-4">
          <Link 
            to="/" 
            className="flex items-center text-gray-600 hover:text-orange-500 transition-colors"
          >
            <FiArrowLeft className="mr-2" />
            Retour
          </Link>
        </div>

        <div className="flex flex-col items-center mb-6 mt-4">
          <div className="bg-orange-500 w-10 h-10 rounded-lg flex items-center justify-center mr-2">
            <FiShoppingCart className="text-white" size={20} />
          </div>
          <span className="text-orange-500 text-2xl font-bold tracking-wide">GESTICOM</span>
        </div>
        
        {!showResetForm ? (
          // Formulaire pour demander le code de vérification
          <>
            <h2 className="text-xl font-bold mb-2 text-center">Mot de passe oublié</h2>
            <p className="mb-6 text-center text-gray-600">
              Entrez votre email pour réinitialiser votre mot de passe
            </p>
            
            {/* Messages d'erreur/succès */}
            {apiError && (
              <Alert 
                type="error" 
                message={apiError} 
                onClose={() => setApiError("")}
                className="w-full max-w-sm mb-4"
              />
            )}
            
            {apiSuccess && (
              <Alert 
                type="success" 
                message={apiSuccess} 
                onClose={() => setApiSuccess("")}
                className="w-full max-w-sm mb-4"
              />
            )}
            
            <form onSubmit={handleSubmitIdentifier} noValidate className="w-full max-w-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                <FiMail className="text-orange-500" />
              </div>
              
              <FormInput
                label="Email"
                name="identifier"
                type="email"
                value={values.identifier}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.identifier}
                touched={touched.identifier}
                placeholder="votre@email.com..."
                required
              />
              
              <Button 
                type="submit" 
                fullWidth 
                loading={loading}
                className="mt-2"
              >
                Envoyer le code
              </Button>
            </form>
          </>
        ) : (
          // Formulaire pour entrer le code et nouveau mot de passe
          <>
            <h2 className="text-xl font-bold mb-2 text-center">Réinitialiser le mot de passe</h2>
            <p className="mb-6 text-center text-gray-600">
              Entrez le code de vérification et votre nouveau mot de passe
            </p>
            
            {/* Messages d'erreur/succès */}
            {apiError && (
              <Alert 
                type="error" 
                message={apiError} 
                onClose={() => setApiError("")}
                className="w-full max-w-sm mb-4"
              />
            )}
            
            {apiSuccess && (
              <Alert 
                type="success" 
                message={apiSuccess} 
                onClose={() => setApiSuccess("")}
                className="w-full max-w-sm mb-4"
              />
            )}
            
            <form onSubmit={handleResetPassword} noValidate className="w-full max-w-sm flex flex-col gap-4">
              <FormInput
                label="Code de vérification"
                name="code"
                type="text"
                value={resetValues.code}
                onChange={handleResetChange}
                onBlur={handleResetBlur}
                error={resetErrors.code}
                touched={resetTouched.code}
                placeholder="Entrez le code..."
                required
              />
              
              <FormInput
                label="Nouveau mot de passe"
                name="newPassword"
                type="password"
                value={resetValues.newPassword}
                onChange={handleResetChange}
                onBlur={handleResetBlur}
                error={resetErrors.newPassword}
                touched={resetTouched.newPassword}
                placeholder="至少 8 caractères"
                required
              />
              
              <FormInput
                label="Confirmer le mot de passe"
                name="confirmPassword"
                type="password"
                value={resetValues.confirmPassword}
                onChange={handleResetChange}
                onBlur={handleResetBlur}
                error={resetErrors.confirmPassword}
                touched={resetTouched.confirmPassword}
                placeholder="Confirmez le mot de passe..."
                required
              />
              
              <Button 
                type="submit" 
                fullWidth 
                loading={loading}
                className="mt-2"
              >
                Réinitialiser le mot de passe
              </Button>
              
              <Button 
                type="button"
                variant="outline"
                fullWidth 
                onClick={() => {
                  setShowResetForm(false);
                  setApiError("");
                  setApiSuccess("");
                }}
              >
                Renvoyer le code
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
