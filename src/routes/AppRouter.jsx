import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext, lazy, Suspense } from "react";
import PrivateRoute from "./PrivateRoute";
import { AuthContext } from "../context/AuthContext";
import { ParameterProvider } from "../context/ParameterContext";

const Login = lazy(() => import("../pages/Login"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const Dashboard = lazy(() => import("../pages/Dashbord"));
const Produits = lazy(() => import("../pages/Produits"));
const Categories = lazy(() => import("../pages/Categories"));
const Ventes = lazy(() => import("../pages/Ventes"));
const HistoriqueVentes = lazy(() => import("../pages/HistoriqueVentes"));
const MouvementStock = lazy(() => import("../pages/MouvementStock"));
const Rapports = lazy(() => import("../pages/Rapports"));
const Utilisateurs = lazy(() => import("../pages/Utilisateurs"));
const Profile = lazy(() => import("../pages/Profile"));
const Settings = lazy(() => import("../pages/Settings"));
const Recus = lazy(() => import("../pages/Recus"));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        <p className="text-gray-500 text-sm">Chargement...</p>
      </div>
    </div>
  );
}

function LoginPage() {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <LoadingFallback />;
  
  if (user) return <Navigate to="/ventes" replace />;
  
  return <Login />;
}

// Protected route component with role-based access
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <LoadingFallback />;
  
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
      <ParameterProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
          <Route path="/" element={<LoginPage />} />
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

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </ParameterProvider>
    </BrowserRouter>
  );
}
