
import { Session, User as SupabaseUser } from "@supabase/supabase-js";

// Export the Supabase User type for components that need it
export type { SupabaseUser as User };

export type AppRole = "usuario" | "admin";

export interface UserWithRole extends SupabaseUser {
  role?: AppRole;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  credits?: number;
}

export interface AuthState {
  session: Session | null;
  user: UserWithRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
