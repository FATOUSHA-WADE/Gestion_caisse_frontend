import { useEffect, useState } from "react";
import { 
  Search, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Package,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  X,
  RotateCw
} from "lucide-react";
import Layout from "../components/Layout";
import API from "../api/axios";
import { useToast } from "../components/ui";

export default function MouvementStock() {
  const toast = useToast();
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 7,
    total: 0,
    totalPages: 0
  });
  const [selectedMouvement, setSelectedMouvement] = useState(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryForm, setEntryForm] = useState({
    produitId: "",
    quantite: "",
    motif: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [produits, setProduits] = useState([]);

  useEffect(() => {
    fetchMouvements();
    fetchProduits();
  }, [pagination.page, typeFilter]);

  const fetchMouvements = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });
      
      if (typeFilter) {
        params.append("type", typeFilter);
      }

      const res = await API.get(`/mouvements-stock?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setMouvements(res.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: res.data.meta?.total || 0,
        totalPages: res.data.meta?.totalPages || 0
      }));
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProduits = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/produits?limit=1000", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProduits(res.data.data.produits || res.data.data || []);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = {};
    if (!entryForm.produitId) {
      errors.produitId = "Veuillez sélectionner un produit";
    }
    if (!entryForm.quantite || entryForm.quantite <= 0) {
      errors.quantite = "Veuillez saisir une quantité valide";
    }
    if (!entryForm.motif || entryForm.motif.trim() === "") {
      errors.motif = "Veuillez saisir le motif";
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    
    try {
      const token = localStorage.getItem("token");
      
      // Find the selected product
      const produit = produits.find(p => p.id === Number(entryForm.produitId));
      if (!produit) {
        toast.error("Veuillez sélectionner un produit");
        return;
      }

      // Create mouvement stock entry
      await API.post("/mouvements-stock", {
        produitId: Number(entryForm.produitId), // Correction: envoyer en number
        type: "entree",
        quantite: Number(entryForm.quantite),
        quantiteAvant: produit.stock,
        quantiteApres: produit.stock + Number(entryForm.quantite),
        motif: entryForm.motif || "Entrée de stock"
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update product stock using the dedicated stock endpoint
      await API.patch(`/produits/${entryForm.produitId}/stock`, {
        stock: produit.stock + Number(entryForm.quantite)
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Show success toast
      toast.success("Entrée de stock créée avec succès");
      setShowEntryModal(false);
      setEntryForm({ produitId: "", quantite: "", motif: "" });
      setFormErrors({});
      fetchMouvements();
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error.response?.data?.message || "Une erreur s'est produite");
    }
  };

  const filteredMouvements = mouvements.filter((mouvement) => {
    if (!searchTerm) return true;
    return (
      mouvement.produit?.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mouvement.motif?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case "entree":
        return <ArrowUp className="w-4 h-4 text-green-600" />;
      case "sortie":
        return <ArrowDown className="w-4 h-4 text-red-600" />;
      default:
        return <ArrowUpDown className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeBadge = (type) => {
    const badges = {
      entree: "bg-green-100 text-green-700",
      sortie: "bg-red-100 text-red-700",
      ajustement: "bg-blue-100 text-blue-700"
    };
    return badges[type] || badges.ajustement;
  };

  const getTypeLabel = (type) => {
    const labels = {
      entree: "Entrée",
      sortie: "Sortie",
      ajustement: "Ajustement"
    };
    return labels[type] || type;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("fr-FR");
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Mouvements de Stock</h1>
            <p className="text-gray-500">Historique des mouvements de stock</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                fetchMouvements();
                fetchProduits();
              }}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              title="Actualiser"
            >
              <RotateCw className="w-5 h-5" />
              Actualiser
            </button>
            <button
              onClick={() => setShowEntryModal(true)}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Entrée Stock
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un mouvement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Tous les types</option>
                <option value="entree">Entrée</option>
                <option value="sortie">Sortie</option>
                <option value="ajustement">Ajustement</option>
              </select>
            </div>
          </div>
        </div>

        {/* Movements List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredMouvements.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <ArrowUpDown className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun mouvement trouvé</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Produit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantité
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock avant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock après
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motif
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMouvements.map((mouvement) => (
                  <tr key={mouvement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {formatDate(mouvement.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Package className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="font-medium text-gray-800">
                          {mouvement.produit?.nom || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(mouvement.type)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(mouvement.type)}`}>
                          {getTypeLabel(mouvement.type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${
                        mouvement.type === "entree" ? "text-green-600" : 
                        mouvement.type === "sortie" ? "text-red-600" : "text-gray-600"
                      }`}>
                        {mouvement.type === "entree" ? "+" : mouvement.type === "sortie" ? "-" : ""}
                        {mouvement.quantite}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {mouvement.quantiteAvant}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {mouvement.quantiteApres}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {mouvement.motif || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedMouvement(mouvement)}
                        className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Voir les détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.total >= 7 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Affichage de {(pagination.page - 1) * pagination.limit + 1} à {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detail Modal */}
        {selectedMouvement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Détails du mouvement
                  </h2>
                  <button
                    onClick={() => setSelectedMouvement(null)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span>{formatDate(selectedMouvement.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Produit:</span>
                  <span className="font-semibold">{selectedMouvement.produit?.nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(selectedMouvement.type)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(selectedMouvement.type)}`}>
                      {getTypeLabel(selectedMouvement.type)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Quantité:</span>
                  <span className="font-semibold">
                    {selectedMouvement.type === "entree" ? "+" : selectedMouvement.type === "sortie" ? "-" : ""}
                    {selectedMouvement.quantite}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Stock avant:</span>
                  <span>{selectedMouvement.quantiteAvant}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Stock après:</span>
                  <span>{selectedMouvement.quantiteApres}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Motif:</span>
                  <span>{selectedMouvement.motif || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Utilisateur:</span>
                  <span>{selectedMouvement.user?.nom || "N/A"}</span>
                </div>

                <button
                  onClick={() => setSelectedMouvement(null)}
                  className="w-full mt-4 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Entry Stock Modal */}
        {showEntryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Nouvelle entrée de stock
                  </h2>
                  <button
                    onClick={() => {
                      setShowEntryModal(false);
                      setFormErrors({});
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleEntrySubmit} noValidate className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produit <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={entryForm.produitId}
                    onChange={(e) => {
                      setEntryForm({ ...entryForm, produitId: e.target.value });
                      setFormErrors({ ...formErrors, produitId: "" });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      formErrors.produitId ? "border-red-500 bg-red-50" : "border-gray-200"
                    }`}
                  >
                    <option value="">Sélectionner un produit</option>
                    {produits.map((produit) => (
                      <option key={produit.id} value={produit.id}>
                        {produit.nom} (Stock: {produit.stock})
                      </option>
                    ))}
                  </select>
                  {formErrors.produitId && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.produitId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={entryForm.quantite}
                    onChange={(e) => {
                      setEntryForm({ ...entryForm, quantite: e.target.value });
                      setFormErrors({ ...formErrors, quantite: "" });
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      formErrors.quantite ? "border-red-500 bg-red-50" : "border-gray-200"
                    }`}
                  />
                  {formErrors.quantite && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.quantite}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motif <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={entryForm.motif}
                    onChange={(e) => {
                      setEntryForm({ ...entryForm, motif: e.target.value });
                      setFormErrors({ ...formErrors, motif: "" });
                    }}
                    placeholder="Ex: Réapprovisionnement, Retour client..."
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      formErrors.motif ? "border-red-500 bg-red-50" : "border-gray-200"
                    }`}
                  />
                  {formErrors.motif && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.motif}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEntryModal(false);
                      setFormErrors({});
                    }}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Enregistrer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
