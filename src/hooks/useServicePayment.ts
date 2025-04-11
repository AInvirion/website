
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Service } from "@/types/service";
import { User } from "@/types/auth";

export function useServicePayment(serviceId: string | undefined, user: User | null) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"credits" | "stripe">("credits");
  const navigate = useNavigate();

  // Obtener datos del servicio
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

  // Verificar si el usuario tiene suficientes créditos
  const hasSufficientCredits = user?.credits && service?.price 
    ? user.credits >= service.price
    : false;

  // Manejar pago con créditos
  const handleCreditPayment = async () => {
    if (!service || !user?.id) return;
    
    if (!hasSufficientCredits) {
      toast("Créditos insuficientes", {
        description: "No tienes suficientes créditos para este servicio",
        className: "bg-red-500"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Registrar transacción de créditos
      const { error: transactionError } = await supabase
        .from("credit_transactions")
        .insert({
          user_id: user.id,
          amount: service.price, // Monto positivo, el tipo indica que es un gasto
          type: "service_payment",
          reference_id: service.id,
        });

      if (transactionError) throw transactionError;

      // Registrar la ejecución del servicio
      const { error: executionError } = await supabase
        .from("service_executions")
        .insert({
          service_id: service.id,
          user_id: user.id,
          credits_used: service.price,
          status: "completed",
        });

      if (executionError) throw executionError;

      // Mostrar mensaje de éxito
      toast("Pago con créditos completado", {
        description: `Has utilizado ${service.price} créditos para este servicio`,
        className: "bg-green-500"
      });

      // Redirigir al usuario
      navigate("/dashboard/historial");
      
    } catch (error) {
      console.error("Error al procesar el pago con créditos:", error);
      toast("Error al procesar el pago", {
        description: "Ha ocurrido un problema al procesar el pago con créditos",
        className: "bg-red-500"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Manejar pago con Stripe
  const handleStripePayment = async () => {
    if (!service || !user?.id) return;
    
    setIsProcessing(true);
    
    try {
      const origin = window.location.origin;

      console.log("Iniciando pago con Stripe para servicio:", service.id);
      console.log("URL de origen:", origin);

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

      // Redirigir a la URL de checkout de Stripe
      if (data?.url) {
        console.log("Redirigiendo a URL de Stripe:", data.url);
        window.location.href = data.url;
      } else {
        console.error("No se recibió URL de checkout en la respuesta:", data);
        throw new Error("No se pudo crear la sesión de pago");
      }
    } catch (error) {
      console.error("Error al iniciar el proceso de pago:", error);
      toast("Error al procesar el pago", {
        description: "Intenta nuevamente más tarde o contacta a soporte",
        className: "bg-red-500"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    service,
    isLoading,
    isProcessing,
    paymentMethod,
    setPaymentMethod,
    hasSufficientCredits,
    handleCreditPayment,
    handleStripePayment
  };
}
