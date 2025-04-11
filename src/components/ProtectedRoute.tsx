
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppRole } from "@/types/auth";

interface ProtectedRouteProps {
  requiredRoles?: AppRole[];
  redirectTo?: string;
}

export const ProtectedRoute = ({
  requiredRoles,
  redirectTo = "/auth",
}: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading, hasRole } = useAuth();

  // Mientras se carga, mostramos un spinner
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Cargando...</div>;
  }

  // Si no está autenticado, redirigimos al login
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si requiere roles específicos, verificamos que el usuario los tenga
  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some((role) => hasRole(role));
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Si pasa todas las verificaciones, permite el acceso
  return <Outlet />;
};
