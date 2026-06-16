'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export type UserRole = 'super_admin' | 'admin' | 'editor' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
  isAdmin: false,
  isSuperAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();
  const manualSignOutRef = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, is_active, created_at, updated_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[AuthContext] Failed to fetch profile:', error.message);
    }

    if (data) {
      setProfile(data as UserProfile);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (cancelled) return;
        setUser(authUser);

        if (authUser) {
          await fetchProfile(authUser.id);
        }
      } catch (err) {
        console.error('[AuthContext] initAuth failed:', err);
        if (!cancelled) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const timeout = setTimeout(() => {
      if (!cancelled) {
        console.warn('[AuthContext] Auth init timed out after 15s');
        setLoading(false);
      }
    }, 15000);

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return;
      const currentUser = session?.user ?? null;

      if (event === 'TOKEN_REFRESHED' && !session) {
        console.warn('[AuthContext] Token refresh failed, forcing sign out');
        await supabase.auth.signOut();
        manualSignOutRef.current = false;
        setUser(null);
        setProfile(null);
        queryClient.clear();
        router.push('/admin/login?reason=session_expired');
        return;
      }

      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
        queryClient.invalidateQueries();
      } else {
        setProfile(null);
        queryClient.clear();

        if (!manualSignOutRef.current) {
          router.push('/admin/login?reason=session_expired');
        }
        manualSignOutRef.current = false;
      }
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile, queryClient]);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    if (data.user) {
      setUser(data.user);
      await fetchProfile(data.user.id);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('is_active')
        .eq('id', data.user.id)
        .single();

      if (profileData && !profileData.is_active) {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        throw new Error('Akun Anda telah dinonaktifkan. Hubungi administrator.');
      }

      router.push('/admin/dashboard');
    }
  };

  const signOut = async () => {
    manualSignOutRef.current = true;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/admin/login');
  };

  const role = profile?.role;
  const isAdmin = role === 'super_admin' || role === 'admin';
  const isSuperAdmin = role === 'super_admin';

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signOut,
      refreshProfile,
      isAdmin,
      isSuperAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
