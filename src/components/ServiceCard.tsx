
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Check } from "lucide-react";

interface ServiceCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
}

export const ServiceCard = ({ id, name, description, price, features = [] }: ServiceCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const hasSufficientCredits = user?.credits && price ? user.credits >= price : false;

  return (
    <Card className="h-full flex flex-col transition-all hover:shadow-md">
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-gray-500">Precio</p>
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold">{price} créditos</p>
              <p className="text-gray-500">o</p>
              <p className="font-medium">${(price * 4).toFixed(2)} USD</p>
            </div>
          </div>
          {hasSufficientCredits ? (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
              <Check className="w-3 h-3 mr-1" />
              Disponible
            </span>
          ) : (
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
              Necesitas más créditos
            </span>
          )}
        </div>
        
        {features.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium mb-2">Características:</p>
            <ul className="space-y-1">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-4 h-4 text-green-500 mr-2 shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          className="w-full" 
          onClick={() => navigate(`/dashboard/servicios/${id}/pagar`)}
        >
          Adquirir Servicio
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};
