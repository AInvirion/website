
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

const Auth = () => {
  const { signIn, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Cargando...
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Iniciar Sesión</h1>
          <p className="mt-2 text-gray-600">
            Accede a tu cuenta para continuar
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => signIn("example@email.com")}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 py-6"
          >
            <FcGoogle className="w-5 h-5" />
            <span>Iniciar sesión con Email</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
