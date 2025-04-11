
import { Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StripePaymentOptionProps {
  servicePrice: number;
  isProcessing: boolean;
  onPayWithStripe: () => Promise<void>;
}

export function StripePaymentOption({ 
  servicePrice, 
  isProcessing, 
  onPayWithStripe 
}: StripePaymentOptionProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-md">
        <p className="font-medium">Pagarás ${(servicePrice * 4).toFixed(2)} USD por este servicio.</p>
        <p className="text-sm text-gray-500 mt-2">
          Serás redirigido a la plataforma segura de Stripe para completar el pago.
        </p>
      </div>
      
      <Button
        className="w-full"
        disabled={isProcessing}
        onClick={onPayWithStripe}
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
  );
}
