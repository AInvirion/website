
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
import { ServiceGrid } from "@/components/ServiceGrid";

const ServicesPage = () => {
  const { user, refreshUserData } = useAuth();
  
  // Refresh user data when component mounts to ensure we have latest credits
  useEffect(() => {
    refreshUserData();
  }, [refreshUserData]);
  
  // Consultar servicios disponibles
  const { isLoading, isError } = useQuery({
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
        return data;
      } catch (error) {
        console.error("Error fetching services:", error);
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Servicios Disponibles</h1>
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
            <ServiceGrid />
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
