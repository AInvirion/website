
import { Session, User } from "@supabase/supabase-js";

export type AppRole = "usuario" | "admin";

export interface UserWithRole extends User {
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
