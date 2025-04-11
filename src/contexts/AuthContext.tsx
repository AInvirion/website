import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { AppRole, UserWithRole } from '@/types/auth';

interface AuthContextType {
  user: UserWithRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const navigate = useNavigate();

  const ensureUserProfile = async (userId: string, userData?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  }) => {
    try {
      // First check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      // If there's no profile, create one
      if (!existingProfile && !checkError) {
        console.log('Creating new profile for user:', userId);
        const { error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            email: userData?.email || '',
            first_name: userData?.firstName || '',
            last_name: userData?.lastName || '',
            avatar_url: userData?.avatarUrl || '',
            credits: 0
          }]);
          
        if (createError) {
          console.error('Error creating profile:', createError);
        }
      } else if (checkError && checkError.code !== 'PGRST116') {
        // Only log real errors, not "no rows returned"
        console.error('Error checking profile:', checkError);
      }
      
      // Ensure user role exists
      const { data: existingRole, error: roleCheckError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (!existingRole && !roleCheckError) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([{
            user_id: userId,
            role: 'usuario'
          }]);
          
        if (roleError) {
          console.error('Error creating user role:', roleError);
        }
      }
    } catch (error) {
      console.error('Error in ensureUserProfile:', error);
    }
  };

  const setUserFromSession = async (session: Session | null) => {
    if (session?.user) {
      try {
        // Ensure profile exists first
        await ensureUserProfile(session.user.id, {
          email: session.user.email,
          firstName: session.user.user_metadata?.first_name,
          lastName: session.user.user_metadata?.last_name,
          avatarUrl: session.user.user_metadata?.avatar_url,
        });
        
        // Then fetch profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setUser({
            ...session.user,
            role: 'usuario'
          });
          setIsAuthenticated(true);
          return;
        }

        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (roleError && roleError.code !== 'PGRST116') {
          console.error('Error fetching user role:', roleError);
        }

        const userWithProfile: UserWithRole = {
          ...session.user,
          first_name: profile?.first_name || '',
          last_name: profile?.last_name || '',
          avatar_url: profile?.avatar_url || '',
          credits: profile?.credits || 0,
          role: userRole?.role || 'usuario'
        };
        
        setUser(userWithProfile);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error setting user from session:', error);
        // Still set user to avoid being locked out
        setUser({
          ...session.user,
          role: 'usuario'
        });
        setIsAuthenticated(true);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setIsLoading(false);
    setHasInitialized(true);
  };

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await setUserFromSession(session);
      } catch (error) {
        console.error('Error getting session:', error);
        setIsLoading(false);
        setHasInitialized(true);
      }
    };

    // Set up the auth state listener first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change event:', event);
      
      // Process auth state changes only after initial setup
      // or for sign-out which needs immediate processing
      if (hasInitialized || event === 'SIGNED_OUT') {
        await setUserFromSession(session);
      }
    });

    // Then get the current session
    getSession();

    return () => subscription.unsubscribe();
  }, [hasInitialized]);

  const signIn = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      alert('Check your email for the magic link to sign in.');
      navigate('/auth');
    } catch (error) {
      console.error('Error signing in:', error);
      alert('Error signing in: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      alert('Error signing in with Google: ' + error);
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string): Promise<void> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            avatar_url: '',
          },
        },
      });
      if (error) throw error;

      if (data.user?.id) {
        await ensureUserProfile(data.user.id, {
          email,
          firstName,
          lastName,
          avatarUrl: '',
        });
      }

      alert('Check your email for the verification link.');
      navigate('/auth');
    } catch (error) {
      console.error('Error signing up:', error);
      alert('Error signing up: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setIsAuthenticated(false);
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Error signing out: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return user?.role === role;
  };

  const refreshUserData = async () => {
    if (!user?.id) return;
    
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
      if (profileError) {
        console.error('Error fetching updated user data:', profileError);
        return;
      }
      
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleError && roleError.code !== 'PGRST116') {
        console.error('Error fetching user role:', roleError);
      }
      
      if (profile) {
        setUser(prevUser => ({
          ...prevUser!,
          ...profile,
          role: userRole?.role || 'usuario'
        }));
        
        console.log('User data refreshed successfully:', profile);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    hasRole,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
