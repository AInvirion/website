
import { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AuthState, AppRole, UserWithRole } from "@/types/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";

interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState>({
    session: null,
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Función para cargar los roles del usuario
  const fetchUserRoles = async (userId: string) => {
    try {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching user roles:", error);
        return [];
      }

      return roles.map((r) => r.role) as AppRole[];
    } catch (error) {
      console.error("Error fetching user roles:", error);
      return [];
    }
  };

  // Función para cargar los detalles del perfil del usuario
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }

      return profile;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  // Actualizar el estado de autenticación cuando cambia la sesión
  useEffect(() => {
    const setUserWithDetails = async (session: Session | null) => {
      if (!session) {
        setAuthState({
          session: null,
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
        return;
      }

      // Obtener la información básica del usuario
      const user = session.user;

      // Si tenemos un usuario, obtenemos sus roles y perfil
      if (user) {
        // Debemos usar setTimeout para evitar un deadlock en el listener de eventos
        setTimeout(async () => {
          // Obtener roles y perfil en paralelo
          const [roles, profile] = await Promise.all([
            fetchUserRoles(user.id),
            fetchUserProfile(user.id),
          ]);

          // Crear un objeto de usuario extendido con roles y detalles del perfil
          const userWithRole: UserWithRole = {
            ...user,
            roles,
            firstName: profile?.first_name,
            lastName: profile?.last_name,
            avatarUrl: profile?.avatar_url,
            credits: profile?.credits,
          };

          setAuthState({
            session,
            user: userWithRole,
            isLoading: false,
            isAuthenticated: true,
          });
        }, 0);
      } else {
        setAuthState({
          session,
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    // Verificar si ya existe una sesión
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserWithDetails(session);
    });

    // Escuchar cambios en el estado de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUserWithDetails(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Iniciar sesión con Google
  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error("Error signing in with Google:", error);
        toast.error("Error al iniciar sesión con Google");
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      toast.error("Error al iniciar sesión con Google");
    }
  };

  // Cerrar sesión
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast.success("Has cerrado sesión correctamente");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Error al cerrar sesión");
    }
  };

  // Verificar si el usuario tiene un rol específico
  const hasRole = (role: AppRole) => {
    return authState.user?.roles?.includes(role) || false;
  };

  const value = {
    ...authState,
    signInWithGoogle,
    signOut,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
