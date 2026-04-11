import { useEffect, useState, useCallback } from "react";
import { 
  Search, 
  Receipt,
  Eye,
  Printer,
  X,
  DollarSign,
  ShoppingCart,
  CheckCircle,
  Filter,
  AlertTriangle
} from "lucide-react";
import Layout from "../components/Layout";
import API from "../api/axios";

export default function HistoriqueVentes() {
  const [ventes, setVentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedVente, setSelectedVente] = useState(null);
  const [cancelModalVente, setCancelModalVente] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [printing, setPrinting] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 7,
    total: 0,
    totalPages: 0
  });
  const [stats, setStats] = useState({
    totalVentes: 0,
    ventesValidees: 0,
    ventesAnnulees: 0,
    caTotal: 0
  });

  // Pagination logic
  const startIndex = (pagination.page - 1) * pagination.limit;
  const endIndex = startIndex + pagination.limit;
  const paginatedVentes = ventes.slice(startIndex, endIndex);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/ventes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allVentes = res.data.data || [];
      const validees = allVentes.filter(v => v.statut === "validee");
      const annulees = allVentes.filter(v => v.statut === "annulee");
      setStats({
        totalVentes: allVentes.length,
        ventesValidees: validees.length,
        ventesAnnulees: annulees.length,
        caTotal: validees.reduce((sum, v) => sum + Number(v.total), 0)
      });
    } catch {
      // Optionally log error
    }
  }, []);

  const fetchVentes = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get(`/ventes?page=${pagination.page}&limit=${pagination.limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Use backend pagination properly
      const data = res.data.data || [];
      const meta = res.data.meta || { total: 0, page: 1, limit: 10, totalPages: 1 };
      
      let filteredVentes = data;
      
      // Filter by date on frontend (since backend doesn't support date filters in getAll)
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        filteredVentes = filteredVentes.filter(v => new Date(v.createdAt) >= fromDate);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filteredVentes = filteredVentes.filter(v => new Date(v.createdAt) <= toDate);
      }
      
      if (statusFilter) {
        filteredVentes = filteredVentes.filter(v => v.statut === statusFilter);
      }
      
      setVentes(filteredVentes);
      setPagination(prev => ({
        ...prev,
        total: meta.total,
        totalPages: meta.totalPages
      }));
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, dateFrom, dateTo, statusFilter]);

  useEffect(() => {
    fetchVentes();
    fetchStats();
  }, [fetchVentes, fetchStats]);

  async function handleAnnulerVente(id) {
    setCancelling(true);
    try {
      const token = localStorage.getItem("token");
      await API.post(`/ventes/${id}/annuler`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCancelModalVente(null);
      fetchVentes();
      fetchStats();
    } catch (error) {
      console.error("Erreur annulation:", error);
      alert(error.response?.data?.message || "Erreur lors de l'annulation !");
    } finally {
      setCancelling(false);
    }
  }

  const getPaymentMethodLabel = (method) => {
    const labels = {
      ESPECES: "Espèces",
      CARTE: "Carte",
      ORANGE_MONEY: "Orange Money",
      WAVE: "Wave",
    };
    return labels[method] || method;
  };

  const handlePrintRecu = async (vente) => {
    try {
      setPrinting(vente.id);
      const token = localStorage.getItem("token");
      
      // First, ensure the PDF is generated
      await API.get(
        `/recus/${vente.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Then download it directly
      const response = await API.get(
        `/recus/${vente.id}/pdf`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recu-${vente.reference || vente.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Erreur impression:", err);
      alert("Erreur lors de l'impression du reçu");
    } finally {
      setPrinting(null);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("fr-FR").format(value) + " F";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("fr-FR");
  };

  const getStatusBadge = (statut) => {
    const badges = {
      validee: "bg-green-100 text-green-700",
      annulee: "bg-red-100 text-red-700"
    };
    return badges[statut] || badges.validee;
  };

  const getStatusLabel = (statut) => {
    return statut === "validee" ? "Validée" : "Annulée";
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Historique des Ventes</h1>
          <p className="text-gray-500">Liste de toutes les ventes effectuées</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Ventes</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalVentes}</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ventes Validées</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.ventesValidees}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ventes Annulées</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.ventesAnnulees}</p>
              </div>
              <div className="bg-red-500 p-3 rounded-lg">
                <X className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">CA Total</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{formatCurrency(stats.caTotal)}</p>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher une vente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Date from */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">Du:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              {/* Date to */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 whitespace-nowrap">Au:</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              {/* Status filter */}
              <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Tous les statuts</option>
              <option value="validee">Validée</option>
              <option value="annulee">Annulée</option>
            </select>
          </div>
        </div>

        {/* Sales List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : paginatedVentes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune vente trouvée</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Caissier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Articles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mode paiement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedVentes.map((vente) => (
                    <tr key={vente.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Receipt className="w-5 h-5 text-orange-600" />
                          </div>
                          <span className="font-medium text-gray-800">{vente.reference}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {formatDate(vente.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {vente.user?.nom || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {vente.lignes?.length || 0} article(s)
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {getPaymentMethodLabel(vente.modePaiement)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {formatCurrency(vente.total)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(vente.statut)}`}>
                          {getStatusLabel(vente.statut)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedVente(vente)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrintRecu(vente)}
                            disabled={printing === vente.id}
                            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Imprimer le reçu"
                          >
                            {printing === vente.id ? (
                              <span className="w-4 h-4 block animate-spin">⏳</span>
                            ) : (
                              <Printer className="w-4 h-4" />
                            )}
                          </button>
                          {vente.statut === "validee" && (
                            <button
                              onClick={() => setCancelModalVente(vente)}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Annuler la vente"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.total >= 7 && (
                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Affichage de {startIndex + 1} à {Math.min(startIndex + pagination.limit, pagination.total)} sur {pagination.total}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Sale Detail Modal */}
        {selectedVente && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">Détails de la vente</h2>
                  <button
                    onClick={() => setSelectedVente(null)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Receipt Header */}
                <div className="text-center mb-6 pb-6 border-b border-gray-100">
                  <h1 className="text-2xl font-bold text-orange-600">GESTICOM</h1>
                  <p className="text-sm text-gray-500">Reçu de vente</p>
                  <p className="text-lg font-semibold mt-2">{selectedVente.reference}</p>
                </div>

                {/* Receipt Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-600">
                    <span>{formatDate(selectedVente.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-600">
                    <span>Caissier: {selectedVente.user?.nom || "N/A"}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-600">
                    <span>Paiement: {getPaymentMethodLabel(selectedVente.modePaiement)}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-gray-600">Statut:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedVente.statut)}`}>
                      {getStatusLabel(selectedVente.statut)}
                    </span>
                  </div>
                </div>

                {/* Items */}
                {selectedVente.lignes && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-800 mb-3">Articles</h3>
                    <div className="space-y-2">
                      {selectedVente.lignes.map((ligne, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {ligne.quantite}x {ligne.produit?.nom || "Produit"}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(ligne.sousTotal)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-orange-600">
                      {formatCurrency(selectedVente.total)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setSelectedVente(null)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => handlePrintRecu(selectedVente)}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2"
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

      {/* Cancel Confirmation Modal */}
      {cancelModalVente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Confirmer l'annulation</h2>
              <p className="text-gray-500 mb-4">
                Êtes-vous sûr de vouloir annuler la vente #{cancelModalVente.reference} ?
              </p>
              <p className="text-sm text-gray-400 mb-6">
                Cette action restaurera le stock des produits.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setCancelModalVente(null)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                  disabled={cancelling}
                >
                  Non, annuler
                </button>
                <button
                  onClick={() => handleAnnulerVente(cancelModalVente.id)}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-red-300"
                  disabled={cancelling}
                >
                  {cancelling ? 'Annulation...' : 'Oui, annuler'}
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
