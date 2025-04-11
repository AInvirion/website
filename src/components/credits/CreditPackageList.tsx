
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CreditPackage } from "@/types/credits";
import { CreditPackageCard } from "./CreditPackageCard";
import { useCreditPackages } from "@/hooks/useCreditPackages";

export function CreditPackageList() {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const { data: creditPackages, isLoading } = useCreditPackages();

  // Formatear precio en USD
  const formatPrice = (priceInCents: number): string => {
    return `$${(priceInCents / 100).toFixed(2)} USD`;
  };

  // Función para iniciar el proceso de compra
  const handlePurchase = async (packageId: string) => {
    setSelectedPackage(packageId);
    setIsPurchasing(true);

    try {
      const origin = window.location.origin;
      
      console.log("Iniciando proceso de compra para el paquete:", packageId);
      console.log("URL de origen:", origin);

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          checkoutType: "package",
          packageId,
          origin,
        },
      });

      if (error) {
        console.error("Error al invocar la función create-checkout:", error);
        throw error;
      }

      if (!data?.url) {
        console.error("No se recibió URL de checkout en la respuesta:", data);
        throw new Error("No se pudo crear la sesión de pago");
      }

      console.log("URL de checkout recibida:", data.url);
      // Redirigir a la URL de checkout de Stripe
      window.location.href = data.url;
    } catch (error) {
      console.error("Error detallado al iniciar el proceso de compra:", error);
      toast("Error al procesar la compra", {
        description: "Intenta nuevamente más tarde",
        className: "bg-red-500"
      });
    } finally {
      setIsPurchasing(false);
      setSelectedPackage(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Comprar Créditos</h2>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {creditPackages?.map((pkg) => (
            <CreditPackageCard
              key={pkg.id}
              creditPackage={pkg}
              isPurchasing={isPurchasing}
              selectedPackage={selectedPackage}
              onPurchase={handlePurchase}
              formatPrice={formatPrice}
            />
          ))}
        </div>
      )}
    </div>
  );
}
