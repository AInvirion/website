
import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CreditPaymentOptionProps {
  servicePrice: number;
  hasSufficientCredits: boolean;
  isProcessing: boolean;
  onPayWithCredits: () => Promise<void>;
  userCredits?: number;
}

export function CreditPaymentOption({ 
  servicePrice, 
  hasSufficientCredits, 
  isProcessing, 
  onPayWithCredits,
  userCredits = 0
}: CreditPaymentOptionProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-gray-50 rounded-md">
        <p className="font-medium">Pagarás {servicePrice} créditos por este servicio.</p>
        {!hasSufficientCredits && (
          <p className="text-red-500 mt-2">
            No tienes suficientes créditos. Necesitas {servicePrice - userCredits} créditos adicionales.
          </p>
        )}
      </div>
      
      <Button
        className="w-full"
        disabled={!hasSufficientCredits || isProcessing}
        onClick={onPayWithCredits}
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
  );
}
