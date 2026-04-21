import { useEffect, useState, useContext } from "react";
import { 
  DollarSign, 
  ShoppingCart, 
  Package,
  TrendingUp,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Eye,
  FolderOpen,
  Clock,
  ArrowRight
} from "lucide-react";
import Layout from "../components/Layout";
import Caisse from "../components/Caisse";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weeklySales, setWeeklySales] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [periodeFilter, setPeriodeFilter] = useState("semaine");

  const getFirstName = (fullName) => {
    if (!fullName) return "";
    return fullName.split(" ")[0];
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get(`/dashboard/stats?periode=${periodeFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(res.data.data);
      setWeeklySales(res.data.data.ventesSemaine || []);
      setCategorySales(res.data.data.ventesParCategorie || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [periodeFilter]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("fr-FR").format(value) + " FCFA";
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

  const statCards = [
    {
      title: `CA (${periodeFilter === 'semaine' ? 'Semaine' : periodeFilter === 'mois' ? 'Mois' : 'Année'})`,
      value: formatCurrency(stats?.caPeriode || 0),
      icon: DollarSign,
      color: "bg-green-500",
      change: null,
      positive: true,
    },
    {
      title: "CA du Jour",
      value: formatCurrency(stats?.caJour || 0),
      icon: DollarSign,
      color: "bg-green-500",
      change: null,
      positive: true,
    },
    {
      title: "CA du Mois",
      value: formatCurrency(stats?.caMois || 0),
      icon: TrendingUp,
      color: "bg-blue-500",
      change: null,
      positive: true,
    },
    {
      title: "Alertes Stock",
      value: stats?.stockFaible?.length || 0,
      icon: AlertTriangle,
      color: "bg-red-500",
      change: null,
      positive: false,
    },
  ];

  // Couleurs pour les catégories
  const categoryColors = ["#FFA726", "#42A5F5", "#66BB6A", "#FFD600", "#AB47BC", "#FF7043"];

  // Préparer les données pour le graphique des ventes par jour
  // Générer la semaine courante (lundi à dimanche)
  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const today = new Date();
  
  // Trouver le lundi de la semaine courante
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  // Générer les dates de la semaine
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  // Associer les ventes à chaque jour
  const salesByDay = weekDates.map((date, idx) => {
    // Format date en YYYY-MM-DD en utilisant le fuseau horaire local
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    const vente = weeklySales.find(sale => {
      // Différents formats possibles de date depuis la DB
      let saleDateStr;
      if (typeof sale.date === 'object' && sale.date !== null) {
        const d = new Date(sale.date);
        saleDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else if (typeof sale.date === 'string') {
        saleDateStr = sale.date.slice(0, 10);
      } else {
        saleDateStr = '';
      }
      return saleDateStr === dateStr;
    });
    
    return {
      day: weekDays[idx],
      fullDate: dateStr,
      ventes: vente ? Number(vente.nbVentes) : 0,
      montant: vente ? Number(vente.total) : 0
    };
  });

  // Fonction pour calculer les ticks arrondis
  const calculateNiceTicks = (maxValue) => {
    if (!maxValue || maxValue === 0) return [0, 1000];
    const magnitude = Math.floor(Math.log10(maxValue));
    const power = Math.pow(10, magnitude);
    const normalized = maxValue / power;
    
    let niceMax;
    if (normalized < 2) niceMax = 2;
    else if (normalized < 5) niceMax = 5;
    else niceMax = 10;
    
    const ticks = [];
    for (let i = 0; i <= niceMax; i++) {
      ticks.push(i * power);
    }
    return ticks;
  };

  const maxMontant = salesByDay.length > 0 
    ? Math.max(...salesByDay.map(d => d.montant)) 
    : 0;
  const niceTicks = calculateNiceTicks(maxMontant);

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
              Bonjour{user?.nom ? `, ${getFirstName(user.nom)}` : ""}
            </h1>
            <p className="text-gray-500 text-sm sm:text-base">Bienvenue à GestiCom</p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600">Période:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPeriodeFilter("semaine")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  periodeFilter === "semaine"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Semaine
              </button>
              <button
                onClick={() => setPeriodeFilter("mois")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  periodeFilter === "mois"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Mois
              </button>
              <button
                onClick={() => setPeriodeFilter("annee")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  periodeFilter === "annee"
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Année
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
          {statCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                  <p className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-2 sm:p-3 rounded-lg`}>
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
              {stat.change && (
                <div className="mt-2 sm:mt-3 flex items-center gap-1">
                  {stat.positive ? (
                    <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  ) : (
                    <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                  )}
                  <span className={`text-xs sm:text-sm ${stat.positive ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-400">vs semaine dernière</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Sales Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Ventes de la semaine</h2>
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByDay} barCategoryGap="20%">
                  <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                  <YAxis 
                    stroke="#6b7280" 
                    fontSize={11}
                    type="number"
                    ticks={niceTicks}
                    tickFormatter={(value) => {
                      if (value >= 1000000000) return (value / 1000000000) + 'Mrd';
                      if (value >= 1000000) return (value / 1000000) + 'M';
                      if (value >= 1000) return (value / 1000) + 'K';
                      return value.toString();
                    }}
                    domain={[0, Math.max(...niceTicks)]}
                    allowDecimals={false}
                    interval={0}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => [formatCurrency(value), 'Montant']}
                  />
                  <Bar 
                    dataKey="montant" 
                    fill="#FFA726" 
                    radius={[6, 6, 0, 0]} 
                    name="Montant"
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Sales Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Ventes par catégorie</h2>
            <div style={{ width: '100%', height: 280 }}>
              {categorySales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySales}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="total"
                      nameKey="categorie"
                      label={({ categorie, percent }) => `${categorie} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                      isAnimationActive={false}
                    >
                      {categorySales.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Caisse Section */}
        <Caisse stats={stats} loading={loading} onRefresh={fetchStats} />

        {/* Stock Alerts */}
        {stats?.stockFaible && stats.stockFaible.length > 0 && (
          <div className="rounded-xl shadow-sm border p-5 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500 dark:text-orange-400" />
              <h2 className="text-lg font-semibold text-orange-600 dark:text-orange-200">
                Alertes Stock
              </h2>
            </div>
            <div className="space-y-2">
              {stats.stockFaible.slice(0, 5).map((produit) => (
                <div
                  key={produit.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-orange-100 dark:bg-orange-900"
                >
                  <span className="font-medium text-orange-800 dark:text-orange-100">{produit.nom}</span>
                  <span className="text-orange-600 dark:text-orange-300 font-semibold">
                    Stock: {produit.stock}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Products & Recent Sales - Side by Side */}
        {((stats?.topProduits && stats.topProduits.length > 0) || (stats?.ventesRecentes && stats.ventesRecentes.length > 0)) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Top Products - Horizontal Bar Chart */}
            {stats?.topProduits && stats.topProduits.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Produits les Plus Vendus
                  </h2>
                </div>

                <div className="space-y-2">
                  {stats.topProduits.slice(0, 5).map((produit, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {produit.nom}
                        </span>
                      </div>
                      <span className="text-gray-600 dark:text-gray-300 font-medium">
                        {produit.quantiteVendue} unités
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Sales */}
            {stats?.ventesRecentes && stats.ventesRecentes.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                      Ventes Récentes
                    </h2>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 border-b">
                        <th className="pb-2">Réf.</th>
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Caissier</th>
                        <th className="pb-2">Mode</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.ventesRecentes.slice(0, 5).map((vente) => (
                        <tr 
                          key={vente.id} 
                          className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => setSelectedSale(vente)}
                        >
                          <td className="py-2 text-orange-600 font-medium">{vente.reference}</td>
                          <td className="py-2 text-gray-600 dark:text-gray-300">{new Date(vente.createdAt).toLocaleDateString('fr-FR')}</td>
                          <td className="py-2 text-gray-600 dark:text-gray-300">{vente.user?.nom || 'N/A'}</td>
                          <td className="py-2 text-gray-600 dark:text-gray-300">{vente.modePaiement}</td>
                          <td className="py-2 text-right font-semibold text-gray-800 dark:text-white">{formatCurrency(vente.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sale Detail Modal */}
        {selectedSale && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Détails de la vente
                  </h2>
                  <button
                    onClick={() => setSelectedSale(null)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Référence:</span>
                  <span className="font-semibold">{selectedSale.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span>{new Date(selectedSale.createdAt).toLocaleString("fr-FR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Caissier:</span>
                  <span>{selectedSale.user?.nom || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Mode paiement:</span>
                  <span>{selectedSale.modePaiement}</span>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Articles</h3>
                  <div className="space-y-2">
                    {selectedSale.lignes?.map((ligne, index) => (
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

                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-orange-600">
                      {formatCurrency(selectedSale.total)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedSale(null)}
                  className="w-full mt-4 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
