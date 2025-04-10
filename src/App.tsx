
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import { AuthProvider } from "./contexts/AuthContext";
import { DashboardLayout } from "./components/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Rutas protegidas - Solo usuarios autenticados */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/servicios" element={<div>Servicios</div>} />
                <Route path="/dashboard/historial" element={<div>Historial</div>} />
                <Route path="/dashboard/creditos" element={<div>Créditos</div>} />
                
                {/* Rutas de administración - Solo administradores */}
                <Route element={<ProtectedRoute requiredRoles={["admin"]} redirectTo="/unauthorized" />}>
                  <Route path="/dashboard/admin/usuarios" element={<div>Gestión de Usuarios</div>} />
                  <Route path="/dashboard/admin/servicios" element={<div>Gestión de Servicios</div>} />
                  <Route path="/dashboard/admin/configuracion" element={<div>Configuración</div>} />
                </Route>
              </Route>
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
