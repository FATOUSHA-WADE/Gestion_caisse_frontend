import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import Login from "../pages/Login";
import ForgotPassword from "../pages/ForgotPassword";
import Dashboard from "../pages/Dashbord";
import Produits from "../pages/Produits";
import Categories from "../pages/Categories";
import Ventes from "../pages/Ventes";
import HistoriqueVentes from "../pages/HistoriqueVentes";
import MouvementStock from "../pages/MouvementStock";
import Rapports from "../pages/Rapports";
import Utilisateurs from "../pages/Utilisateurs";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import Recus from "../pages/Recus";
import PrivateRoute from "./PrivateRoute";
import { AuthContext } from "../context/AuthContext";

// Protected route component with role-based access
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div>Chargement...</div>;
  
  if (!user) return <Navigate to="/" />;
  
  // If allowedRoles is specified, check user's role
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" />;
    }
  }
  
  return children;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/produits"
          element={
            <PrivateRoute>
              <Produits />
            </PrivateRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute allowedRoles={["admin", "gerant"]}>
              <Categories />
            </ProtectedRoute>
          }
        />

        <Route
          path="/ventes"
          element={
            <PrivateRoute>
              <Ventes />
            </PrivateRoute>
          }
        />

        <Route
          path="/historique-ventes"
          element={
            <PrivateRoute>
              <HistoriqueVentes />
            </PrivateRoute>
          }
        />

        <Route
          path="/mouvements-stock"
          element={
            <ProtectedRoute allowedRoles={["admin", "gerant"]}>
              <MouvementStock />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rapports"
          element={
            <ProtectedRoute allowedRoles={["admin", "gerant"]}>
              <Rapports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/utilisateurs"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Utilisateurs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recus"
          element={
            <PrivateRoute>
              <Recus />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
