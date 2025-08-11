import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role?: string;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Get session from Supabase on mount
  useEffect(() => {
    // Check if Supabase is properly configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl === 'undefined') {
      console.warn('Supabase not configured. Authentication will not work.');
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        setToken(session.access_token);
        localStorage.setItem('supabase_token', session.access_token);
      }
    }).catch(error => {
      console.warn('Error getting Supabase session:', error);
    });

    // Listen for auth changes - but don't clear token if we have one saved
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token) {
        setToken(session.access_token);
        localStorage.setItem('supabase_token', session.access_token);
      } else if (event === 'SIGNED_OUT') {
        setToken(null);
        localStorage.removeItem('supabase_token');
        queryClient.clear(); // Clear all cached data on logout
      }
      // Don't clear token on other events like TOKEN_REFRESHED that might not have session
    });

    // Check for existing token in localStorage on mount
    const savedToken = localStorage.getItem('supabase_token');
    if (savedToken) {
      setToken(savedToken);
    }

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user", token],
    retry: false,
    enabled: !!token,
    queryFn: () => {
      return fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch user');
        }
        return res.json();
      });
    },
  });

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Sign in failed');
      }
      
      const result = await response.json();
      if (result.session?.access_token) {
        setToken(result.session.access_token);
        localStorage.setItem('supabase_token', result.session.access_token);
      }
      return result;
    },
    onSuccess: (result) => {
      // Give a small delay to ensure token is saved before reload
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  });

  const signUpMutation = useMutation({
    mutationFn: async ({ email, password, firstName, lastName }: { 
      email: string; 
      password: string; 
      firstName: string; 
      lastName: string;
    }) => {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Sign up failed');
      }
      
      return response.json();
    }
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (!response.ok) {
        throw new Error('Sign out failed');
      }
      
      await supabase.auth.signOut();
      setToken(null);
      localStorage.removeItem('supabase_token');
      queryClient.clear();
      
      return response.json();
    }
  });

  const isAuthenticated = !!user && !!token;

  return {
    user: user as AuthUser | undefined,
    isLoading: isLoading || signInMutation.isPending,
    isAuthenticated,
    token,
    signIn: signInMutation.mutate,
    signUp: signUpMutation.mutate,
    signOut: signOutMutation.mutate,
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    signInError: signInMutation.error?.message,
    signUpError: signUpMutation.error?.message,
  };
}
