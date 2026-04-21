import { useState, useRef, useEffect } from "react";
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
  CheckCircle,
  AlertCircle,
  Plus
} from "lucide-react";
import Layout from "../components/Layout";
import API from "../api/axios";
import { useParameters } from "../context/ParameterContext";

export default function Settings() {
  const { applyThemeColor, updateParametersLocally } = useParameters();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("commerce");
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);
  
  const [settings, setSettings] = useState({
    nomCommerce: "GESTICOM",
    adresse: "",
    telephone: "",
    email: "",
    devise: "FCFA",
    tauxTva: 0,
    messagePiedRecu: "",
    logo: "",
    couleurPrincipale: "#f97316",
    modesPaiement: [],
    alertesStock: true,
    generationRecuAuto: true,
    langue: "fr",
    sessionsSimultanees: 1,
    requirePasswordChange: false,
    dureeSession: 30,
    modeFluide: false,
    modeRTL: false,
    navigationPosition: "vertical"
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setInitialLoading(true);
      const token = localStorage.getItem("token");
      const res = await API.get("/parametres", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.data) {
        setSettings({
          nomCommerce: res.data.data.nomCommerce || "GESTICOM",
          adresse: res.data.data.adresse || "",
          telephone: res.data.data.telephone || "",
          email: res.data.data.email || "",
          devise: res.data.data.devise || "FCFA",
          tauxTva: res.data.data.tauxTva || 0,
          messagePiedRecu: res.data.data.messagePiedRecu || "",
          logo: res.data.data.logo || "",
          couleurPrincipale: res.data.data.couleurPrincipale || "#f97316",
          modesPaiement: res.data.data.modesPaiement || [],
          alertesStock: res.data.data.alertesStock ?? true,
          generationRecuAuto: res.data.data.generationRecuAuto ?? true,
          langue: res.data.data.langue || "fr",
          sessionsSimultanees: res.data.data.sessionsSimultanees || 1,
          requirePasswordChange: res.data.data.requirePasswordChange ?? false,
          dureeSession: res.data.data.dureeSession || 30,
          modeFluide: res.data.data.modeFluide ?? false,
          modeRTL: res.data.data.modeRTL ?? false,
          navigationPosition: res.data.data.navigationPosition || "vertical"
        });
        setLogoPreview(res.data.data.logo || null);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setLogoFile(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const formData = new FormData();
      formData.append("nomCommerce", settings.nomCommerce);
      formData.append("adresse", settings.adresse);
      formData.append("telephone", settings.telephone);
      formData.append("email", settings.email);
      formData.append("devise", settings.devise);
      formData.append("tauxTva", settings.tauxTva.toString());
      formData.append("messagePiedRecu", settings.messagePiedRecu);
      formData.append("couleurPrincipale", settings.couleurPrincipale);
      formData.append("alertesStock", settings.alertesStock.toString());
      formData.append("generationRecuAuto", settings.generationRecuAuto.toString());
      formData.append("langue", settings.langue);
      formData.append("sessionsSimultanees", settings.sessionsSimultanees.toString());
      formData.append("requirePasswordChange", settings.requirePasswordChange.toString());
      formData.append("dureeSession", settings.dureeSession.toString());
      formData.append("modeFluide", settings.modeFluide.toString());
      formData.append("modeRTL", settings.modeRTL.toString());
      formData.append("navigationPosition", settings.navigationPosition);
      formData.append("modesPaiement", JSON.stringify(settings.modesPaiement));
      
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const res = await API.put("/parametres", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      if (res.data.success) {
        const savedData = res.data.data;
        setSettings(savedData);
        applyThemeColor(savedData.couleurPrincipale);
        updateParametersLocally(savedData);
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 3000);
      }
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setErrorMessage(error.response?.data?.message || "Une erreur est survenue");
      setShowErrorPopup(true);
      setTimeout(() => setShowErrorPopup(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: "commerce", label: "Commerce" },
    { id: "preferences", label: "Préférences" },
    { id: "securite", label: "Sécurité" },
  ];

  return (
    <Layout>
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-500">Configurez les paramètres de votre application</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-medium text-sm transition-colors relative ${
                    activeTab === tab.id
                      ? "text-orange-600"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === "commerce" && (
              <div className="space-y-6">
                {/* Logo Upload */}
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-orange-500 text-white p-1.5 rounded-full hover:bg-orange-600"
                    >
                      <Upload className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Logo du commerce</h3>
                    <p className="text-sm text-gray-500">PNG ou JPG, max 2Mo</p>
                  </div>
                </div>

                {/* Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du commerce
                    </label>
                    <input
                      type="text"
                      value={settings.nomCommerce}
                      onChange={(e) => {
                        setSettings({ ...settings, nomCommerce: e.target.value });
                        setFormErrors({ ...formErrors, nomCommerce: "" });
                      }}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="text"
                      value={settings.telephone}
                      onChange={(e) => {
                        setSettings({ ...settings, telephone: e.target.value });
                        setFormErrors({ ...formErrors, telephone: "" });
                      }}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={settings.adresse}
                      onChange={(e) => setSettings({ ...settings, adresse: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Devise
                    </label>
                    <input
                      type="text"
                      value={settings.devise}
                      onChange={(e) => setSettings({ ...settings, devise: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taux TVA (%)
                    </label>
                    <input
                      type="number"
                      value={settings.tauxTva}
                      onChange={(e) => setSettings({ ...settings, tauxTva: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message au pied du reçu
                    </label>
                    <textarea
                      value={settings.messagePiedRecu}
                      onChange={(e) => setSettings({ ...settings, messagePiedRecu: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      placeholder="Merci pour votre achat !"
                    />
                  </div>

                    <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Modes de paiement
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {settings.modesPaiement.map((mode) => (
                        <label
                          key={mode}
                          className={`flex items-center justify-between gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                            settings.modesPaiement.includes(mode)
                              ? 'border-orange-500 bg-orange-50'
                              : 'border-gray-300 bg-white hover:border-gray-400'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={settings.modesPaiement.includes(mode)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSettings({ ...settings, modesPaiement: [...settings.modesPaiement, mode] });
                                } else {
                                  setSettings({ ...settings, modesPaiement: settings.modesPaiement.filter(m => m !== mode) });
                                }
                              }}
                              className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <span className={`font-medium ${
                              settings.modesPaiement.includes(mode) ? 'text-gray-900' : 'text-gray-600'
                            }`}>{mode}</span>
                          </div>
                          {mode !== 'Espèces' && mode !== 'Orange Money' && mode !== 'Wave' && mode !== 'Carte bancaire' && (
                            <button
                              type="button"
                              onClick={() => setSettings({ ...settings, modesPaiement: settings.modesPaiement.filter(m => m !== mode) })}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              ✕
                            </button>
                          )}
                        </label>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        placeholder="Ajouter un mode de paiement..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-orange-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            const newMode = e.target.value.trim();
                            if (!settings.modesPaiement.includes(newMode)) {
                              setSettings({ ...settings, modesPaiement: [...settings.modesPaiement, newMode] });
                            }
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "preferences" && (
              <div className="space-y-6">
                {/* Auto Receipt */}
                <div className="flex items-center justify-between py-4 border-b border-gray-200">
                  <div>
                    <h3 className="font-medium text-gray-900">Génération automatique de reçu</h3>
                    <p className="text-sm text-gray-500">Générer un reçu après chaque vente</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, generationRecuAuto: !settings.generationRecuAuto })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.generationRecuAuto ? "bg-orange-500" : "bg-gray-300"
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      settings.generationRecuAuto ? "translate-x-6" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>

                {/* Language */}
                <div className="py-4 border-b border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Langue de l'interface
                  </label>
                  <select
                    value={settings.langue}
                    onChange={(e) => setSettings({ ...settings, langue: e.target.value })}
                    className="w-full md:w-1/2 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="wo">Wolof</option>
                  </select>
                </div>

                {/* Color Picker */}
                <div className="py-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Couleur principale
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={settings.couleurPrincipale}
                      onChange={(e) => {
                        setSettings({ ...settings, couleurPrincipale: e.target.value });
                        applyThemeColor(e.target.value);
                      }}
                      className="w-14 h-14 border-0 rounded-lg cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={settings.couleurPrincipale}
                      onChange={(e) => {
                        setSettings({ ...settings, couleurPrincipale: e.target.value });
                        applyThemeColor(e.target.value);
                      }}
                      className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500 w-32"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "securite" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sessions simultanées maximum
                  </label>
                  <input
                    type="number"
                    value={settings.sessionsSimultanees}
                    onChange={(e) => setSettings({ ...settings, sessionsSimultanees: parseInt(e.target.value) || 1 })}
                    min={1}
                    max={10}
                    className="w-full md:w-1/2 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée de session (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.dureeSession}
                    onChange={(e) => setSettings({ ...settings, dureeSession: parseInt(e.target.value) || 30 })}
                    min={5}
                    max={120}
                    className="w-full md:w-1/2 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Exiger le changement de mot de passe</h3>
                    <p className="text-sm text-gray-500">Forcer les utilisateurs à changer leur mot de passe</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, requirePasswordChange: !settings.requirePasswordChange })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.requirePasswordChange ? "bg-orange-500" : "bg-gray-300"
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      settings.requirePasswordChange ? "translate-x-6" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Enregistrer les paramètres
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSuccessPopup && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <CheckCircle className="w-5 h-5" />
          Paramètres enregistrés avec succès
        </div>
      )}

      {showErrorPopup && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
          <AlertCircle className="w-5 h-5" />
          {errorMessage}
        </div>
      )}
    </Layout>
  );
}
