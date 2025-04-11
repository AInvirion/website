
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ServiceCard";
import { Loader2, Plus, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { AIChatWidget } from "@/components/AIChatWidget";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect } from "react";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  features?: string[];
}

const ServicesPage = () => {
  const { user, hasRole, refreshUserData } = useAuth();
  const isAdmin = hasRole('admin');
  
  // Refresh user data when component mounts to ensure we have latest credits
  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);
  
  // Consultar servicios disponibles
  const { data: services, isLoading, error, isError } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      try {
        console.log("Fetching services...");
        const { data, error } = await supabase
          .from("services")
          .select("*")
          .order("price");

        if (error) {
          console.error("Supabase error fetching services:", error);
          throw error;
        }
        
        console.log("Services loaded:", data);
        // Usamos cast a unknown primero para evitar errores de tipado
        return data as unknown as Service[];
      } catch (error) {
        console.error("Error fetching services:", error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000
  });

  // Ejemplos de servicios para mostrar en la UI
  const serviceExamples = [
    {
      id: "1",
      name: "Búsqueda Básica",
      description: "Búsqueda rápida en una base de datos específica",
      price: 1,
      features: ["Hasta 100 resultados", "Exportación CSV", "Filtros básicos"]
    },
    {
      id: "2",
      name: "Búsqueda Avanzada",
      description: "Búsqueda completa con filtros avanzados y más resultados",
      price: 3,
      features: ["Hasta 500 resultados", "Exportación en múltiples formatos", "Filtros avanzados", "Guardado de búsquedas"]
    },
    {
      id: "3",
      name: "Análisis Completo",
      description: "Análisis detallado con reportes y visualizaciones",
      price: 8,
      features: ["Resultados ilimitados", "Reportes personalizados", "Visualizaciones avanzadas", "Exportación en todos los formatos", "Acceso por 30 días"]
    }
  ];

  const displayServices = services?.length ? services : serviceExamples;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Servicios Disponibles</h1>
        {isAdmin && (
          <Button asChild>
            <Link to="/dashboard/admin/servicios">
              <Plus className="mr-2 h-4 w-4" />
              Gestionar Servicios
            </Link>
          </Button>
        )}
      </div>
      
      {isError && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar los servicios. Por favor, intenta de nuevo más tarde.
          </AlertDescription>
        </Alert>
      )}

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 text-blue-800 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div>
            <p className="font-medium">Tu saldo disponible: <span className="font-bold">{user?.credits || 0} créditos</span></p>
            <p className="text-sm text-blue-600">1 crédito equivale a $4.00 USD</p>
          </div>
          <Button size="sm" asChild>
            <Link to="/dashboard/creditos">Comprar Créditos</Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {displayServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  id={service.id}
                  name={service.name}
                  description={service.description}
                  price={service.price}
                  features={service.features || []}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="lg:col-span-1">
          <AIChatWidget />
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
