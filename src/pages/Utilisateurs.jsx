import { useEffect, useState, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  Plus, Search, Edit, X, Users, Eye, ChevronLeft, ChevronRight,
  ToggleLeft, ToggleRight, Loader2
} from "lucide-react";
import Layout from "../components/Layout";
import API from "../api/axios";
import { FormInput, Alert, ConfirmModal } from "../components/ui";
import { useFormValidation } from "../hooks/useFormValidation";
import { useToast } from "../components/ui/useToast";

// Règles de validation pour CRÉATION
const createRules = {
  nom: { required: true, requiredMessage: "Ce champ est obligatoire" },
  telephone: { required: true, requiredMessage: "Ce champ est obligatoire", phone: true, phoneMessage: "Numéro invalide (77 ou 78)" },
  email: { email: true, emailMessage: "Email invalide" },
  password: { required: true, requiredMessage: "Ce champ est obligatoire", minLength: 6, minLengthMessage: "Minimum 6 caractères" },
};

// Règles pour MODIFICATION (mot de passe optionnel)
const updateRules = {
  nom: { required: true, requiredMessage: "Ce champ est obligatoire" },
  telephone: { required: true, requiredMessage: "Ce champ est obligatoire", phone: true, phoneMessage: "Numéro invalide (77 ou 78)" },
  email: { email: true, emailMessage: "Email invalide" },
  password: { required: false, minLength: 6, minLengthMessage: "Minimum 6 caractères" },
};

