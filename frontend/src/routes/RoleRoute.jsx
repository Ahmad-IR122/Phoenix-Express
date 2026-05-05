import { Navigate } from "react-router-dom";

export default function RoleRoute({ allowedRoles, children }) {
  const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
