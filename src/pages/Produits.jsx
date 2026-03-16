import { useEffect, useState, useRef, useContext } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X,
  Package,
  Image as ImageIcon,
  Eye,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Camera,
  Upload,
  XCircle
} from "lucide-react";
import Layout from "../components/Layout";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import { useToast, ConfirmModal } from "../components/ui";

export default function Produits() {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingProduit, setEditingProduit] = useState(null);
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" ou "list"
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  const [formData, setFormData] = useState({
    sku: "",
    nom: "",
    categorieId: "",
    prixVente: "",
    stock: "",
    stockMin: 5,
    image: null,
  });
  
  // Error and success states
  const [errors, setErrors] = useState({});
  
  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [videoReady, setVideoReady] = useState(false);
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [produitToDelete, setProduitToDelete] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Start camera - VERSION AMÉLIORÉE
  const startCamera = async () => {
    try {
      setCameraError(null);
      setCameraLoading(true);
      
      // Stop any existing stream
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      
      // Check if navigator.mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Votre navigateur ne prend pas en charge l'accès à la caméra.");
        setCameraLoading(false);
        return;
      }
      
      // Try different camera configurations
      const cameraConfigs = [
        // Try any available camera first (most compatible)
        { video: true, audio: false },
        // Try back camera
        { video: { facingMode: 'environment' }, audio: false },
        // Try front camera
        { video: { facingMode: 'user' }, audio: false },
        // Try with lower resolution
        { video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false }
      ];
      
      let stream = null;
      let lastError = null;
      
      for (const config of cameraConfigs) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(config);
          break; // Success!
        } catch (err) {
          lastError = err;
          // Continue to next config
        }
      }
      
      if (!stream) {
        // All configs failed - permission was denied
        // This usually means the user previously denied permission
        // The browser will keep denying until manually reset
        
        setCameraError(
          "🚫 CAMÉRA BLOQUÉE!\n\n" +
          "Le navigateur a refusé l'accès à la caméra.\n\n" +
          "Pour résoudre:\n" +
          "1. Ouvrez: chrome://settings/content/camera\n" +
          "2. Cherchez votre site dans \"Bloqués\"\n" +
          "3. Cliquez sur les 3 points → Supprimer\n" +
          "4. Rechargez cette page\n\n" +
          "Sinon: Paramètres → Confidentialité → Caméra → Supprimer le site\n\n" +
          "Erreur: " + (lastError?.message || "Permission refusée")
        );
        
        setCameraLoading(false);
        return;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to load
        await new Promise((resolve) => {
          const video = videoRef.current;
          if (video.readyState >= 2) {
            resolve();
          } else {
            video.onloadedmetadata = () => resolve();
          }
          setTimeout(resolve, 2000);
        });
        
        setVideoReady(true);
        
        setShowCamera(true);
      }
    } catch (error) {
      console.error("Erreur caméra:", error);
      setCameraError("Erreur caméra: " + error.message);
    } finally {
      setCameraLoading(false);
    }
  };

  // Capture photo - FIXED VERSION
  const capturePhoto = async () => {
    console.log("=== CAPTURE CLICKED ===");
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    console.log("Video element:", video);
    console.log("Canvas element:", canvas);
    
    if (!video) {
      console.error("No video element");
      return;
    }
    
    if (!canvas) {
      console.error("No canvas element");
      return;
    }
    
    // Check if video is ready
    if (video.readyState !== 4) {
      console.error("Video not ready:", video.readyState);
      // Try waiting a bit
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Get actual dimensions
    const width = video.videoWidth || video.clientWidth || 640;
    const height = video.videoHeight || video.clientHeight || 480;
    
    console.log("Capture dimensions:", width, "x", height);
    
    if (width === 0 || height === 0) {
      console.error("Invalid dimensions");
      setCameraError("Vidéo non prête. Réessayez dans un instant.");
      return;
    }
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error("No canvas context");
      return;
    }
    
    // Draw the image
    ctx.drawImage(video, 0, 0, width, height);
    
    // Get image data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    console.log("Data URL length:", dataUrl ? dataUrl.length : 0);
    
    if (!dataUrl) {
      setCameraError("Erreur lors de la capture");
      return;
    }
    
    // Convert to blob and file
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `produit-${Date.now()}.jpg`, { 
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
      console.log("File created:", file.name, file.size);
      
      // Update form
      setFormData(prev => ({ ...prev, image: file }));
      setImagePreview(dataUrl);
      
      // Stop camera
      if (video.srcObject) {
        const tracks = video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        video.srcObject = null;
      }
      setShowCamera(false);
      
      console.log("=== CAPTURE SUCCESS ===");
    } catch (err) {
      console.error("Capture error:", err);
      setCameraError("Erreur: " + err.message);
    }
  };
  
  // End of camera functions

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
    setVideoReady(false);
  };

  // Handle gallery selection
  const handleGallerySelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setFormData({ ...formData, image: file });
    }
  };

  // Clear image
  const clearImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    fetchProduits();
    fetchCategories();
  }, [pagination.page, selectedCategory]);

  const fetchProduits = async () => {
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
      });
      
      if (selectedCategory) {
        params.append("categorieId", selectedCategory);
      }

      const res = await API.get(`/produits?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setProduits(res.data.data.produits || res.data.data || []);
      if (res.data.data.meta) {
        setPagination(prev => ({
          ...prev,
          total: res.data.data.meta.total || 0,
          totalPages: res.data.data.meta.totalPages || 0
        }));
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/categories", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data.data || []);
    } catch (error) {
      console.error("Erreur:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.sku.trim()) {
      newErrors.sku = "Le SKU est requis";
    }
    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom du produit est requis";
    }
    if (!formData.categorieId) {
      newErrors.categorieId = "La catégorie est requise";
    }
    if (!formData.prixVente || formData.prixVente <= 0) {
      newErrors.prixVente = "Le prix de vente est requis";
    }
    if (formData.stock === "" || formData.stock < 0) {
      newErrors.stock = "Le stock est requis";
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();
      
      Object.keys(formData).forEach((key) => {
        if (key === "image" && formData[key]) {
          formDataToSend.append(key, formData[key]);
        } else if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      if (editingProduit) {
        await API.put(`/produits/${editingProduit.id}`, formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await API.post("/produits", formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      fetchProduits();
      closeModal();
      
      // Show success toast
      const successMsg = editingProduit ? "Produit modifié avec succès" : "Produit créé avec succès";
      toast.success(successMsg);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error.response?.data?.message || "Une erreur s'est produite");
    }
  };

  const handleDelete = async (id) => {
    setProduitToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!produitToDelete) return;
    
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/produits/${produitToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProduits();
      toast.success("Produit supprimé avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error.response?.data?.message || "Une erreur s'est produite");
    } finally {
      setShowDeleteModal(false);
      setProduitToDelete(null);
    }
  };

  const openEditModal = (produit) => {
    setEditingProduit(produit);
    setFormData({
      sku: produit.sku,
      nom: produit.nom,
      categorieId: produit.categorieId,
      prixVente: produit.prixVente,
      stock: produit.stock,
      stockMin: produit.stockMin,
      image: null,
    });
    setShowModal(true);
    setShowDetailModal(false);
  };

  const openDetailModal = (produit) => {
    setSelectedProduit(produit);
    setShowDetailModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduit(null);
    setFormData({
      sku: "",
      nom: "",
      categorieId: "",
      prixVente: "",
      stock: "",
      stockMin: 5,
      image: null,
    });
    setErrors({});
    // Reset camera state
    stopCamera();
    setImagePreview(null);
    setCameraError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const filteredProduits = produits.filter((produit) =>
    produit.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produit.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `http://localhost:3000/${imagePath}`;
  };

  const isLowStock = (produit) => {
    return produit.stock <= produit.stockMin;
  };

  const getCategoryName = (categorieId) => {
    const category = categories.find(c => c.id === categorieId);
    return category?.nom || "Non catégorisé";
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Produits</h1>
            <p className="text-gray-500">Gérez votre inventaire</p>
          </div>
          {user?.role !== 'caissier' && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nouveau Produit
            </button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Toutes les catégories</option>
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
          </div>
        </div>

        {/* Affichage produits selon le mode */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredProduits.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun produit trouvé</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredProduits.map((produit) => (
              <div key={produit.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col hover:shadow-md transition-all">
                <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                  {produit.image ? (
                    <img
                      src={getImageUrl(produit.image)}
                      alt={produit.nom}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-10 h-10 text-gray-300" />
                  )}
                </div>
                <div className="font-semibold text-gray-800 truncate">{produit.nom}</div>
                <div className="text-xs text-gray-500 mb-1">SKU: {produit.sku}</div>
                <div className="text-xs text-gray-500 mb-1">Catégorie: {getCategoryName(produit.categorieId)}</div>
                <div className="text-sm font-bold text-orange-600 mb-1">{new Intl.NumberFormat("fr-FR").format(produit.prixVente)} F</div>
                <div className="text-xs text-gray-600 mb-2">Stock: <span className={isLowStock(produit) ? "text-orange-600 font-semibold" : ""}>{produit.stock}</span></div>
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => openDetailModal(produit)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Voir les détails"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {user?.role !== 'caissier' && (
                    <>
                      <button
                        onClick={() => openEditModal(produit)}
                        className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(produit.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom du produit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProduits.map((produit) => (
                    <tr key={produit.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                          {produit.image ? (
                            <img
                              src={getImageUrl(produit.image)}
                              alt={produit.nom}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'/%3E%3C/svg%3E";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-gray-300" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{produit.nom}</span>
                          {isLowStock(produit) && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full">
                              Stock faible
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {produit.sku}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {getCategoryName(produit.categorieId)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {new Intl.NumberFormat("fr-FR").format(produit.prixVente)} F
                      </td>
                      <td className="px-4 py-3">
                        <span className={isLowStock(produit) ? "text-orange-600 font-semibold" : "text-gray-600"}>
                          {produit.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDetailModal(produit)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(produit)}
                            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(produit.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Affichage de {(pagination.page - 1) * pagination.limit + 1} à {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total}
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

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">
                  {editingProduit ? "Modifier le produit" : "Nouveau produit"}
                </h2>
                <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} noValidate className="p-4 space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.sku ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {errors.sku && <p className="text-red-500 text-xs mt-1">{errors.sku}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catégorie
                    </label>
                    <select
                      value={formData.categorieId}
                      onChange={(e) => setFormData({ ...formData, categorieId: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.categorieId ? 'border-red-500' : 'border-gray-200'}`}
                    >
                      <option value="">Sélectionner</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nom}
                        </option>
                      ))}
                    </select>
                    {errors.categorieId && <p className="text-red-500 text-xs mt-1">{errors.categorieId}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du produit
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.nom ? 'border-red-500' : 'border-gray-200'}`}
                  />
                  {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix de vente (FCFA)
                    </label>
                    <input
                      type="number"
                      value={formData.prixVente}
                      onChange={(e) => setFormData({ ...formData, prixVente: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.prixVente ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {errors.prixVente && <p className="text-red-500 text-xs mt-1">{errors.prixVente}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock
                    </label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.stock ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {errors.stock && <p className="text-red-500 text-xs mt-1">{errors.stock}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock minimum
                  </label>
                  <input
                    type="number"
                    value={formData.stockMin}
                    onChange={(e) => setFormData({ ...formData, stockMin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    📷 Photo du produit
                  </label>
                  
                  {/* Camera Error Message */}
                  {cameraError && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                      {cameraError}
                    </div>
                  )}
                  
                  {/* Image Preview or Camera View */}
                  {showCamera ? (
                    <div className="relative bg-black rounded-lg overflow-hidden mb-3">
                      {cameraLoading ? (
                        <div className="w-full h-64 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                        </div>
                      ) : (
                        <>
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted
                            className="w-full h-64 object-cover pointer-events-none"
                            onPlay={() => console.log("Video playing")}
                            onLoadedMetadata={() => console.log("Video metadata loaded")}
                            onError={(e) => {
                              console.error("Video error:", e);
                              setCameraError("Erreur lors du chargement de la vidéo.");
                            }}
                          />
                          <canvas ref={canvasRef} className="hidden" />
                          {/* Camera guide overlay */}
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-48 h-48 border-2 border-white/50 rounded-lg"></div>
                          </div>
                          <div className="absolute top-3 left-3 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
                            📷 Alignez le produit dans le cadre
                          </div>
                          {!videoReady ? (
                            <div className="absolute bottom-16 left-0 right-0 flex justify-center">
                              <span className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                                ⏳ Préparation...
                              </span>
                            </div>
                          ) : null}
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-\[9999\] pointer-events-auto">
                            <button
                                type="button"
                                onClickCapture={(e) => {
                                  console.log("Capture clicked!");
                                }}
                                onClick={(e) => {
                                  console.log("=== CAPTURE CLICKED ===");
                                  window.testCapture = capturePhoto;
                                  capturePhoto();
                                }}
                                className="cursor-pointer select-none active:scale-95 transition-transform px-10 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-bold flex items-center gap-3 shadow-xl border-2 border-white"
                            >
                                <Camera className="w-6 h-6" />
                                <span className="text-lg">CAPTURER</span>
                            </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  console.log("Close clicked!");
                                  stopCamera();
                                }}
                                className="cursor-pointer px-6 py-4 bg-gray-700/80 text-white rounded-full font-medium hover:bg-gray-600"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                        </>
                      )}
                    </div>
                  ) : imagePreview || formData.image ? (
                    <div className="relative mb-3">
                      <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        <img 
                          src={imagePreview || (formData.image instanceof File ? URL.createObjectURL(formData.image) : formData.image)} 
                          alt="Preview" 
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { clearImage(); startCamera(); }}
                        className="absolute bottom-2 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-orange-500 text-white rounded-full font-medium flex items-center gap-2 hover:bg-orange-600"
                      >
                        <Camera className="w-4 h-4" />
                        Reprendre la photo
                      </button>
                    </div>
                  ) : null}
                  
                  {/* Buttons */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="flex-1 px-4 py-3 bg-orange-100 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-200 flex items-center justify-center gap-2 font-medium"
                    >
                      <Camera className="w-5 h-5" />
                      Caméra
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 font-medium"
                    >
                      <Upload className="w-5 h-5" />
                      Galerie
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleGallerySelect}
                    className="hidden"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    {editingProduit ? "Modifier" : "Créer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedProduit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800">Détails du produit</h2>
                  <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-gray-100 rounded">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Product Image */}
                <div className="flex justify-center mb-6">
                  <div className="w-48 h-48 bg-gray-100 rounded-xl overflow-hidden">
                    {selectedProduit.image ? (
                      <img
                        src={getImageUrl(selectedProduit.image)}
                        alt={selectedProduit.nom}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-800">{selectedProduit.nom}</h3>
                    <p className="text-gray-500">SKU: {selectedProduit.sku}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-500">Catégorie</p>
                      <p className="font-semibold text-gray-800">{getCategoryName(selectedProduit.categorieId)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Prix de vente</p>
                      <p className="font-semibold text-orange-600 text-lg">
                        {new Intl.NumberFormat("fr-FR").format(selectedProduit.prixVente)} F
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Stock actuel</p>
                      <p className={`font-semibold ${isLowStock(selectedProduit) ? "text-orange-600" : "text-gray-800"}`}>
                        {selectedProduit.stock} unités
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Stock minimum</p>
                      <p className="font-semibold text-gray-800">{selectedProduit.stockMin} unités</p>
                    </div>
                  </div>

                  {isLowStock(selectedProduit) && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-orange-600 font-medium text-center">
                        ⚠️ Alerte: Stock faible
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                  >
                    Fermer
                  </button>
                  <button
                    onClick={() => openEditModal(selectedProduit)}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Supprimer le produit"
        message="Êtes-vous sûr de vouloir supprimer ce produit? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setProduitToDelete(null);
        }}
      />
    </Layout>
  );
}
