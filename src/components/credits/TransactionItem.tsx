
import { Card, CardContent } from "@/components/ui/card";
import { CreditTransaction, TransactionType } from "@/types/credits";
import { ShieldAlert, ShieldCheck, Clock, DollarSign, CreditCard, MinusCircle, PlusCircle } from "lucide-react";

interface TransactionItemProps {
  transaction: CreditTransaction;
  formatDate: (dateString: string) => string;
}

// Función auxiliar para obtener el texto y color según el tipo de transacción
const getTransactionDetails = (type: TransactionType, amount: number) => {
  const isPositive = amount > 0;
  
  switch (type) {
    case 'purchase':
      return { 
        text: "Compra de créditos", 
        colorClass: "text-green-600",
        icon: <PlusCircle className="h-4 w-4 text-green-600" />
      };
    case 'service_payment':
      return { 
        text: "Pago por servicio", 
        colorClass: "text-orange-600",
        icon: <CreditCard className="h-4 w-4 text-orange-600" />
      };
    case 'consumption':
    case 'usage':
      return { 
        text: "Uso de créditos", 
        colorClass: "text-orange-600",
        icon: <MinusCircle className="h-4 w-4 text-orange-600" />
      };
    case 'addition':
      return { 
        text: "Créditos añadidos", 
        colorClass: "text-green-600",
        icon: <PlusCircle className="h-4 w-4 text-green-600" />
      };
    case 'payment_failed':
      return { 
        text: "Pago fallido", 
        colorClass: "text-red-600",
        icon: <ShieldAlert className="h-4 w-4 text-red-600" />
      };
    case 'session_expired':
      return { 
        text: "Sesión expirada", 
        colorClass: "text-gray-600",
        icon: <Clock className="h-4 w-4 text-gray-600" />
      };
    default:
      return { 
        text: isPositive ? "Adición de créditos" : "Uso de créditos", 
        colorClass: isPositive ? "text-green-600" : "text-orange-600",
        icon: isPositive ? <PlusCircle className="h-4 w-4 text-green-600" /> : <MinusCircle className="h-4 w-4 text-orange-600" />
      };
  }
};

export function TransactionItem({ transaction, formatDate }: TransactionItemProps) {
  const { text, colorClass, icon } = getTransactionDetails(transaction.type as TransactionType, transaction.amount);
  const showAmount = transaction.amount !== 0;
  
  return (
    <Card>
      <CardContent className="flex justify-between items-center py-4">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <p className="font-medium">{text}</p>
            <p className="text-xs text-gray-500">
              {transaction.created_at ? formatDate(transaction.created_at) : 'Fecha no disponible'}
            </p>
          </div>
        </div>
        {showAmount && (
          <div className={`font-bold ${colorClass}`}>
            {transaction.amount > 0 ? '+' : ''}{transaction.amount} créditos
          </div>
        )}
      </CardContent>
    </Card>
  );
}