export default function Utilisateurs() {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [apiError, setApiError] = useState("");

  const limitPerPage = 7;

  // Choisir les règles selon le mode
  const validationRules = editingUser ? updateRules : createRules;

  const {
    values, errors, touched, handleChange, handleBlur, validateAll,
    setValues, setErrors, setTouched,
  } = useFormValidation({
    nom: "", telephone: "", email: "", password: "", role: "caissier", photo: null,
  }, validationRules);

  // Vérifier si formulaire est prêt pour soumission
  const isFormReady = useCallback(() => {
    if (editingUser) {
      return values.nom?.trim() && values.telephone?.trim();
    }
    return values.nom?.trim() && values.telephone?.trim() && values.password?.trim();
  }, [values, editingUser]);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/auth/users", { headers: { Authorization: `Bearer ${token}` } });
      let filteredUsers = res.data.data || [];
      if (roleFilter) filteredUsers = filteredUsers.filter(u => u.role === roleFilter);
      setTotalUsers(filteredUsers.length);
      const start = (currentPage - 1) * limitPerPage;
      const paginatedUsers = filteredUsers.slice(start, start + limitPerPage);
      setUsers(paginatedUsers);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [currentPage, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Fonctions de pagination
  const goToPrevPage = () => setCurrentPage(prev => prev - 1);
  const goToNextPage = () => setCurrentPage(prev => prev + 1);

  const totalPages = Math.ceil(totalUsers / limitPerPage);
  const startItem = (currentPage - 1) * limitPerPage + 1;
  const endItem = Math.min(currentPage * limitPerPage, totalUsers);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    
    // Marquer tous les champs comme touchéd pour afficher les erreurs
    const allTouched = {};
    Object.keys(validationRules).forEach(key => { allTouched[key] = true; });
    setTouched(allTouched);
    
    // Valider tous les champs
    if (!validateAll()) {
      setApiError("Veuillez remplir correctement tous les champs obligatoires");
      return;
    }
    
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      
      if (editingUser) {
        // MODIFICATION
        if (values.photo) {
          const formData = new FormData();
          formData.append("nom", values.nom);
          formData.append("telephone", values.telephone);
          formData.append("email", values.email || "");
          formData.append("role", values.role);
          if (values.password?.trim()) formData.append("password", values.password);
          formData.append("photo", values.photo);

          const res = await API.put("/auth/users/" + editingUser.id, formData, {
            headers: { Authorization: "Bearer " + token, "Content-Type": "multipart/form-data" },
          });

          if (res.data.success) {
            toast.success("Utilisateur modifié avec succès");
            closeModal();
            fetchUsers();
          }
        } else {
          const updateData = {
            nom: values.nom,
            telephone: values.telephone,
            email: values.email || null,
            role: values.role,
          };
          if (values.password?.trim()) updateData.password = values.password;

          const res = await API.put("/auth/users/" + editingUser.id, updateData, {
            headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
          });

          if (res.data.success) {
            toast.success("Utilisateur modifié avec succès");
            closeModal();
            fetchUsers();
          }
        }
      } else {
        // CRÉATION
        const formData = new FormData();
        formData.append("nom", values.nom);
        formData.append("telephone", values.telephone);
        if (values.email) formData.append("email", values.email);
        formData.append("password", values.password);
        formData.append("role", values.role);
        if (values.photo) formData.append("photo", values.photo);
        
        const res = await API.post("/auth/users", formData, {
          headers: { Authorization: "Bearer " + token, "Content-Type": "multipart/form-data" },
        });
        
        if (res.data.success) {
          toast.success("Utilisateur créé avec succès");
          closeModal();
          fetchUsers();
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
      if (error.response?.status === 409) {
        setApiError("Un utilisateur avec ce téléphone existe déjà.");
      } else if (error.response?.status === 401) {
        setApiError("Session expirée. Veuillez vous reconnecter.");
        localStorage.clear();
        window.location.href = "/login";
      } else if (error.response?.status === 403) {
        setApiError("Vous n'avez pas l'autorisation.");
      } else {
        setApiError(error.response?.data?.message || "Une erreur s'est produite");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => { setUserToDelete(id); setShowDeleteConfirm(true); };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await API.delete("/auth/users/" + userToDelete, {
        headers: { Authorization: "Bearer " + token },
      });
      toast.success("Utilisateur supprimé avec succès");
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur lors de la suppression");
    } finally {
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    }
  };

  const handleToggleStatus = async (u) => {
    const newStatus = u.statut === 'actif' ? 'inactif' : 'actif';
    try {
      const token = localStorage.getItem("token");
      await API.patch("/auth/users/" + u.id + "/statut", { statut: newStatus }, {
        headers: { Authorization: "Bearer " + token },
      });
      toast.success(newStatus === 'actif' ? "Utilisateur activé" : "Utilisateur désactivé");
      fetchUsers();
    } catch (error) {
      toast.error("Erreur lors de la modification du statut");
    }
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setValues({
      nom: u.nom,
      telephone: u.telephone,
      email: u.email || "",
      password: "",
      role: u.role,
      photo: null,
    });
    setTouched({});
    setErrors({});
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setValues({
      nom: "", telephone: "", email: "", password: "",
      role: "caissier", photo: null,
    });
    setTouched({});
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setValues({ nom: "", telephone: "", email: "", password: "", role: "caissier", photo: null });
    setTouched({});
    setErrors({});
    setApiError("");
  };

  const getRoleBadge = (role) => ({
    admin: "bg-purple-100 text-purple-700",
    gerant: "bg-blue-100 text-blue-700",
    caissier: "bg-green-100 text-green-700"
  })[role] || "bg-gray-100";

  const getRoleLabel = (role) => ({
    admin: "Administrateur", gerant: "Gérant", caissier: "Caissier"
  })[role] || role;

  const getInitials = (nom) => nom?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || "?";

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
            <button onClick={openCreateModal}
              className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors">
              <Plus className="w-5 h-5" /> Nouvel Utilisateur
            </button>
          )}
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input type="text" placeholder="Rechercher..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <select value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="">Tous les rôles</option>
              <option value="admin">Administrateur</option>
              <option value="gerant">Gérant</option>
              <option value="caissier">Caissier</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Téléphone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rôle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className={"hover:bg-gray-50 " + (u.statut !== 'actif' ? 'opacity-50' : '')}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {u.photo ? (
                            <img src={u.photo} alt={u.nom} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-medium text-sm">
                              {getInitials(u.nom)}
                            </div>
                          )}
                          <span className="font-medium">{u.nom}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{u.telephone}</td>
                      <td className="px-6 py-4 text-gray-600">{u.email || "-"}</td>
                      <td className="px-6 py-4">
                        <span className={"px-2 py-1 rounded-full text-xs font-medium " + getRoleBadge(u.role)}>
                          {getRoleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={"px-2 py-1 rounded-full text-xs font-medium " + (u.statut === 'actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                          {u.statut === 'actif' ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleToggleStatus(u)}
                            className={"p-2 rounded-lg " + (u.statut === 'actif' ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100')}>
                            {u.statut === 'actif' ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button onClick={() => { setSelectedUser(u); setShowDetailModal(true); }}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Eye className="w-4 h-4" />
                          </button>
                          {user?.role === 'admin' && (
                            <button onClick={() => openEditModal(u)}
                              className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg">
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalUsers >= limitPerPage && (
              <div className="px-6 py-4 border-t flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {startItem} à {endItem} sur {totalUsers}
                </span>
                <div className="flex gap-2">
                  <button onClick={goToPrevPage} disabled={currentPage === 1}
                    className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-600">{currentPage} / {totalPages}</span>
                  <button onClick={goToNextPage} disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Formulaire */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold">
                  {editingUser ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
                </h2>
                <button onClick={closeModal} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {apiError && <Alert type="error" message={apiError} onClose={() => setApiError("")} />}

                {/* Photo upload */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden bg-gray-100 cursor-pointer border-2 border-dashed border-gray-300 hover:border-orange-500 transition-colors"
                      onClick={() => document.getElementById('photo-upload').click()}
                    >
                      {values.photo ? (
                        <img src={URL.createObjectURL(values.photo)} alt="Aperçu" className="w-full h-full object-cover" />
                      ) : editingUser?.photo ? (
                        <img src={editingUser.photo} alt="Photo actuelle" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl text-gray-400">{getInitials(values.nom || "U")}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById('photo-upload').click();
                      }}
                      className="absolute -bottom-2 -right-2 bg-orange-500 text-white p-1 rounded-full shadow-lg hover:bg-orange-600 transition-colors"
                      title="Changer la photo"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    {values.photo && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setValues({ ...values, photo: null });
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                        title="Supprimer la photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setValues({ ...values, photo: file });
                      }
                    }}
                  />
                </div>

                {/* Nom */}
                <FormInput
                  label="Nom"
                  name="nom"
                  value={values.nom}
                  onChange={(e) => { setValues({...values, nom: e.target.value}); handleChange(e); }}
                  onBlur={handleBlur}
                  error={errors.nom}
                  touched={touched.nom}
                  placeholder="Entrez le nom"
                  required
                />

                {/* Téléphone */}
                <FormInput
                  label="Téléphone"
                  name="telephone"
                  value={values.telephone}
                  onChange={(e) => { setValues({...values, telephone: e.target.value}); handleChange(e); }}
                  onBlur={handleBlur}
                  error={errors.telephone}
                  touched={touched.telephone}
                  placeholder="771234567 ou 781234567"
                  required
                />

                {/* Email */}
                <FormInput
                  label="Email"
                  name="email"
                  value={values.email}
                  onChange={(e) => { setValues({...values, email: e.target.value}); handleChange(e); }}
                  onBlur={handleBlur}
                  error={errors.email}
                  touched={touched.email}
                  placeholder="email@exemple.com (optionnel)"
                />

                {/* Rôle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                  <select
                    value={values.role}
                    onChange={(e) => setValues({...values, role: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="caissier">Caissier</option>
                    <option value="gerant">Gérant</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                {/* Mot de passe */}
                <FormInput
                  label={editingUser ? "Nouveau mot de passe" : "Mot de passe"}
                  name="password"
                  type="password"
                  value={values.password}
                  onChange={(e) => { setValues({...values, password: e.target.value}); handleChange(e); }}
                  onBlur={handleBlur}
                  error={errors.password}
                  touched={touched.password}
                  placeholder={editingUser ? "Laissez vide pour garder l'actuel" : "Minimum 6 caractères"}
                  required={!editingUser}
                  showPasswordToggle
                />

                {/* Boutons */}
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={closeModal} disabled={submitting}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                    Annuler
                  </button>
                  <button type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      editingUser ? "Modifier" : "Créer"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Suppression */}
        <ConfirmModal
          isOpen={showDeleteConfirm}
          title="Supprimer l'utilisateur"
          message="Êtes-vous sûr de vouloir supprimer cet utilisateur? Cette action est irréversible."
          confirmText="Supprimer"
          cancelText="Annuler"
          type="danger"
          onConfirm={confirmDelete}
          onCancel={() => { setShowDeleteConfirm(false); setUserToDelete(null); }}
        />

        {/* Modal Détails */}
        {showDetailModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-lg font-semibold">Détails de l'utilisateur</h2>
                <button onClick={() => { setShowDetailModal(false); setSelectedUser(null); }}
                  className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nom:</span>
                  <span className="font-semibold">{selectedUser.nom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Téléphone:</span>
                  <span className="font-semibold">{selectedUser.telephone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-semibold">{selectedUser.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rôle:</span>
                  <span className={"px-2 py-1 rounded-full text-xs font-medium " + getRoleBadge(selectedUser.role)}>
                    {getRoleLabel(selectedUser.role)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Statut:</span>
                  <span className={"px-2 py-1 rounded-full text-xs " + (selectedUser.statut === 'actif' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}>
                    {selectedUser.statut === 'actif' ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
              <div className="p-6 border-t">
                <button onClick={() => { setShowDetailModal(false); setSelectedUser(null); }}
                  className="w-full px-4 py-2 border rounded-lg hover:bg-gray-50">
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
