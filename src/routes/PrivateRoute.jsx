import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

// ...existing code...

export default function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Chargement...</div>;

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