
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CreditPackage, CreditTransaction } from "@/types/credits";

const Credits = () => {
  const { user } = useAuth();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  // Consultar paquetes de créditos - Tipo explícito
  const { data: creditPackages, isLoading: isLoadingPackages } = useQuery({
    queryKey: ["credit-packages"],
    queryFn: async () => {
      // Usamos any para evitar el error de tipado con las tablas generadas
      const { data, error } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("is_active", true)
        .order("credits", { ascending: true });

      if (error) throw error;
      return data as CreditPackage[]; // Cast explícito al tipo correcto
    },
  });

  // Consultar historial de transacciones - Tipo explícito
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["credit-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as CreditTransaction[]; // Cast explícito al tipo correcto
    },
    enabled: !!user?.id,
  });

  // Función para iniciar el proceso de compra
  const handlePurchase = async (packageId: string) => {
    setSelectedPackage(packageId);
    setIsPurchasing(true);

    try {
      const origin = window.location.origin;

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          checkoutType: "package",
          packageId,
          origin,
        },
      });

      if (error) throw error;

      // Redirigir a la URL de checkout de Stripe
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No se pudo crear la sesión de pago");
      }
    } catch (error) {
      console.error("Error al iniciar el proceso de compra:", error);
      toast("Error al procesar la compra", {
        description: "Intenta nuevamente más tarde",
        className: "bg-red-500"
      });
    } finally {
      setIsPurchasing(false);
      setSelectedPackage(null);
    }
  };

  // Formatear precio en USD
  const formatPrice = (priceInCents: number): string => {
    return `$${(priceInCents / 100).toFixed(2)} USD`;
  };

  // Formatear fecha
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Obtener clase y texto según el tipo de transacción
  const getTransactionInfo = (transaction: CreditTransaction) => {
    const isPositive = transaction.amount > 0;
    
    let typeText = "";
    let colorClass = "";
    
    if (isPositive) {
      typeText = "Compra de créditos";
      colorClass = "text-green-600";
    } else {
      typeText = "Pago por servicio";
      colorClass = "text-orange-600";
    }
    
    return { typeText, colorClass };
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Créditos y Compras</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saldo actual */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <CardTitle className="text-2xl">Tu Saldo de Créditos</CardTitle>
            <CardDescription className="text-white text-opacity-80">
              Utiliza tus créditos para acceder a servicios
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-4xl font-bold">{user?.credits || 0} créditos</div>
            <p className="text-gray-500 mt-1">
              1 crédito = $4.00 USD para servicios
            </p>
          </CardContent>
        </Card>

        {/* Paquetes de créditos */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold mb-4">Comprar Créditos</h2>
          
          {isLoadingPackages ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {creditPackages?.map((pkg) => (
                <Card key={pkg.id} className={`transition-all ${selectedPackage === pkg.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{pkg.name}</span>
                      <span className="text-primary">{pkg.credits} créditos</span>
                    </CardTitle>
                    <CardDescription>
                      Ahorra en comparación con la compra individual
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatPrice(pkg.price)}</div>
                    <p className="text-sm text-gray-500">
                      {pkg.credits > 1 ? `${(pkg.price / pkg.credits / 100).toFixed(2)} USD por crédito` : ""}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={isPurchasing}
                    >
                      {isPurchasing && selectedPackage === pkg.id ? (
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
              ))}
            </div>
          )}
        </div>

        {/* Historial de transacciones */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold mb-4">Historial de Transacciones</h2>
          
          {isLoadingTransactions ? (
            <div className="flex justify-center p-8">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const { typeText, colorClass } = getTransactionInfo(transaction);
                
                return (
                  <Card key={transaction.id}>
                    <CardContent className="flex justify-between items-center py-4">
                      <div>
                        <p className="font-medium">{typeText}</p>
                        <p className="text-xs text-gray-500">{transaction.created_at ? formatDate(transaction.created_at) : 'Fecha no disponible'}</p>
                      </div>
                      <div className={`font-bold ${colorClass}`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount} créditos
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-gray-500">
                No hay transacciones para mostrar
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Credits;
