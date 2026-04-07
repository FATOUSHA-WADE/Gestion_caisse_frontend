import { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  X,
  ShoppingCart,
  DollarSign,
  CreditCard,
  Phone,
  Check,
  Receipt,
  Minus,
  RotateCcw,
  CheckCircle,
  Printer,
  LayoutGrid,
  List,
  RefreshCw
} from "lucide-react";
import Layout from "../components/Layout";
import API from "../api/axios";

export default function Ventes() {
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [cart, setCart] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("ESPECES");
  const [amountGiven, setAmountGiven] = useState("");
  const [processing, setProcessing] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [apiSuccess, setApiSuccess] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  // Nettoyer les données locales et recharger depuis la base
  const refreshProduits = async () => {
    setRefreshing(true);
    // Vider le cache local des produits
    localStorage.removeItem("cached_produits");
    // Recharger depuis la base de données
    await fetchData();
    setRefreshing(false);
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        setLoading(false);
        return;
      }
      
      const [produitsRes, categoriesRes] = await Promise.all([
        API.get("/produits?limit=100", { headers: { Authorization: `Bearer ${token}` } }),
        API.get("/categories", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      
      // Handle the API response structure properly
      const productsData = produitsRes.data.data;
      const categoriesData = categoriesRes.data.data;
      
      setProduits(Array.isArray(productsData) ? productsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error("Erreur de chargement:", error);
      // Show error message to user
      if (error.response?.status === 401) {
        alert("Session expirée. Veuillez vous reconnecter.");
        localStorage.removeItem("token");
        window.location.href = "/";
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrintRecu = async () => {
    if (!lastSale?.id) return;
    try {
      setPrinting(true);
      const token = localStorage.getItem("token");
      const response = await API.get(
        `/recus/${lastSale.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.data?.urlPdf) {
        window.open(`http://localhost:3000/${response.data.data.urlPdf}`, '_blank');
      }
    } catch (err) {
      console.error("Erreur impression:", err);
      alert("Erreur lors de l'impression du reçu");
    } finally {
      setPrinting(false);
    }
  };

  const addToCart = (produit) => {
    const existingItem = cart.find((item) => item.id === produit.id);
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === produit.id
            ? { ...item, quantite: item.quantite + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: produit.id,
          nom: produit.nom,
          prixVente: Number(produit.prixVente),
          quantite: 1,
        },
      ]);
    }
  };

  const updateQuantity = (id, change) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === id) {
            const newQuantity = item.quantite + change;
            return newQuantity > 0 ? { ...item, quantite: newQuantity } : item;
          }
          return item;
        })
        .filter((item) => item.quantite > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.prixVente * item.quantite,
    0
  );

  const changeAmount = amountGiven ? Number(amountGiven) - cartTotal : 0;

  const handlePayment = async () => {
    if (cart.length === 0) {
      alert("Le panier est vide");
      return;
    }
    
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Session expirée. Veuillez vous reconnecter.");
        return;
      }
      
      const lignes = cart.map((item) => ({
        produitId: item.id, // Send as number
        quantite: item.quantite,
        prixUnitaire: item.prixVente.toString(), // Send as string
      }));

      const res = await API.post(
        "/ventes",
        { lignes, modePaiement: paymentMethod },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Handle the response - API returns { success, message, data }
      const saleData = res.data.data || res.data;
      
      if (res.data.success || saleData.id) {
        setLastSale(saleData);
        setShowPaymentModal(false);
        setShowSuccessModal(true);
        setCart([]);
        setAmountGiven("");
        // Show success message
        setApiSuccess("Vente créée avec succès");
        setTimeout(() => setApiSuccess(""), 4000);
      } else {
        alert(res.data.message || "Erreur lors de la vente");
      }
    } catch (error) {
      console.error("Erreur de paiement:", error);
      const errorMessage = error.response?.data?.message || error.message || "Une erreur s'est produite";
      alert("Erreur: " + errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const filteredProduits = produits.filter((produit) => {
    const matchesSearch =
      produit.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produit.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || produit.categorieId == selectedCategory;
    const isActive = produit.statut === "actif" || !produit.statut;
    return matchesSearch && matchesCategory && isActive;
  });

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:3000/${imagePath}`;
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      ESPECES: "Espèces",
      CARTE: "Carte bancaire",
      ORANGE_MONEY: "Orange Money",
      WAVE: "Wave",
    };
    return labels[method] || method;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Point de Vente</h1>
        <p className="text-gray-500">Effectuez vos ventes</p>
      </div>

      {/* Success Message */}
      {apiSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          {apiSuccess}
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row gap-3 sm:gap-6 h-auto lg:h-[calc(100vh-8rem)]">
        {/* Products Section */}
        <div className="flex-1 flex flex-col gap-3 sm:gap-4 min-h-0">
          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Toutes</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nom}
                  </option>
                ))}
              </select>
              {/* View Toggle */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-orange-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                  title="Grille"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-orange-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                  title="Liste"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
              {/* Refresh Button */}
              <button
                onClick={refreshProduits}
                disabled={refreshing}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 disabled:opacity-50"
                title="Rafraîchir les produits"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Products Grid/List */}
          <div className="flex-1 overflow-y-auto min-h-[300px]">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                {filteredProduits.map((produit) => (
                  <button
                    key={produit.id}
                    onClick={() => addToCart(produit)}
                    className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md hover:border-orange-300 transition-all text-left relative group"
                  >
                    <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                      {produit.image ? (
                        <img
                          src={getImageUrl(produit.image)}
                          alt={produit.nom}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-800 text-sm truncate">
                      {produit.nom}
                    </h3>
                    <p className="text-orange-600 font-bold">
                      {new Intl.NumberFormat("fr-FR").format(produit.prixVente)} F
                    </p>
                    <p className="text-xs text-gray-500">Stock: {produit.stock}</p>
                    <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      Ajouter
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProduits.map((produit) => (
                  <button
                    key={produit.id}
                    onClick={() => addToCart(produit)}
                    className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md hover:border-orange-300 transition-all text-left flex items-center gap-3 relative"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {produit.image ? (
                        <img
                          src={getImageUrl(produit.image)}
                          alt={produit.nom}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingCart className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 text-sm truncate">
                        {produit.nom}
                      </h3>
                      <p className="text-xs text-gray-500">{produit.categorie?.nom || "Sans catégorie"}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-orange-600 font-bold">
                        {new Intl.NumberFormat("fr-FR").format(produit.prixVente)} F
                      </p>
                      <p className="text-xs text-gray-500">Stock: {produit.stock}</p>
                    </div>
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity">
                      Ajouter
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Section - Full width on mobile, fixed width on desktop */}
        <div className="w-full lg:w-80 xl:w-96 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col max-h-[50vh] lg:max-h-none">
          {/* Cart Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Panier</h2>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  <RotateCcw className="w-4 h-4 inline mr-1" />
                  Tout effacer
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500">{cart.length} article(s)</p>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Le panier est vide</p>
                <p className="text-sm text-gray-400">Cliquez sur un produit pour l'ajouter</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-800 truncate">{item.nom}</h4>
                      <p className="text-sm text-gray-500">
                        {new Intl.NumberFormat("fr-FR").format(item.prixVente)} F x {item.quantite}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center bg-white rounded-lg border border-gray-200 hover:bg-gray-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantite}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 flex items-center justify-center bg-white rounded-lg border border-gray-200 hover:bg-gray-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-gray-800">Total</span>
              <span className="text-2xl font-bold text-orange-600">
                {new Intl.NumberFormat("fr-FR").format(cartTotal)} F
              </span>
            </div>
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={cart.length === 0}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Procéder au paiement
            </button>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">Mode de paiement</h2>
                <button 
                  onClick={() => setShowPaymentModal(false)} 
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-500">Montant total</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {new Intl.NumberFormat("fr-FR").format(cartTotal)} F
                  </p>
                </div>

                <div className="space-y-2">
                  {[
                    { value: "ESPECES", label: "Espèces", icon: DollarSign },
                    { value: "CARTE", label: "Carte bancaire", icon: CreditCard },
                    { value: "ORANGE_MONEY", label: "Orange Money", icon: Phone },
                    { value: "WAVE", label: "Wave", icon: Phone },
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setPaymentMethod(method.value)}
                      className={`w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-colors ${
                        paymentMethod === method.value
                          ? "border-orange-500 bg-gray-600"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <method.icon className="w-6 h-6 text-gray-600" />
                      <span className="font-medium">{method.label}</span>
                      {paymentMethod === method.value && (
                        <Check className="w-5 h-5 text-orange-500 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Espèces: Amount given */}
                {paymentMethod === "ESPECES" && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Montant donné par le client
                    </label>
                    <input
                      type="number"
                      value={amountGiven}
                      onChange={(e) => setAmountGiven(e.target.value)}
                      placeholder="Montant donné"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg"
                    />
                    {amountGiven && changeAmount >= 0 && (
                      <div className="p-3 bg-green-50 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Monnaie à rendre:</p>
                        <p className="text-2xl font-bold text-green-600">
                          {new Intl.NumberFormat("fr-FR").format(changeAmount)} F
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Orange Money / Wave: Phone number */}
                {(paymentMethod === "ORANGE_MONEY" || paymentMethod === "WAVE") && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Numéro de téléphone
                    </label>
                    <input
                      type="tel"
                      placeholder="77 XXX XX XX"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                )}

                {/* Carte: Terminal message */}
                {paymentMethod === "CARTE" && (
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-gray-600">Le client doit:</p>
                    <ol className="text-sm text-gray-600 mt-2 text-left list-decimal list-inside">
                      <li>Insérer la carte dans le terminal</li>
                      <li>Attendre la validation</li>
                    </ol>
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={processing || (paymentMethod === "ESPECES" && (!amountGiven || changeAmount < 0))}
                  className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:bg-gray-300"
                >
                  {processing ? "Traitement..." : "Confirmer le paiement"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && lastSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#10131c] rounded-2xl shadow-xl w-full max-w-md max-h-[95vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#23263a]">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-white">
                    <Receipt className="inline-block w-5 h-5 mr-2 text-blue-400" />
                    Aperçu du reçu
                  </span>
                </div>
                <button onClick={() => { setShowSuccessModal(false); fetchData(); }} className="p-1 hover:bg-[#23263a] rounded">
                  <X className="w-5 h-5 text-gray-300" />
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-xl shadow p-6 w-full max-w-sm mx-auto">
                  <div className="text-center mb-2">
                    <span className="text-2xl font-bold flex items-center justify-center gap-2">
                      <span role="img" aria-label="logo">🧾</span> GESTICOM
                    </span>
                    <div className="text-xs text-gray-500 leading-tight">Système de Gestion Commerciale<br/>Tél: +221 77 142 81 50<br/>Dakar, Sénégal</div>
                  </div>
                  <hr className="my-2 border-dashed border-gray-300" />
                  <div className="text-xs mb-2">
                    <div className="flex justify-between"><span>N° Reçu:</span><span className="font-mono">{lastSale.reference}</span></div>
                    <div className="flex justify-between"><span>Date:</span><span>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' })} {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></div>
                    <div className="flex justify-between"><span>Caissier:</span><span>{lastSale.user?.nom || 'N/A'}</span></div>
                    <div className="flex justify-between"><span>Mode:</span><span>{getPaymentMethodLabel(lastSale.modePaiement || paymentMethod)}</span></div>
                  </div>
                  <hr className="my-2 border-dashed border-gray-300" />
                  <div className="text-xs mb-2">
                    <span className="font-bold">ARTICLES</span>
                    {lastSale.lignes && lastSale.lignes.map((ligne, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{ligne.produit?.nom || 'Produit'}<br/><span className="text-gray-500">{ligne.quantite} × {new Intl.NumberFormat('fr-FR').format(ligne.prixUnitaire)} FCFA</span></span>
                        <span className="font-semibold">{new Intl.NumberFormat('fr-FR').format(ligne.sousTotal)} F</span>
                      </div>
                    ))}
                  </div>
                  <hr className="my-2 border-dashed border-gray-300" />
                  <div className="flex justify-between items-center text-base font-bold">
                    <span>TOTAL</span>
                    <span className="text-black">{new Intl.NumberFormat('fr-FR').format(lastSale.total)} FCFA</span>
                  </div>
                  <div className="text-center text-xs text-gray-400 mt-4 mb-1">Merci de votre visite !<br/><span className="text-yellow-500">🙏</span> À bientôt</div>
                </div>
                <div className="flex gap-3 mt-6 w-full max-w-sm mx-auto">
                  <button
                    onClick={() => { setShowSuccessModal(false); fetchData(); }}
                    className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-gray-200 hover:bg-[#23263a]"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={handlePrintRecu}
                    disabled={printing}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
