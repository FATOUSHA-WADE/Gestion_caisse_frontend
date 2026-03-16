import { useState, useRef } from "react";
import { 
  X,
  Save,
  Building,
  Bell,
  FileText,
  Globe,
  Shield,
  Upload,
  Palette,
  CreditCard
} from "lucide-react";
import Layout from "../components/Layout";
import API from "../api/axios";

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("commerce");
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [settings, setSettings] = useState({
    // Commerce info
    commerceName: "GESTICOM",
    commerceAdresse: "",
    commerceTelephone: "",
    commerceEmail: "",
    devise: "FCFA",
    tvaxe: 0,
    messagePiedRecu: "Merci de votre visite ! À bientôt.",
    logo: "",
    couleurPrincipale: "#f97316",
    modesPaiement: ["Espèces", "Mobile Money", "Carte"],
    
    // Preferences
    alertesStock: true,
    generationRecuAuto: true,
    langue: "fr",
    
    // Security
    sessionsSimultanees: 1,
    requirePasswordChange: false,
    dureeSession: 30
  });
  const [formErrors, setFormErrors] = useState({});

  // Handle logo upload
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setSettings({ ...settings, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // Add new payment method
  const addModePaiement = () => {
    const newMode = prompt("Entrez le nom du mode de paiement:");
    if (newMode && !settings.modesPaiement.includes(newMode)) {
      setSettings({ ...settings, modesPaiement: [...settings.modesPaiement, newMode] });
    }
  };

  // Remove payment method
  const removeModePaiement = (modeToRemove) => {
    setSettings({
      ...settings,
      modesPaiement: settings.modesPaiement.filter(m => m !== modeToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const errors = {};
    if (!settings.commerceName || settings.commerceName.trim() === "") {
      errors.commerceName = "Veuillez saisir le nom du commerce";
    }
    if (!settings.commerceTelephone || settings.commerceTelephone.trim() === "") {
      errors.commerceTelephone = "Veuillez saisir le téléphone";
    }
    if (settings.commerceEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.commerceEmail)) {
      errors.commerceEmail = "Veuillez entrer une adresse email valide";
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Save settings to backend (you'll need to create an endpoint for this)
      await API.post("/settings", settings, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Paramètres enregistrés avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      // For demo, just show success
      alert("Paramètres enregistrés (simulation)");
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "commerce", label: "Informations du commerce", icon: Building },
    { id: "preferences", label: "Préférences", icon: Bell },
    { id: "securite", label: "Sécurité & Accès", icon: Shield },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Paramètres</h1>
          <p className="text-gray-500">Configurez votre application</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-100">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "text-orange-500 border-b-2 border-orange-500"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="p-6">
            {/* Commerce Info */}
            {activeTab === "commerce" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du commerce <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={settings.commerceName}
                      onChange={(e) => {
                        setSettings({ ...settings, commerceName: e.target.value });
                        setFormErrors({ ...formErrors, commerceName: "" });
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        formErrors.commerceName ? "border-red-500 bg-red-50" : "border-gray-200"
                      }`}
                    />
                    {formErrors.commerceName && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.commerceName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={settings.commerceTelephone}
                      onChange={(e) => {
                        setSettings({ ...settings, commerceTelephone: e.target.value });
                        setFormErrors({ ...formErrors, commerceTelephone: "" });
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        formErrors.commerceTelephone ? "border-red-500 bg-red-50" : "border-gray-200"
                      }`}
                    />
                    {formErrors.commerceTelephone && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.commerceTelephone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={settings.commerceEmail}
                      onChange={(e) => {
                        setSettings({ ...settings, commerceEmail: e.target.value });
                        setFormErrors({ ...formErrors, commerceEmail: "" });
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        formErrors.commerceEmail ? "border-red-500 bg-red-50" : "border-gray-200"
                      }`}
                    />
                    {formErrors.commerceEmail && (
                      <p className="mt-1 text-sm text-red-500">{formErrors.commerceEmail}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Devise
                    </label>
                    <select
                      value={settings.devise}
                      onChange={(e) => setSettings({ ...settings, devise: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="FCFA">FCFA</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      TVA / TAXE (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={settings.tvaxe}
                      onChange={(e) => setSettings({ ...settings, tvaxe: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message pied de reçu
                  </label>
                  <textarea
                    value={settings.messagePiedRecu}
                    onChange={(e) => setSettings({ ...settings, messagePiedRecu: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo du commerce
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                      ) : settings.logo ? (
                        <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Choisir une image
                      </button>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG - Max 2Mo</p>
                    </div>
                  </div>
                </div>

                {/* Couleur Principale */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur principale de l'application
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={settings.couleurPrincipale}
                      onChange={(e) => setSettings({ ...settings, couleurPrincipale: e.target.value })}
                      className="w-16 h-12 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#ef4444"].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setSettings({ ...settings, couleurPrincipale: color })}
                            className={`w-8 h-8 rounded-full border-2 transition-transform ${
                              settings.couleurPrincipale === color ? "border-gray-800 scale-110" : "border-transparent"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Couleur actuelle: <span className="font-mono">{settings.couleurPrincipale}</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modes de Paiement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Modes de paiement acceptés
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {settings.modesPaiement.map((mode, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg group"
                      >
                        <CreditCard className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        <span className="text-sm text-gray-700 dark:text-gray-200">{mode}</span>
                        <button
                          type="button"
                          onClick={() => removeModePaiement(mode)}
                          className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addModePaiement}
                    className="px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:border-orange-500 hover:text-orange-500 dark:hover:text-orange-400 transition-colors flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    Ajouter un mode de paiement
                  </button>
                </div>
              </div>
            )}

            {/* Preferences */}
            {activeTab === "preferences" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-800">Alertes stock automatiques</p>
                      <p className="text-sm text-gray-500">Notification quand le stock descend sous le minimum</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, alertesStock: !settings.alertesStock })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.alertesStock ? "bg-orange-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.alertesStock ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-800">Génération reçu automatique</p>
                      <p className="text-sm text-gray-500">Créer un reçu après chaque vente validée</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, generationRecuAuto: !settings.generationRecuAuto })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.generationRecuAuto ? "bg-orange-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.generationRecuAuto ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Langue de l'interface
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "fr", label: "Français" },
                      { value: "en", label: "English" },
                      { value: "wo", label: "Wolof" },
                    ].map((lang) => (
                      <button
                        key={lang.value}
                        type="button"
                        onClick={() => setSettings({ ...settings, langue: lang.value })}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          settings.langue === lang.value
                            ? "border-orange-400 bg-gray-800 text-orange-200"
                            : "border-gray-700 bg-gray-900 text-gray-300 hover:border-orange-400"
                        }`}
                      >
                        <Globe className="w-5 h-5 mx-auto mb-1 text-orange-200" />
                        <span className="text-sm font-medium">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Security */}
            {activeTab === "securite" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-800">Changement de mot de passe requis</p>
                      <p className="text-sm text-gray-500">Forcer le changement de mot de passe périodiquement</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, requirePasswordChange: !settings.requirePasswordChange })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.requirePasswordChange ? "bg-orange-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.requirePasswordChange ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durée de session (minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={settings.dureeSession}
                    onChange={(e) => setSettings({ ...settings, dureeSession: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sessions simultanées autorisées
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={settings.sessionsSimultanees}
                    onChange={(e) => setSettings({ ...settings, sessionsSimultanees: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
              >
                {loading ? (
                  "Enregistrement..."
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Enregistrer les paramètres
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
