
import { Button } from "@/components/ui/button";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg">Cargando...</p>
      </div>
    );
  }

  // Redirect authenticated users to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard/servicios" replace />;
  }

  // Show welcome page for non-authenticated users
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-4xl font-bold mb-6">Bienvenido a Nuestra Plataforma</h1>
        <p className="text-xl text-gray-600 mb-8">
          Una solución completa para gestionar tus servicios y administrar tus datos.
        </p>
        
        <div className="space-x-4">
          <Button asChild size="lg">
            <Link to="/auth">Iniciar Sesión</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
