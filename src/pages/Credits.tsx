
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

        {/* Enlace al historial de transacciones */}
        <div className="md:col-span-2">
          <a
            href="/dashboard/historial"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Ver historial de transacciones
          </a>
        </div>
      </div>
    </div>
  );
};

export default Credits;
