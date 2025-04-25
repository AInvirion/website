
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const useServicePayment = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const initiateServicePayment = (serviceId: string, servicePrice: number) => {
    if (!user) {
      console.log("No user authenticated, redirecting to auth page");
      navigate("/auth");
      return;
    }

    console.log(`Initiating service payment for service: ${serviceId}`);
    console.log(`User credits: ${user.credits}, Service price: ${servicePrice}`);

    if (!user.credits || user.credits < servicePrice) {
      console.log("Insufficient credits");
      toast("Créditos insuficientes", {
        description: "No tienes suficientes créditos para este servicio",
        action: {
          label: "Comprar créditos",
          onClick: () => navigate("/dashboard/creditos")
        }
      });
      return;
    }

    console.log("User has sufficient credits, navigating to payment page");
    navigate(`/dashboard/servicios/${serviceId}/pagar`);
  };

  return { initiateServicePayment };
};
