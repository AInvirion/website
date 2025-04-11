
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
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      setUserFromSession(session);
      setIsLoading(false);
    };

    getSession();

    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change event:', event);
      setUserFromSession(session);
    });
  }, []);

  const setUserFromSession = async (session: Session | null) => {
    if (session?.user) {
      setIsAuthenticated(true);
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setUser(null);
        } else {
          const userWithProfile: UserWithRole = {
            ...session.user,
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || '',
            avatar_url: profile?.avatar_url || '',
            role: profile?.role || 'usuario',
            credits: profile?.credits || 0,
          };
          setUser(userWithProfile);
        }
      } catch (error) {
        console.error('Error setting user from session:', error);
        setUser(null);
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setIsLoading(false);
  };

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

      // After successful signup, update the profile table
      if (data.user?.id) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              first_name: firstName,
              last_name: lastName,
              email,
              avatar_url: '',
              credits: 0,
              role: 'usuario',
            },
          ]);

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // Handle the error appropriately, maybe sign out the user
          await signOut();
          alert('Error creating profile: ' + profileError.message);
          return;
        }
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

  // Refresh user data from the database
  const refreshUserData = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching updated user data:', error);
        return;
      }
      
      if (data) {
        setUser(prevUser => ({
          ...prevUser,
          ...data
        }));
        
        console.log('User data refreshed successfully:', data);
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
    signUp,
    signOut,
    hasRole,
    refreshUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
