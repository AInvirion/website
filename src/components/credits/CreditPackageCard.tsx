
import { useState } from "react";
import { CreditPackage } from "@/types/credits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Loader2 } from "lucide-react";

interface CreditPackageCardProps {
  creditPackage: CreditPackage;
  isPurchasing: boolean;
  selectedPackage: string | null;
  onPurchase: (packageId: string) => void;
  formatPrice: (priceInCents: number) => string;
}

export function CreditPackageCard({
  creditPackage,
  isPurchasing,
  selectedPackage,
  onPurchase,
  formatPrice
}: CreditPackageCardProps) {
  const isSelected = selectedPackage === creditPackage.id;
  
  return (
    <Card className={`transition-all ${isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{creditPackage.name}</span>
          <span className="text-primary">{creditPackage.credits} créditos</span>
        </CardTitle>
        <CardDescription>
          Ahorra en comparación con la compra individual
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatPrice(creditPackage.price)}</div>
        <p className="text-sm text-gray-500">
          {creditPackage.credits > 1 ? 
            `${(creditPackage.price / creditPackage.credits / 100).toFixed(2)} USD por crédito` : ""}
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={() => onPurchase(creditPackage.id)}
          disabled={isPurchasing}
        >
          {isPurchasing && isSelected ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Comprar Ahora
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
