import { useState } from "react";
import { 
  Wallet, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Users, 
  ChevronDown, 
  ChevronUp,
  Clock
} from "lucide-react";

const formatCurrency = (value) => {
  return new Intl.NumberFormat("fr-FR").format(value || 0) + " FCA";
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.split(" ");
  return parts.map(p => p[0]).join("").toUpperCase().slice(0, 2);
};

export default function Caisse({ stats, loading, onRefresh }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const data = stats || {};
  
  const soldeActuel = data.caJour || 0;
  const montantOuverture = data.montantOuverture || 0;
  const montantFermeture = data.montantFermeture || 0;
  
  const sellers = data.listeVendeurs || [];
  const nombreVendeurs = data.nombreVendeurs || data.totalUsers || 0;
  const isCaisseOuverte = data.statutCaisse === 'ouverte';

  const sellerStats = sellers.length > 0 ? sellers : [
    { 
      id: 1, 
      nom: "Propriétaire Boutique 1", 
      montantOuverture: 500000, 
      montantFermeture: 750000,
      statut: "actif",
      heureFermeture: "18:30"
    },
    { 
      id: 2, 
      nom: "Caissier Boutique 2", 
      montantOuverture: 300000, 
      montantFermeture: 450000,
      statut: "inactif",
      heureFermeture: "20:00"
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white">Caisse</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              isCaisseOuverte 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {isCaisseOuverte ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Ouverte</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Fermée</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 space-y-5">
        {/* Solde Actuel - Grand Format */}
        <div className="relative bg-gray-50 rounded-xl p-5 border border-gray-100 overflow-hidden">
          <div className="relative z-10">
            <p className="text-sm text-gray-500 mb-1">Solde actuel</p>
            <p className="text-3xl font-bold text-gray-800">{formatCurrency(soldeActuel)}</p>
          </div>
          <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-orange-100/50 to-transparent" />
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-orange-200/30 rounded-full" />
        </div>

        {/* Cartes Statistiques - 3 blocs alignés */}
        <div className="grid grid-cols-3 gap-4">
          {/* Ouverture */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Ouverture</span>
            </div>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(montantOuverture)}</p>
          </div>

          {/* Fermeture */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Fermeture</span>
            </div>
            <p className="text-lg font-bold text-gray-800">{formatCurrency(montantFermeture)}</p>
          </div>

          {/* Vendeurs */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">Vendeurs</span>
            </div>
            <p className="text-lg font-bold text-gray-800">
              {sellerStats.filter(s => s.statut === 'actif').length} / {sellerStats.length}
            </p>
          </div>
        </div>

        {/* Accordion - Détail par Vendeur */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            <span className="font-semibold text-gray-700 text-sm">DÉTAIL PAR VENDEUR</span>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>

          {isOpen && (
            <div className="divide-y divide-gray-100">
              {sellerStats.map((seller) => (
                <div key={seller.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                        seller.statut === 'actif' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {getInitials(seller.nom)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{seller.nom}</p>
                        <p className={`text-xs ${seller.statut === 'actif' ? 'text-green-600' : 'text-gray-400'}`}>
                          {seller.statut === 'actif' ? 'Actif' : 'Inactif'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">
                        {formatCurrency(seller.montantFermeture || seller.montantOuverture)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm pl-13 ml-13">
                    <div className="flex gap-6">
                      <div>
                        <span className="text-gray-400 text-xs">Ouverture: </span>
                        <span className="text-gray-600 font-medium">{formatCurrency(seller.montantOuverture)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs">Fermeture: </span>
                        <span className="text-gray-600 font-medium">{formatCurrency(seller.montantFermeture)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">Fermée à {seller.heureFermeture || '18:00'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Statut Horaire */}
        <div className="text-center py-2 border-t border-gray-100">
          <div className="inline-flex items-center gap-2 text-gray-500 text-sm">
            <Lock className="w-4 h-4" />
            <span>Fermée à {data.heureFermetureCaisse || '23:59'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
