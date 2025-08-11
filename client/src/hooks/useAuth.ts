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
  const [authBlocked, setAuthBlocked] = useState(false);
  const queryClient = useQueryClient();

  // Get session from Supabase on mount
  useEffect(() => {
    // Check for existing token in localStorage first
    const savedToken = localStorage.getItem('supabase_token');
    if (savedToken) {
      setToken(savedToken);
      setAuthBlocked(false); // Ensure auth is not blocked for saved tokens
    }

    // Check if Supabase is properly configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl === 'undefined') {
      console.warn('Supabase not configured. Authentication will not work.');
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        setToken(session.access_token);
        setAuthBlocked(false);
        localStorage.setItem('supabase_token', session.access_token);
      }
    }).catch(error => {
      console.warn('Error getting Supabase session:', error);
    });

    // Listen for auth changes - but don't clear token if we have one saved
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token) {
        setToken(session.access_token);
        setAuthBlocked(false);
        localStorage.setItem('supabase_token', session.access_token);
      } else if (event === 'SIGNED_OUT') {
        setToken(null);
        setAuthBlocked(false);
        localStorage.removeItem('supabase_token');
        queryClient.clear(); // Clear all cached data on logout
      }
      // Don't clear token on other events like TOKEN_REFRESHED that might not have session
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user", token],
    retry: false,
    enabled: !!token,
    queryFn: async () => {
      if (!token) return null;
      
      try {
        const res = await fetch('/api/auth/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.status === 401) {
          // Token is invalid, clear everything and block further requests
          console.log('401 error - clearing auth and blocking further requests');
          setToken(null);
          setAuthBlocked(true);
          localStorage.removeItem('supabase_token');
          queryClient.clear();
          return null;
        }
        
        if (!res.ok) {
          throw new Error('Failed to fetch user');
        }
        
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch (parseError) {
          console.error('Failed to parse JSON response:', text);
          throw new Error('Invalid JSON response from server');
        }
      } catch (error) {
        console.error('Auth error:', error);
        // Only clear token on network errors, not all errors
        if (error instanceof TypeError) {
          // Network error - clear token
          setToken(null);
          setAuthBlocked(true);
          localStorage.removeItem('supabase_token');
          queryClient.clear();
        }
        return null;
      }
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
      
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('Sign in - Failed to parse JSON response:', text);
        throw new Error('Invalid response from server');
      }
      if (result.session?.access_token) {
        setToken(result.session.access_token);
        setAuthBlocked(false);
        localStorage.setItem('supabase_token', result.session.access_token);
      }
      return result;
    },
    onSuccess: (result) => {
      // Reset auth block on successful sign in
      setAuthBlocked(false);
      // Invalidate queries to refetch user data with new token
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
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
        const text = await response.text();
        let error;
        try {
          error = JSON.parse(text);
        } catch (parseError) {
          console.error('Sign up error - Failed to parse JSON response:', text);
          error = { message: 'Server error' };
        }
        throw new Error(error.message || 'Sign up failed');
      }
      
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('Sign up - Failed to parse JSON response:', text);
        throw new Error('Invalid response from server');
      }
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
      setAuthBlocked(false); // Reset auth block on manual sign out
      localStorage.removeItem('supabase_token');
      queryClient.clear();
      
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error('Sign out - Failed to parse JSON response:', text);
        return { message: 'Signed out successfully' };
      }
    }
  });

  // Reset auth block when user manually tries to authenticate
  const resetAuth = () => {
    setAuthBlocked(false);
    setToken(null);
    localStorage.removeItem('supabase_token');
  };

  const isAuthenticated = !!user && !!token && !authBlocked;

  return {
    user: user as AuthUser | undefined,
    isLoading: isLoading || signInMutation.isPending,
    isAuthenticated,
    token,
    signIn: signInMutation.mutate,
    signUp: signUpMutation.mutate,
    signOut: signOutMutation.mutate,
    resetAuth,
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    signInError: signInMutation.error?.message,
    signUpError: signUpMutation.error?.message,
  };
}
