
import { Session, User } from "@supabase/supabase-js";

export type AppRole = "usuario" | "admin";

export interface UserWithRole extends User {
  roles?: AppRole[];
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  credits?: number;
}

export interface AuthState {
  session: Session | null;
  user: UserWithRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
