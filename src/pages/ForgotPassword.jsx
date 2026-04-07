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
      console.log('[ForgotPassword] Envoi forgot-password:', { identifier: values.identifier });
      
      // Appel API pour demander la réinitialisation du mot de passe
      const res = await API.post("/auth/forgot-password", {
        identifier: values.identifier,
      });

      console.log('[ForgotPassword] Réponse complète:', JSON.stringify(res.data, null, 2));

      if (res.data && res.data.success) {
        // Force l'affichage du succès
        const successMsg = res.data.email 
          ? `Un code de vérification a été envoyé à ${res.data.email}`
          : "Un code de vérification a été envoyé à votre adresse email";
        
        console.log('[ForgotPassword] Succès - Message:', successMsg);
        setApiSuccess(successMsg);
        setShowResetForm(true);
        setResetToken(res.data.token || "");
        console.log('[ForgotPassword] Token:', res.data.token);
      } else {
        console.log('[ForgotPassword] Réponse sans succès:', res.data);
        setApiError(res.data?.message || "Erreur inconnue");
      }
    } catch (error) {
      console.error('[ForgotPassword] Erreur complète:', error);
      console.error('[ForgotPassword] Response:', error.response?.data);
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
      // Validate token exists
      if (!resetToken) {
        setApiError("Session expirée. Veuillez redemander un code de vérification.");
        setLoading(false);
        return;
      }
      
      // Validation du code
      if (!resetValues.code || resetValues.code.length !== 6) {
        setApiError("Le code de vérification doit contenir 6 chiffres.");
        setLoading(false);
        return;
      }
      
      console.log('[ForgotPassword] Envoi reset-password:', {
        tokenLength: resetToken.length,
        codeLength: resetValues.code.length,
        hasPassword: !!resetValues.newPassword
      });
      
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
      console.error('[ForgotPassword] Erreur reset:', error);
      console.error('[ForgotPassword] Response:', error.response?.data);
      
      // Afficher le message d'erreur du serveur si disponible
      const serverMessage = error.response?.data?.message;
      if (serverMessage) {
        setApiError(serverMessage);
      } else if (error.response?.status === 400) {
        setApiError("Code invalide ou expiré. Veuillez redemander un code.");
      } else {
        setApiError("Erreur lors de la réinitialisation du mot de passe");
      }
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
            
            {/* Messages d'erreur/succès - VERSION FORCÉE */}
            <div data-testid="messages-container">
              {apiError && (
                <div className="bg-red-500 text-white p-4 rounded-lg mb-4 flex items-center" role="alert">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="flex-1">{apiError}</span>
                  <button onClick={() => setApiError("")} className="ml-4 text-white hover:text-gray-200" type="button">✕</button>
                </div>
              )}
              
              {apiSuccess && (
                <div className="bg-green-500 text-white p-4 rounded-lg mb-4 flex items-center" role="alert">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="flex-1">{apiSuccess}</span>
                  <button onClick={() => setApiSuccess("")} className="ml-4 text-white hover:text-gray-200" type="button">✕</button>
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmitIdentifier} noValidate className="w-full max-w-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                <FiMail className="text-orange-500" />
                <span>Entrez votre email</span>
              </div>
              
              <FormInput
                label="Entrez l'Email"
                name="identifier"
                type="text"
                value={values.identifier}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.identifier}
                touched={touched.identifier}
                placeholder="votre@email.com"
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
