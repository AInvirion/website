
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, Outlet } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  History, 
  CreditCard, 
  Settings, 
  Users, 
  LogOut,
  Database 
} from "lucide-react";

export const DashboardLayout = () => {
  const { user, signOut, hasRole } = useAuth();
  const isAdmin = hasRole("admin");

  // Obtenemos las iniciales para el avatar
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    return user?.email?.charAt(0) || "U";
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Panel de Control</h1>
        </div>
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-6">
            <Avatar>
              <AvatarImage src={user?.avatarUrl || ""} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>

          <nav className="space-y-1">
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>

            <Link
              to="/dashboard/servicios"
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Servicios</span>
            </Link>

            <Link
              to="/dashboard/historial"
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
            >
              <History className="w-4 h-4" />
              <span>Historial</span>
            </Link>

            <Link
              to="/dashboard/creditos"
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
            >
              <CreditCard className="w-4 h-4" />
              <span>Créditos: {user?.credits || 0}</span>
            </Link>

            {isAdmin && (
              <>
                <div className="my-2 border-t pt-2">
                  <p className="px-2 text-xs font-semibold text-gray-500 uppercase">Administración</p>
                </div>
                <Link
                  to="/dashboard/admin/usuarios"
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
                >
                  <Users className="w-4 h-4" />
                  <span>Usuarios</span>
                </Link>
                <Link
                  to="/dashboard/admin/servicios"
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
                >
                  <Database className="w-4 h-4" />
                  <span>Gestión de Servicios</span>
                </Link>
                <Link
                  to="/dashboard/admin/configuracion"
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
                >
                  <Settings className="w-4 h-4" />
                  <span>Configuración</span>
                </Link>
              </>
            )}
          </nav>
        </div>
        <div className="absolute bottom-0 w-64 p-4 border-t">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start"
            onClick={signOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span>Cerrar sesión</span>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
