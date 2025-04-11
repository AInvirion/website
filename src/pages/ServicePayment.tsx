
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Coins, CreditCard } from "lucide-react";
import { ServiceDetails } from "@/components/services/ServiceDetails";
import { CreditPaymentOption } from "@/components/services/CreditPaymentOption";
import { StripePaymentOption } from "@/components/services/StripePaymentOption";
import { useServicePayment } from "@/hooks/useServicePayment";

const ServicePayment = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    service,
    isLoading,
    isProcessing,
    paymentMethod,
    setPaymentMethod,
    hasSufficientCredits,
    handleCreditPayment,
    handleStripePayment
  } = useServicePayment(serviceId, user);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-700">Servicio no encontrado</h2>
        <Button className="mt-4" onClick={() => navigate("/dashboard/servicios")}>
          Volver a Servicios
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Pagar Servicio</h1>
      
      <ServiceDetails 
        service={service} 
        user={user} 
        hasSufficientCredits={hasSufficientCredits} 
      />

      <Card>
        <CardHeader>
          <CardTitle>Método de Pago</CardTitle>
          <p className="text-gray-500 text-sm">
            Selecciona cómo deseas pagar por este servicio
          </p>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue="credits"
            value={paymentMethod}
            onValueChange={(value) => setPaymentMethod(value as "credits" | "stripe")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="credits" disabled={!hasSufficientCredits}>
                <Coins className="mr-2 h-4 w-4" />
                Pagar con Créditos
              </TabsTrigger>
              <TabsTrigger value="stripe">
                <CreditCard className="mr-2 h-4 w-4" />
                Pagar con Tarjeta
              </TabsTrigger>
            </TabsList>
            <TabsContent value="credits" className="pt-4">
              <CreditPaymentOption 
                servicePrice={service.price}
                hasSufficientCredits={hasSufficientCredits}
                isProcessing={isProcessing}
                onPayWithCredits={handleCreditPayment}
                userCredits={user?.credits}
              />
            </TabsContent>
            <TabsContent value="stripe" className="pt-4">
              <StripePaymentOption 
                servicePrice={service.price} 
                isProcessing={isProcessing}
                onPayWithStripe={handleStripePayment}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard/servicios")}
            disabled={isProcessing}
          >
            Cancelar
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default ServicePayment;
