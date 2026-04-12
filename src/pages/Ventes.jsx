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
import { API_BASE_URL, STATIC_BASE_URL } from "../utils/apiConfig";

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

  // Sauvegarder le panier dans localStorage
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart]);

  // Restaurer le panier depuis localStorage au chargement
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (Array.isArray(parsedCart) && parsedCart.length > 0) {
          setCart(parsedCart);
        }
      } catch {
        localStorage.removeItem("cart");
      }
    }
  }, []);

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
      
      // First, ensure the PDF is generated
      await API.get(
        `/recus/${lastSale.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Then download it directly
      const response = await API.get(
        `/recus/${lastSale.id}/pdf`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recu-${lastSale.reference || lastSale.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
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
    localStorage.removeItem("cart");
  };

  const cartTotal = cart.reduce(
    (total, item) => total + item.prixVente * item.quantite,
    0
  );

  const changeAmount = amountGiven ? Number(amountGiven) - cartTotal : -1;

  const isInCart = (productId) => cart.some(item => item.id === productId);
  const getCartItem = (productId) => cart.find(item => item.id === productId);

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
        localStorage.removeItem("cart");
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
    return `${STATIC_BASE_URL}/${imagePath}`;
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
                {filteredProduits.map((produit) => {
                  const inCart = isInCart(produit.id);
                  const cartItem = getCartItem(produit.id);
                  const isActive = produit.statut === "actif" || !produit.statut;
                  return (
                    <div
                      key={produit.id}
                      className={`bg-white rounded-xl shadow-sm border p-3 hover:shadow-md transition-all relative ${
                        inCart ? "border-green-500 ring-1 ring-green-500" : "border-gray-100 hover:border-orange-300"
                      } ${!isActive ? 'opacity-50' : ''}`}
                    >
                      {/* Cart Badge */}
                      {inCart && (
                        <div className="absolute top-2 right-2 z-10 bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                          <ShoppingCart className="w-3 h-3" />
                        </div>
                      )}
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
                      <p className="text-xs text-gray-500 mb-2">Stock: {produit.stock}</p>
                      <button
                        onClick={() => isActive && addToCart(produit)}
                        disabled={!isActive}
                        className={`w-full py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-1 ${
                          inCart 
                            ? "bg-green-500 text-white" 
                            : isActive 
                              ? "bg-orange-500 text-white hover:bg-orange-600" 
                              : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {inCart ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>{cartItem?.quantite || 1}</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Ajouter
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProduits.map((produit) => {
                  const inCart = isInCart(produit.id);
                  const cartItem = getCartItem(produit.id);
                  const isActive = produit.statut === "actif" || !produit.statut;
                  return (
                    <div
                      key={produit.id}
                      className={`bg-white rounded-xl shadow-sm border p-3 hover:shadow-md transition-all flex items-center gap-3 ${
                        inCart ? "border-green-500 ring-1 ring-green-500" : "border-gray-100 hover:border-orange-300"
                      } ${!isActive ? 'opacity-50' : ''}`}
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
                        <p className="text-orange-600 font-bold mt-1">
                          {new Intl.NumberFormat("fr-FR").format(produit.prixVente)} F
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-gray-500">Stock: {produit.stock}</p>
                        <button
                          onClick={() => isActive && addToCart(produit)}
                          disabled={!isActive}
                          className={`mt-2 w-10 h-10 rounded-lg font-medium text-lg transition-all flex items-center justify-center ${
                            inCart 
                              ? "bg-green-500 text-white" 
                              : isActive 
                                ? "bg-orange-500 text-white hover:bg-orange-600" 
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {inCart ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span className="ml-1 text-sm">{cartItem?.quantite || 1}</span>
                            </>
                          ) : (
                            <Plus className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
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
                    Reçu de vente
                  </span>
                </div>
                <button onClick={() => { setShowSuccessModal(false); fetchData(); }} className="p-1 hover:bg-[#23263a] rounded">
                  <X className="w-5 h-5 text-gray-300" />
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white rounded-none shadow-lg w-full max-w-sm mx-auto" style={{ fontFamily: 'Courier New, monospace' }}>
                  {/* Header avec logo */}
                  <div className="text-center pb-3 border-b-2 border-dashed border-gray-800">
                    <div className="flex justify-center mb-2">
                      <div className="bg-orange-500 w-12 h-12 rounded-lg flex items-center justify-center">
                        <ShoppingCart className="text-white w-7 h-7" />
                      </div>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-wide">GESTICOM</h1>
                    <p className="text-xs text-gray-600 mt-1">Système de Gestion Commerciale</p>
                    <p className="text-xs text-gray-500">Tél: +221 77 142 81 50</p>
                    <p className="text-xs text-gray-500">Dakar, Sénégal</p>
                  </div>
                  
                  {/* Info transaction */}
                  <div className="py-2 border-b border-dashed border-gray-300 text-xs">
                    <div className="flex justify-between"><span className="text-gray-600">N° Reçu:</span><span className="font-bold">{lastSale.reference}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Date:</span><span>{new Date().toLocaleDateString('fr-FR')}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Heure:</span><span>{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Caissier:</span><span>{lastSale.user?.nom || 'N/A'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Mode:</span><span>{getPaymentMethodLabel(lastSale.modePaiement || paymentMethod)}</span></div>
                  </div>
                  
                  {/* Articles */}
                  <div className="py-2 border-b-2 border-dashed border-gray-800 text-xs">
                    <div className="font-bold text-center mb-2">*** ARTICLES ***</div>
                    {lastSale.lignes && lastSale.lignes.map((ligne, idx) => (
                      <div key={idx} className="mb-1">
                        <div className="flex justify-between font-medium">
                          <span className="truncate max-w-[180px]">{ligne.produit?.nom || 'Produit'}</span>
                          <span className="font-bold">{new Intl.NumberFormat('fr-FR').format(ligne.sousTotal)} F</span>
                        </div>
                        <div className="text-gray-500 text-xs pl-2">
                          {ligne.quantite} x {new Intl.NumberFormat('fr-FR').format(ligne.prixUnitaire)} F
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Total */}
                  <div className="py-3 border-b-2 border-dashed border-gray-800">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">TOTAL</span>
                      <span className="text-xl font-bold text-gray-900">{new Intl.NumberFormat('fr-FR').format(lastSale.total)} F</span>
                    </div>
                  </div>
                  
                  {/* Montant donné et monnaie (si espèces) */}
                  {paymentMethod === "ESPECES" && amountGiven && (
                    <div className="py-2 border-b border-dashed border-gray-300 text-xs">
                      <div className="flex justify-between"><span className="text-gray-600">Montant donné:</span><span>{new Intl.NumberFormat('fr-FR').format(Number(amountGiven))} F</span></div>
                      {changeAmount >= 0 && (
                        <div className="flex justify-between font-bold"><span className="text-gray-900">Monnaie:</span><span>{new Intl.NumberFormat('fr-FR').format(changeAmount)} F</span></div>
                      )}
                    </div>
                  )}
                  
                  {/* Footer */}
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-700">Merci de votre visite !</p>
                    <p className="text-lg mt-1">🙏 À bientôt</p>
                  </div>
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
