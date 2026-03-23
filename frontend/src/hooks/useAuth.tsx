"use client";

import { useAuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const { user, isLoading, signIn: contextSignIn, signUp: contextSignUp, signOut: contextSignOut } = useAuthContext();

  const signIn = async (email: string, password: string) => {
    try {
      await contextSignIn(email, password);
      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message || 'Login failed' } };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      await contextSignUp(email, password, fullName);
      return { data: { user: null }, error: null }; // Start with null user as auto-login might not happen or we redirect
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Signup failed' } };
    }
  };

  const signOut = async () => {
    contextSignOut();
  };

  return {
    user,
    session: user ? { user } : null, // Mock session object for compatibility
    loading: isLoading,
    signIn,
    signUp,
    signOut
  };
}
