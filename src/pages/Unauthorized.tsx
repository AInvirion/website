
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-red-600">Acceso Denegado</h1>
        <p className="text-gray-600">
          No tienes permiso para acceder a esta sección.
        </p>
        <div className="flex justify-center space-x-4">
          <Button onClick={() => navigate(-1)}>Volver</Button>
          <Button variant="outline" onClick={() => navigate("/")}>
            Ir al inicio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
