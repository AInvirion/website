
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { TransactionItem } from "./TransactionItem";
import { useCreditTransactions } from "@/hooks/useCreditTransactions";

interface CreditTransactionHistoryProps {
  userId: string | undefined;
}

export function CreditTransactionHistory({ userId }: CreditTransactionHistoryProps) {
  const { data: transactions, isLoading } = useCreditTransactions(userId);
  
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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Historial de Transacciones</h2>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin h-8 w-8 text-primary" />
        </div>
      ) : transactions && transactions.length > 0 ? (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              formatDate={formatDate}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No hay transacciones para mostrar
          </CardContent>
        </Card>
      )}
    </div>
  );
}
