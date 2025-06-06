
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import { AuthProvider } from "./contexts/AuthContext";
import { DashboardLayout } from "./components/DashboardLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Credits from "./pages/Credits";
import Services from "./pages/Services";
import ServicePayment from "./pages/ServicePayment";
import PaymentSuccess from "./pages/PaymentSuccess";
import CVComparator from "./pages/services/CVComparator";
import SBOMAnalyzer from "./pages/services/SBOMAnalyzer";
import AsistentePersonal from "./pages/services/AsistentePersonal";
import QuienesSomos from "./pages/QuienesSomos";
import Historial from "./pages/Historial";
import Integraciones from "./pages/Integraciones";

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
            <Route path="/quienes-somos" element={<QuienesSomos />} />
            
            {/* Rutas protegidas - Solo usuarios autenticados */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/servicios" element={<Services />} />
                <Route path="/dashboard/servicios/cv-comparator" element={<CVComparator />} />
                <Route path="/dashboard/servicios/sbom-analyzer" element={<SBOMAnalyzer />} />
                <Route path="/dashboard/servicios/asistente-personal" element={<AsistentePersonal />} />
                <Route path="/dashboard/servicios/:serviceId/pagar" element={<ServicePayment />} />
                <Route path="/dashboard/servicios/success" element={<PaymentSuccess />} />
                <Route path="/dashboard/historial" element={<Historial />} />
                <Route path="/dashboard/creditos" element={<Credits />} />
                <Route path="/dashboard/creditos/success" element={<PaymentSuccess />} />
                <Route path="/dashboard/integraciones" element={<Integraciones />} />
                
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
