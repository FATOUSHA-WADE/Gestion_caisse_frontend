import { useEffect, useState } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  Percent, 
  ShoppingCart,
  Package,
  Download,
  FileText,
  FileSpreadsheet
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Layout from "../components/Layout";
import API from "../api/axios";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar
} from "recharts";

export default function Rapports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    caTotal: 0,
    beneficeTotal: 0,
    margeMoyenne: 0,
    ventesTotales: 0
  });
  const [topProduits, setTopProduits] = useState([]);
  const [evolutionData, setEvolutionData] = useState([]);

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF'
    }).format(value);
  };

  // Export to PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text("Rapports - GestiCom", 14, 22);
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
    
    // Stats
    doc.setFontSize(14);
    doc.text("Statistiques", 14, 45);
    
    autoTable(doc, {
      startY: 50,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['CA Total (Année)', formatCurrency(stats.caTotal)],
        ['Bénéfice Total', formatCurrency(stats.beneficeTotal)],
        ['Marge moyenne', `${stats.margeMoyenne}%`],
        ['Ventes totales', stats.ventesTotales.toString()]
      ],
      theme: 'striped',
      headStyles: { fillColor: [255, 159, 28] }
    });
    
    // Top Products
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("Top Produits Vendus", 14, finalY);
    
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Rang', 'Produit', 'Ventes (XOF)']],
      body: topProduits.map((produit, index) => [
        (index + 1).toString(),
        produit.nom,
        formatCurrency(produit.total)
      ]),
      theme: 'striped',
      headStyles: { fillColor: [255, 159, 28] }
    });
    
    doc.save('rapports-gesticom.pdf');
  };

  // Export to Excel
  const exportExcel = () => {
    // Prepare data
    const statsData = [
      { Indicateur: 'CA Total (Année)', Valeur: formatCurrency(stats.caTotal) },
      { Indicateur: 'Bénéfice Total', Valeur: formatCurrency(stats.beneficeTotal) },
      { Indicateur: 'Marge moyenne', Valeur: `${stats.margeMoyenne}%` },
      { Indicateur: 'Ventes totales', Valeur: stats.ventesTotales.toString() }
    ];
    
    const produitsData = topProduits.map((produit, index) => ({
      Rang: index + 1,
      Produit: produit.nom,
      'Ventes (XOF)': formatCurrency(produit.total)
    }));
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Stats sheet
    const wsStats = XLSX.utils.json_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, wsStats, 'Statistiques');
    
    // Products sheet
    const wsProduits = XLSX.utils.json_to_sheet(produitsData);
    XLSX.utils.book_append_sheet(wb, wsProduits, 'Top Produits');
    
    // Download
    XLSX.writeFile(wb, 'rapports-gesticom.xlsx');
  };

  useEffect(() => {
    fetchRapports();
  }, []);

  const fetchRapports = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch all sales
      const ventesRes = await API.get("/ventes?limit=1000", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const ventes = ventesRes.data.data || [];
      const validees = ventes.filter(v => v.statut === "validee");
      
      // Calculate stats
      const caTotal = validees.reduce((sum, v) => sum + Number(v.total), 0);
      
      // Get products for benefice calculation
      await API.get("/produits?limit=1000", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Calculate benefice (simplified - assuming 30% marge)
      const beneficeTotal = caTotal * 0.3;
      const margeMoyenne = 30;
      
      setStats({
        caTotal,
        beneficeTotal,
        margeMoyenne,
        ventesTotales: validees.length
      });

      // Get top products
      const productSales = {};
      validees.forEach(vente => {
        if (vente.lignes) {
          vente.lignes.forEach(ligne => {
            const nom = ligne.produit?.nom || "Inconnu";
            if (!productSales[nom]) {
              productSales[nom] = 0;
            }
            productSales[nom] += Number(ligne.sousTotal);
          });
        }
      });
      
      const topProduitsList = Object.entries(productSales)
        .map(([nom, total]) => ({ nom, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
      
      setTopProduits(topProduitsList);

      // Evolution data (last 30 days)
      const evolutionMap = {};
      const today = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        evolutionMap[dateStr] = { date: dateStr, ca: 0, benefice: 0 };
      }
      
      validees.forEach(vente => {
        const dateStr = new Date(vente.createdAt).toISOString().split('T')[0];
        if (evolutionMap[dateStr]) {
          evolutionMap[dateStr].ca += Number(vente.total);
          evolutionMap[dateStr].benefice += Number(vente.total) * 0.3;
        }
      });
      
      const evolutionList = Object.values(evolutionMap).map(item => ({
        date: new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        ca: item.ca,
        benefice: item.benefice
      }));
      
      setEvolutionData(evolutionList);
      
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Rapports</h1>
            <p className="text-gray-500">Statistiques et analyses</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={exportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">CA Total (Année)</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(stats.caTotal)}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Bénéfice Total</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(stats.beneficeTotal)}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Marge moyenne</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.margeMoyenne}%</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <Percent className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ventes totales</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{stats.ventesTotales}</p>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Evolution Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Évolution du CA & Bénéfices</h2>
          <div style={{ width: '100%', height: 320 }}>
            {evolutionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolutionData}>
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="ca" name="CA" stroke="#FFA726" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="benefice" name="Bénéfice" stroke="#42A5F5" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Aucune donnée disponible
              </div>
            )}
          </div>
        </div>

        {/* Top Products - Horizontal Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-800">
              Top Produits Vendus
            </h2>
          </div>
          
          {topProduits.length > 0 ? (
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={topProduits.slice(0, 8)} 
                  layout="vertical"
                  barCategoryGap="20%"
                >
                  <XAxis 
                    type="number" 
                    stroke="#6b7280" 
                    fontSize={11}
                    tickFormatter={(value) => value.toLocaleString('fr-FR')}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="nom" 
                    stroke="#6b7280" 
                    fontSize={11}
                    width={120}
                    tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value) => [formatCurrency(value), 'Ventes']}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="#f97316" 
                    radius={[0, 4, 4, 0]} 
                    name="Ventes"
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Aucun produit vendu
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
