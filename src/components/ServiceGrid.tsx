
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Check, FileText, File } from "lucide-react";

// Definición de los servicios disponibles
export interface ServiceCardInfo {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  route: string;
  price: number;
}

// Lista de servicios disponibles
export const availableServices: ServiceCardInfo[] = [
  {
    id: "cv-comparator",
    name: "Comparador de CV",
    description: "Compara múltiples CVs para encontrar los candidatos que mejor se ajustan al perfil profesional que buscas.",
    imageUrl: "/placeholder.svg",
    route: "/dashboard/servicios/cv-comparator",
    price: 14
  },
  {
    id: "sbom-analyzer",
    name: "Análisis de SBOM",
    description: "Analiza tu software para verificar el cumplimiento legal de las librerías utilizadas según normativas vigentes.",
    imageUrl: "/placeholder.svg",
    route: "/dashboard/servicios/sbom-analyzer",
    price: 8
  },
  {
    id: "basic-search",
    name: "Búsqueda Básica",
    description: "Búsqueda rápida en una base de datos específica con filtros simples.",
    imageUrl: "/placeholder.svg",
    route: "/dashboard/servicios/basic-search",
    price: 1
  },
  {
    id: "advanced-search",
    name: "Búsqueda Avanzada",
    description: "Búsqueda completa con filtros avanzados y mayor cantidad de resultados.",
    imageUrl: "/placeholder.svg",
    route: "/dashboard/servicios/advanced-search",
    price: 3
  }
];

export const ServiceGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {availableServices.map((service) => (
        <ServiceCardItem key={service.id} service={service} />
      ))}
    </div>
  );
};

const ServiceCardItem = ({ service }: { service: ServiceCardInfo }) => {
  const navigate = useNavigate();
  
  return (
    <Card 
      className="group h-full cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
      onClick={() => navigate(service.route)}
    >
      <div className="relative h-44 w-full overflow-hidden bg-gray-100">
        <img 
          src={service.imageUrl} 
          alt={service.name} 
          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{service.name}</h3>
        <p className="text-gray-600 text-sm mb-3">{service.description}</p>
        <div className="flex items-center text-sm text-purple-700">
          <span>{service.price} créditos</span>
        </div>
      </div>
    </Card>
  );
};
