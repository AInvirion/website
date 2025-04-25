
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useServicePayment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const initiateServicePayment = (serviceId: string, servicePrice: number) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!user.credits || user.credits < servicePrice) {
      toast("Créditos insuficientes", {
        description: "No tienes suficientes créditos para este servicio",
        action: {
          label: "Comprar créditos",
          onClick: () => navigate("/dashboard/creditos")
        }
      });
      return;
    }

    navigate(`/dashboard/servicios/${serviceId}/pagar`);
  };

  return { initiateServicePayment };
};
