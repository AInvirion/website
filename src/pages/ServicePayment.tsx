
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, CreditCard, Coins, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
}

const ServicePayment = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { user, refreshUserData } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<"credits" | "stripe">("credits");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: service, isLoading } = useQuery({
    queryKey: ["service", serviceId],
    queryFn: async () => {
      if (!serviceId) throw new Error("ID de servicio no proporcionado");

      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", serviceId)
        .single();

      if (error) throw error;
      return data as Service;
    },
    enabled: !!serviceId,
  });

  const hasSufficientCredits = user?.credits && service?.price 
    ? user.credits >= service.price
    : false;

  const handleCreditPayment = async () => {
    if (!service || !user?.id) return;
    
    if (!hasSufficientCredits) {
      toast("Créditos insuficientes", {
        description: "No tienes suficientes créditos para este servicio",
        action: {
          label: "Comprar créditos",
          onClick: () => navigate("/dashboard/creditos")
        }
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log("Iniciando procesamiento de pago con créditos");
      console.log("Usuario:", user.id);
      console.log("Servicio:", service.id);
      console.log("Precio:", service.price);
      
      // 1. Crear transacción de crédito
      const { data: transactionData, error: transactionError } = await supabase
        .from("credit_transactions")
        .insert({
          user_id: user.id,
          amount: service.price,
          type: "service_payment",
          reference_id: service.id,
        })
        .select();

      if (transactionError) {
        console.error("Error al crear transacción:", transactionError);
        throw new Error(`Error al crear transacción: ${transactionError.message}`);
      }
      
      console.log("Transacción creada exitosamente:", transactionData);

      // 2. Crear ejecución del servicio
      const { data: executionData, error: executionError } = await supabase
        .from("service_executions")
        .insert({
          service_id: service.id,
          user_id: user.id,
          credits_used: service.price,
          status: "pending",
        })
        .select();

      if (executionError) {
        console.error("Error al registrar ejecución del servicio:", executionError);
        throw new Error(`Error al registrar ejecución: ${executionError.message}`);
      }
      
      console.log("Ejecución de servicio creada exitosamente:", executionData);

      // 3. Limpiar datos locales si es necesario
      if (service.name === 'cv-comparator') {
        const storedData = localStorage.getItem('cv-comparator-data');
        if (storedData) {
          localStorage.removeItem('cv-comparator-data');
        }
      } else if (service.name === 'sbom-analyzer') {
        const storedData = localStorage.getItem('sbom-analyzer-data');
        if (storedData) {
          localStorage.removeItem('sbom-analyzer-data');
        }
      }

      // 4. Actualizar datos del usuario para reflejar el cambio en créditos
      await refreshUserData();

      // 5. Mostrar mensaje de éxito
      toast.success("Pago con créditos completado", {
        description: `Has utilizado ${service.price} créditos para este servicio`,
      });

      // 6. Redirigir al historial
      navigate("/dashboard/historial");
      
    } catch (error) {
      console.error("Error al procesar el pago con créditos:", error);
      toast.error("Error al procesar el pago", {
        description: error instanceof Error ? error.message : "Ha ocurrido un problema al procesar el pago con créditos",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripePayment = async () => {
    if (!service || !user?.id) return;
    
    setIsProcessing(true);
    
    try {
      const origin = window.location.origin;

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No se pudo obtener la sesión de autenticación");
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          checkoutType: "service",
          serviceId: service.id,
          origin,
        },
      });

      if (error) {
        console.error("Error al invocar la función create-checkout:", error);
        throw error;
      }

      if (data?.url) {
        console.log("URL de checkout de Stripe recibida:", data.url);
        window.location.href = data.url;
      } else {
        console.error("No se recibió URL de checkout en la respuesta:", data);
        throw new Error("No se pudo crear la sesión de pago");
      }
    } catch (error) {
      console.error("Error al iniciar el proceso de pago:", error);
      toast.error("Error al procesar el pago", {
        description: "Intenta nuevamente más tarde",
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{service.name}</CardTitle>
          <CardDescription>{service.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-medium">Precio:</p>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-2xl font-bold">{service.price} créditos</p>
                <p className="text-gray-500">o</p>
                <p className="text-xl font-bold">${(service.price * 4).toFixed(2)} USD</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Tu saldo actual:</p>
              <p className={`text-lg font-bold ${hasSufficientCredits ? 'text-green-600' : 'text-red-600'}`}>
                {user?.credits || 0} créditos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Método de Pago</CardTitle>
          <CardDescription>
            Selecciona cómo deseas pagar por este servicio
          </CardDescription>
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
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="font-medium">Pagarás {service.price} créditos por este servicio.</p>
                  {!hasSufficientCredits && (
                    <p className="text-red-500 mt-2">
                      No tienes suficientes créditos. Necesitas {service.price - (user?.credits || 0)} créditos adicionales.
                    </p>
                  )}
                </div>
                
                <Button
                  className="w-full"
                  disabled={!hasSufficientCredits || isProcessing}
                  onClick={handleCreditPayment}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      Confirmar Pago con Créditos
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="stripe" className="pt-4">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md">
                  <p className="font-medium">Pagarás ${(service.price * 4).toFixed(2)} USD por este servicio.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Serás redirigido a la plataforma segura de Stripe para completar el pago.
                  </p>
                </div>
                
                <Button
                  className="w-full"
                  disabled={isProcessing}
                  onClick={handleStripePayment}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      Pagar con Tarjeta
                      <CreditCard className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
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
};

export default ServicePayment;
