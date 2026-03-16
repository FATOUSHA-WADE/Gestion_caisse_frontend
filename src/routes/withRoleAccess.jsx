import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

// Higher-order component for role-based access control
const withRoleAccess = (allowedRoles = []) => {
  return (// eslint-disable-next-line no-unused-vars
Component) => {
    return function WithRoleAccess(props) {
      const { user, loading } = useContext(AuthContext);
      if (loading) return <div>Chargement...</div>;
      if (!user) return <Navigate to="/" />;
      // If no roles specified, allow all authenticated users
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" />;
      }
      return <Component {...props} />;
    };
  };
};

export default withRoleAccess;
