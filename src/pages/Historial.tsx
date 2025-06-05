import { useAuth } from "@/contexts/AuthContext";
import { CreditTransactionHistory } from "@/components/credits/CreditTransactionHistory";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Historial = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Historial de Transacciones</h1>
      <div className="mb-4">
        <Button variant="outline" onClick={() => navigate("/dashboard/creditos")}>
          Volver a Créditos
        </Button>
      </div>
      <CreditTransactionHistory userId={user?.id} />
    </div>
  );
};

export default Historial;