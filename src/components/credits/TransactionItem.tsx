
import { Card, CardContent } from "@/components/ui/card";
import { CreditTransaction } from "@/types/credits";

interface TransactionItemProps {
  transaction: CreditTransaction;
  formatDate: (dateString: string) => string;
}

export function TransactionItem({ transaction, formatDate }: TransactionItemProps) {
  const isPositive = transaction.amount > 0;
  const typeText = isPositive ? "Compra de créditos" : "Pago por servicio";
  const colorClass = isPositive ? "text-green-600" : "text-orange-600";
  
  return (
    <Card>
      <CardContent className="flex justify-between items-center py-4">
        <div>
          <p className="font-medium">{typeText}</p>
          <p className="text-xs text-gray-500">
            {transaction.created_at ? formatDate(transaction.created_at) : 'Fecha no disponible'}
          </p>
        </div>
        <div className={`font-bold ${colorClass}`}>
          {transaction.amount > 0 ? '+' : ''}{transaction.amount} créditos
        </div>
      </CardContent>
    </Card>
  );
}
