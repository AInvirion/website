import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CreditPackageCard } from "./CreditPackageCard";
import { useCreditPackages } from "@/hooks/useCreditPackages";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function CreditPackageList() {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const { data: creditPackages, isLoading } = useCreditPackages();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Format price in USD
  const formatPrice = (priceInCents: number): string => {
    return `$${(priceInCents / 100).toFixed(2)} USD`;
  };

  // Function to start the purchase process
  const handlePurchase = async (packageId: string) => {
    // Verify if user is authenticated
    if (!isAuthenticated || !user) {
      console.log("User not authenticated, redirecting to login");
      toast("Login required", {
        description: "You need to log in to purchase credits",
        className: "bg-blue-500"
      });
      navigate("/auth");
      return;
    }

    setSelectedPackage(packageId);
    setIsPurchasing(true);

    try {
      const origin = window.location.origin;
      
      console.log("Starting purchase process for package:", packageId);
      console.log("Origin URL:", origin);
      console.log("Authenticated user:", user.id);

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          checkoutType: "package",
          packageId,
          origin,
        },
      });

      if (error) {
        console.error("Error invoking create-checkout function:", error);
        throw error;
      }

      if (!data?.url) {
        console.error("No checkout URL received in response:", data);
        throw new Error("Could not create payment session");
      }

      console.log("Checkout URL received:", data.url);
      // Redirect to Stripe checkout URL
      window.location.href = data.url;
    } catch (error) {
      console.error("Detailed error when starting purchase process:", error);
      toast("Error processing purchase", {
        description: "Please try again later or contact support",
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
