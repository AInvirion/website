
import { useAuth } from "@/contexts/AuthContext";
import { CreditBalance } from "@/components/credits/CreditBalance";
import { CreditPackageList } from "@/components/credits/CreditPackageList";
import { CreditTransactionHistory } from "@/components/credits/CreditTransactionHistory";

const Credits = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Créditos y Compras</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saldo actual */}
        <CreditBalance user={user} />

        {/* Paquetes de créditos */}
        <CreditPackageList />

        {/* Historial de transacciones */}
        <CreditTransactionHistory userId={user?.id} />
      </div>
    </div>
  );
};

export default Credits;
