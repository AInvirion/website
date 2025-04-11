
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUserData } = useAuth();
  const sessionId = searchParams.get("session_id");
  const [isVerifying, setIsVerifying] = useState(true);
  const [retries, setRetries] = useState(0);

  // Verify the payment status
  const verifyPayment = async () => {
    try {
      // Actual verification
      if (sessionId) {
        console.log("Verifying payment with session ID:", sessionId);
      }
      
      // Wait for a moment to give webhook time to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh user data to get updated credit balance
      await refreshUserData();
      return true;
    } catch (error) {
      console.error("Error verifying payment:", error);
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  // Query for recent transaction associated with this session ID or just the most recent one
  const { data: recentTransaction, isLoading, refetch } = useQuery({
    queryKey: ["recent-transaction", user?.id, sessionId, retries],
    queryFn: async () => {
      if (!user?.id) return null;

      let query = supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user.id);
      
      // If we have a session ID from Stripe, use it to find the specific transaction
      if (sessionId) {
        query = query.eq("reference_id", sessionId);
      }
        
      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code === "PGRST116") {
        // "No rows returned" error - this is OK, transaction might not be recorded yet
        console.log("No transaction found yet, may need to wait for webhook processing");
        return null;
      }
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !isVerifying,
    refetchInterval: recentTransaction ? false : 5000, // Poll every 5 seconds until we find a transaction
    refetchIntervalInBackground: true,
    retry: 3,
  });

  const handleRefresh = async () => {
    toast("Actualizando datos...", { duration: 2000 });
    await refreshUserData();
    setRetries(prev => prev + 1);
    refetch();
  };

  useEffect(() => {
    if (sessionId || user?.id) {
      verifyPayment();
    } else {
      setIsVerifying(false);
    }
  }, [sessionId, user?.id]);

  if (isVerifying || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h2 className="text-2xl font-bold">Verificando tu pago...</h2>
        <p className="text-gray-500 mt-2">Esto puede tomar unos momentos.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-lg border-green-100 bg-gradient-to-br from-white to-green-50">
        <CardHeader className="pb-0">
          <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-center text-2xl font-bold">¡Pago Completado!</CardTitle>
        </CardHeader>
        <CardContent className="text-center pt-4 pb-6">
          <p className="text-gray-600 mb-6">
            Tu pago ha sido procesado correctamente y los créditos serán añadidos a tu cuenta pronto.
          </p>

          {recentTransaction ? (
            <div className="bg-white rounded-lg p-6 border border-green-100 mb-6">
              <h3 className="font-medium text-gray-800 mb-2">Detalles de la transacción:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <p className="text-gray-500 text-left">Cantidad:</p>
                <p className="font-semibold text-right">{recentTransaction.amount} créditos</p>
                <p className="text-gray-500 text-left">Fecha:</p>
                <p className="font-semibold text-right">
                  {new Date(recentTransaction.created_at).toLocaleDateString()}
                </p>
                <p className="text-gray-500 text-left">Estado:</p>
                <p className="font-semibold text-right text-green-600">Completado</p>
                {recentTransaction.reference_id && (
                  <>
                    <p className="text-gray-500 text-left">Referencia:</p>
                    <p className="font-semibold text-right text-xs truncate" title={recentTransaction.reference_id}>
                      {recentTransaction.reference_id.substring(0, 16)}...
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-100 mb-6">
              <h3 className="font-medium text-gray-800 mb-2">Procesando transacción...</h3>
              <p className="text-sm text-gray-600 mb-3">
                Tu pago está siendo procesado. Puede tomar unos momentos para que los créditos se reflejen en tu cuenta.
              </p>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Actualizar datos
              </Button>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 text-blue-800 text-sm">
            <p>Tu saldo de créditos: <span className="font-bold">{user?.credits || 0} créditos</span></p>
            {!recentTransaction && (
              <p className="text-xs mt-1 text-blue-600">
                Si tu saldo no se ha actualizado, espera unos minutos y actualiza la página.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button className="w-full" onClick={() => navigate("/dashboard/servicios")}>
            Explorar Servicios
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard/creditos")}>
            Ver Historial de Créditos
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
