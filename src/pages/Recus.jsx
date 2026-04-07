import { useEffect, useState } from "react";
import { 
  Search, 
  Receipt,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Layout from "../components/Layout";
import API from "../api/axios";

export default function Recus() {
  const [recus, setRecus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecu, setSelectedRecu] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 7,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchRecus();
  }, [pagination.page]);

  const fetchRecus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/ventes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setRecus(res.data.data || []);
      setPagination(prev => ({
        ...prev,
        total: res.data.data?.length || 0,
        totalPages: Math.ceil((res.data.data?.length || 0) / prev.limit)
      }));
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const viewRecu = async (venteId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get(`/recus/${venteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedRecu(res.data.data);
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la récupération du reçu");
    }
  };

  const downloadRecu = async (venteId) => {
    try {
      const token = localStorage.getItem("token");
      // First generate the receipt if it doesn't exist
      await API.get(`/recus/${venteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Then download the PDF
      const response = await API.get(`/recus/${venteId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recu-${venteId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur download:", error);
      alert("Erreur lors du téléchargement du reçu");
    }
  };

  const filteredRecus = recus.filter((recu) =>
    recu.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const startIndex = (pagination.page - 1) * pagination.limit;
  const paginatedRecus = filteredRecus.slice(startIndex, startIndex + pagination.limit);

  const getPaymentMethodLabel = (method) => {
    const labels = {
      ESPECES: "Espèces",
      CARTE: "Carte bancaire",
      ORANGE_MONEY: "Orange Money",
      WAVE: "Wave",
    };
    return labels[method] || method;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("fr-FR").format(value) + " F";
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reçus</h1>
          <p className="text-gray-500">Historique des reçus de vente</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un reçu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Receipts List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredRecus.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun reçu trouvé</p>
            <p className="text-sm text-gray-400 mt-1">
              Les reçus apparaissent ici après chaque vente
            </p>
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
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mode de paiement
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
                  {paginatedRecus.map((recu) => (
                    <tr key={recu.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Receipt className="w-5 h-5 text-orange-600" />
                          </div>
                          <span className="font-medium text-gray-800">{recu.reference}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(recu.createdAt).toLocaleString("fr-FR")}
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">
                        {formatCurrency(recu.total)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {getPaymentMethodLabel(recu.modePaiement)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          recu.statut === "validee" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {recu.statut === "validee" ? "Validée" : "Annulée"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => viewRecu(recu.id)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => downloadRecu(recu.id)}
                            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Télécharger le reçu"
                          >
                            <Download className="w-4 h-4" />
                          </button>
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
          </>
        )}

        {/* Receipt Detail Modal */}
        {selectedRecu && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">Reçu de vente</h2>
                  <button
                    onClick={() => setSelectedRecu(null)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Receipt Header */}
                <div className="text-center mb-6 pb-6 border-b border-gray-100">
                  <h1 className="text-2xl font-bold text-orange-600">GESTICOM</h1>
                  <p className="text-sm text-gray-500">Reçu de vente</p>
                  <p className="text-lg font-semibold mt-2">{selectedRecu.reference}</p>
                </div>

                {/* Receipt Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-600">
                    <span>{new Date(selectedRecu.createdAt).toLocaleString("fr-FR")}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-600">
                    <span>Caissier: {selectedRecu.user?.nom || "N/A"}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-600">
                    <span>Paiement: {getPaymentMethodLabel(selectedRecu.modePaiement)}</span>
                  </div>
                </div>

                {/* Items */}
                {selectedRecu.lignes && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-gray-800 mb-3">Articles</h3>
                    <div className="space-y-2">
                      {selectedRecu.lignes.map((ligne, index) => (
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
                      {formatCurrency(selectedRecu.total)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setSelectedRecu(null)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Fermer
                  </button>
                  <button 
                    onClick={() => downloadRecu(selectedRecu.id)}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger PDF
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
