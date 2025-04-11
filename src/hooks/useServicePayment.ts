import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Service } from "@/types/service";
import { UserWithRole } from "@/types/auth";

export function useServicePayment(serviceId: string | undefined, user: UserWithRole | null) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"credits" | "stripe">("credits");
  const navigate = useNavigate();

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
        className: "bg-red-500"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const { error: transactionError } = await supabase
        .from("credit_transactions")
        .insert({
          user_id: user.id,
          amount: service.price,
          type: "service_payment",
          reference_id: service.id,
        });

      if (transactionError) throw transactionError;

      const { error: executionError } = await supabase
        .from("service_executions")
        .insert({
          service_id: service.id,
          user_id: user.id,
          credits_used: service.price,
          status: "completed",
        });

      if (executionError) throw executionError;

      toast("Pago con créditos completado", {
        description: `Has utilizado ${service.price} créditos para este servicio`,
        className: "bg-green-500"
      });

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

  const handleStripePayment = async () => {
    if (!service || !user?.id) return;
    
    setIsProcessing(true);
    
    try {
      const origin = window.location.origin;

      console.log("Starting Stripe payment for service:", service.id);
      console.log("Origin URL:", origin);

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          checkoutType: "service",
          serviceId: service.id,
          origin,
        },
      });

      if (error) {
        console.error("Error invoking create-checkout function:", error);
        throw error;
      }

      if (data?.url) {
        console.log("Redirecting to Stripe URL:", data.url);
        window.location.href = data.url;
      } else {
        console.error("No checkout URL received in response:", data);
        throw new Error("Could not create payment session");
      }
    } catch (error) {
      console.error("Error starting payment process:", error);
      toast("Error processing payment", {
        description: "Please try again later or contact support",
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
