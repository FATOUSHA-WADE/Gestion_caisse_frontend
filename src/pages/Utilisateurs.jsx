import { useEffect, useState, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X,
  Users,
  Eye,
  ChevronLeft,
  ChevronRight,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import Layout from "../components/Layout";
import API from "../api/axios";
import { getUploadUrl } from "../utils/apiConfig";
import { FormInput, Button, Alert, useToast, ConfirmModal } from "../components/ui";
import { useFormValidation } from "../hooks/useFormValidation";

// Validation rules for user form
const userValidationRules = {
  nom: {
    required: true,
    requiredMessage: "Veuillez saisir le nom",
  },
  telephone: {
    required: true,
    requiredMessage: "Veuillez saisir le numéro de téléphone",
    phone: true,
    phoneMessage: "Veuillez entrer un numéro de téléphone valide",
  },
  email: {
    email: true,
    emailMessage: "Veuillez entrer une adresse email valide",
  },
  password: {
    required: true,
    requiredMessage: "Veuillez saisir le mot de passe",
    minLength: 6,
    minLengthMessage: "Le mot de passe doit contenir au moins 6 caractères",
  },
};

export default function Utilisateurs() {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 7,
    total: 0,
    totalPages: 0
  });
  const [formData, setFormData] = useState({
    nom: "",
    telephone: "",
    email: "",
    password: "",
    role: "caissier",
    photo: null,
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [apiSuccess, setApiSuccess] = useState("");
  const [apiError, setApiError] = useState("");

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    setValues,
  } = useFormValidation(formData, userValidationRules);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/auth/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      let filteredUsers = res.data.data || [];
      
      // Apply role filter
      if (roleFilter) {
        filteredUsers = filteredUsers.filter(u => u.role === roleFilter);
      }
      
      // Apply pagination
      const start = (pagination.page - 1) * pagination.limit;
      const end = start + pagination.limit;
      const paginatedUsers = filteredUsers.slice(start, end);
      
      setUsers(paginatedUsers);
      setPagination(prev => ({
        ...prev,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / prev.limit)
      }));
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    
    // Validate all fields
    const isValid = validateAll();
    if (!isValid) {
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();
      
      Object.keys(values).forEach((key) => {
        if (key === "photo" && values[key]) {
          formDataToSend.append(key, values[key]);
        } else if (values[key]) {
          formDataToSend.append(key, values[key]);
        }
      });

      if (editingUser) {
        // Pour la mise à jour, on utilise FormData si une photo est présente
        const formDataToUpdate = new FormData();
        
        Object.keys(values).forEach((key) => {
          if (key === "photo" && values[key]) {
            formDataToUpdate.append(key, values[key]);
          } else if (values[key]) {
            formDataToUpdate.append(key, values[key]);
          }
        });
        
        // Si pas de nouvelle photo, envoyer comme JSON
        if (!values.photo) {
          const updateData = { ...values };
          if (!updateData.password) delete updateData.password;
          
          await API.put(`/auth/users/${editingUser.id}`, updateData, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } else {
          await API.put(`/auth/users/${editingUser.id}`, formDataToUpdate, {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });
        }
      } else {
        await API.post("/auth/users", formDataToSend, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      }

      fetchUsers();
      closeModal();
      toast.success(editingUser ? "Utilisateur modifié avec succès" : "Utilisateur créé avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      // Handle different error status codes gracefully
      if (error.response?.status === 400) {
        setApiError("Données invalides. Veuillez vérifier tous les champs.");
      } else if (error.response?.status === 409) {
        setApiError("Un utilisateur avec ce téléphone ou email existe déjà.");
      } else if (error.response?.status === 401) {
        setApiError("Session expirée. Veuillez vous reconnecter.");
      } else if (error.response?.status === 403) {
        setApiError("Vous n'avez pas l'autorisation d'effectuer cette action.");
      } else {
        setApiError(error.response?.data?.message || "Une erreur s'est produite");
      }
    }
  };

  const handleDelete = (id) => {
    setUserToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const token = localStorage.getItem("token");
      await API.delete(`/auth/users/${userToDelete}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
      toast.success("Utilisateur supprimé avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error.response?.data?.message || "Une erreur s'est produite");
    } finally {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.statut === 'actif' ? 'inactif' : 'actif';
    const action = newStatus === 'actif' ? 'activer' : 'désactiver';
    
    try {
      const token = localStorage.getItem("token");
      await API.patch(`/auth/users/${user.id}/statut`, { statut: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
      toast.success(`Utilisateur ${action}é avec succès`);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error(error.response?.data?.message || "Une erreur s'est produite");
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    const userData = {
      nom: user.nom,
      telephone: user.telephone,
      email: user.email || "",
      password: "",
      role: user.role,
      photo: null,
    };
    setFormData(userData);
    setValues(userData);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    const defaultData = {
      nom: "",
      telephone: "",
      email: "",
      password: "",
      role: "caissier",
      photo: null,
    };
    setFormData(defaultData);
    setValues(defaultData);
    setApiError("");
    setApiSuccess("");
  };

  const filteredUsers = users.filter((user) =>
    user.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.telephone?.includes(searchTerm)
  );

  const getRoleBadge = (role) => {
    const badges = {
      admin: "bg-purple-100 text-purple-700",
      gerant: "bg-blue-100 text-blue-700",
      caissier: "bg-green-100 text-green-700"
    };
    return badges[role] || badges.caissier;
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: "Administrateur",
      gerant: "Gérant",
      caissier: "Caissier"
    };
    return labels[role] || role;
  };

  const getInitials = (nom) => {
    if (!nom) return "?";
    return nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };


  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Utilisateurs</h1>
            <p className="text-gray-500">Gérez les utilisateurs</p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => {
                const defaultData = {
                  nom: "",
                  telephone: "",
                  email: "",
                  password: "",
                  role: "caissier",
                  photo: null,
                };
                setFormData(defaultData);
                setValues(defaultData);
                setEditingUser(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nouvel Utilisateur
            </button>
          )}
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

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Tous les rôles</option>
              <option value="admin">Administrateur</option>
              <option value="gerant">Gérant</option>
              <option value="caissier">Caissier</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Téléphone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rôle
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
                  {filteredUsers.map((u) => {
                    const isActive = u.statut === 'actif';
                    return (
                    <tr key={u.id} className={`hover:bg-gray-50 ${!isActive ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-orange-100' : 'bg-gray-200'}`}>
                            {u.photo ? (
                              <img
                                src={getUploadUrl(u.photo)}
                                alt={u.nom}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <span 
                              className={`font-medium text-sm ${u.photo ? 'hidden' : ''} ${isActive ? 'text-orange-600' : 'text-gray-500'}`}
                              style={u.photo ? {display: 'none'} : {display: 'flex'}}
                            >
                              {getInitials(u.nom)}
                            </span>
                          </div>
                          <span className={`font-medium ${isActive ? 'text-gray-800' : 'text-gray-400'}`}>{u.nom}</span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                        {u.telephone}
                      </td>
                      <td className={`px-6 py-4 ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                        {u.email || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.statut === "actif" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {u.statut === "actif" ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-2 rounded-lg transition-colors ${
                              u.statut === 'actif' 
                                ? 'text-green-600 hover:bg-green-50' 
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={u.statut === 'actif' ? 'Désactiver' : 'Activer'}
                          >
                            {u.statut === 'actif' ? (
                              <ToggleRight className="w-5 h-5" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowDetailModal(true);
                            }}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* Show edit/delete for admin users only */}
                          {user?.role === 'admin' && (
                            <>
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Modifier"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(u.id)}
                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
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
            </div>
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">
                  {editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
                </h2>
                <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} noValidate className="p-4 space-y-4">
                {/* API Error/Success Messages */}
                {apiError && (
                  <Alert type="error" message={apiError} onClose={() => setApiError("")} />
                )}
                {apiSuccess && (
                  <Alert type="success" message={apiSuccess} onClose={() => setApiSuccess("")} />
                )}
                
                {/* Photo */}
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center">
                    {values.photo ? (
                      <img
                        src={URL.createObjectURL(values.photo)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl text-gray-400">
                        {getInitials(values.nom)}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Photo de profil
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const newFormData = { ...values, photo: e.target.files[0] };
                      setFormData(newFormData);
                      setValues(newFormData);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <FormInput
                  label="Nom"
                  name="nom"
                  type="text"
                  value={values.nom}
                  onChange={(e) => {
                    const newFormData = { ...values, nom: e.target.value };
                    setFormData(newFormData);
                    handleChange(e);
                  }}
                  onBlur={handleBlur}
                  error={errors.nom}
                  touched={touched.nom}
                  placeholder="Entrez le nom"
                  required
                />

                <FormInput
                  label="Téléphone"
                  name="telephone"
                  type="tel"
                  value={values.telephone}
                  onChange={(e) => {
                    const newFormData = { ...values, telephone: e.target.value };
                    setFormData(newFormData);
                    handleChange(e);
                  }}
                  onBlur={handleBlur}
                  error={errors.telephone}
                  touched={touched.telephone}
                  placeholder="Entrez le téléphone"
                  required
                />

                <FormInput
                  label="Email"
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={(e) => {
                    const newFormData = { ...values, email: e.target.value };
                    setFormData(newFormData);
                    handleChange(e);
                  }}
                  onBlur={handleBlur}
                  error={errors.email}
                  touched={touched.email}
                  placeholder="Entrez l'email (optionnel)"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rôle
                  </label>
                  <select
                    value={values.role}
                    onChange={(e) => {
                      const newFormData = { ...values, role: e.target.value };
                      setFormData(newFormData);
                      setValues(newFormData);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="caissier">Caissier</option>
                    <option value="gerant">Gérant</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <FormInput
                  label={editingUser ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}
                  name="password"
                  type="password"
                  value={values.password}
                  onChange={(e) => {
                    const newFormData = { ...values, password: e.target.value };
                    setFormData(newFormData);
                    handleChange(e);
                  }}
                  onBlur={handleBlur}
                  error={errors.password}
                  touched={touched.password}
                  placeholder={editingUser ? "Laissez vide pour garder l'actuel" : "Entrez le mot de passe"}
                  required={!editingUser}
                  showPasswordToggle
                />

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
                    {editingUser ? "Modifier" : "Créer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteConfirm}
          title="Supprimer l'utilisateur"
          message="Êtes-vous sûr de vouloir supprimer cet utilisateur? Cette action est irréversible."
          confirmText="Supprimer"
          cancelText="Annuler"
          type="danger"
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setUserToDelete(null);
          }}
        />

        {/* User Detail Modal */}
        {showDetailModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Détails de l'utilisateur
                  </h2>
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedUser(null);
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Nom:</span>
                  <span className="font-semibold text-gray-800 dark:text-white">{selectedUser.nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Téléphone:</span>
                  <span className="font-semibold text-gray-800 dark:text-white">{selectedUser.telephone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Email:</span>
                  <span className="font-semibold text-gray-800 dark:text-white">{selectedUser.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Rôle:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                    selectedUser.role === 'gerant' ? 'bg-blue-100 text-blue-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                    {selectedUser.role === 'admin' ? 'Admin' : selectedUser.role === 'gerant' ? 'Gérant' : 'Caissier'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Statut:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    selectedUser.statut === 'actif' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {selectedUser.statut === 'actif' ? 'Actif' : 'Inactif'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Dernière connexion:</span>
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {selectedUser.derniereConnexion ? new Date(selectedUser.derniereConnexion).toLocaleString('fr-FR') : 'Jamais'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Créé le:</span>
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {new Date(selectedUser.createdAt).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedUser(null);
                  }}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
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
