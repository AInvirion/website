
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Check, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

// Define service interface based on database schema
export interface ServiceInfo {
  id: string;
  name: string;
  description: string | null;
  price: number;
  created_at: string | null;
  updated_at: string | null;
}

// Utility function to get service image and route
const getServiceDetails = (name: string) => {
  const details = {
    'sbom-analyzer': {
      imageUrl: '/placeholder.svg',
      route: '/dashboard/servicios/sbom-analyzer',
    },
    'cv-comparator': {
      imageUrl: '/placeholder.svg',
      route: '/dashboard/servicios/cv-comparator',
    }
  };
  
  return details[name as keyof typeof details] || {
    imageUrl: '/placeholder.svg',
    route: '/dashboard/servicios',
  };
};

export const ServiceGrid = () => {
  const { data: services, isLoading, error } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at');
      
      if (error) throw error;
      return data as ServiceInfo[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-8">
        Error cargando servicios. Por favor, intenta de nuevo.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {services?.map((service) => (
        <ServiceCardItem key={service.id} service={service} />
      ))}
    </div>
  );
};

const ServiceCardItem = ({ service }: { service: ServiceInfo }) => {
  const navigate = useNavigate();
  const serviceDetails = getServiceDetails(service.name);
  
  return (
    <Card 
      className="group h-full cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
      onClick={() => navigate(serviceDetails.route)}
    >
      <div className="relative h-44 w-full overflow-hidden bg-gray-100">
        <img 
          src={serviceDetails.imageUrl} 
          alt={service.name} 
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {service.name === 'sbom-analyzer' ? 'Análisis de SBOM' : 
           service.name === 'cv-comparator' ? 'Comparador de CV' : 
           service.name}
        </h3>
        <p className="text-gray-600 text-sm mb-3">{service.description}</p>
        <div className="flex items-center text-sm text-purple-700">
          <span>{service.price} créditos</span>
        </div>
      </div>
    </Card>
  );
};

export default ServiceGrid;
