import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

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

export default function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <LoadingFallback />;

  if (!user) return <Navigate to="/" />;

  // If allowedRoles is specified, check user's role
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      // Redirect to dashboard if user doesn't have the required role
      return <Navigate to="/dashboard" />;
    }
  }

  return children;
}