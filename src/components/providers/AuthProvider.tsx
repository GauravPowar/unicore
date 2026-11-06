// ============================================================
// AuthProvider – Session & Realtime Auth Management
// Connects Supabase Auth with fallback to mock researcher session
// ============================================================
'use client';

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isUsingMockData, MOCK_PROFILES } from '@/lib/mock-data';
import type { Profile } from '@/types';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isMock: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: false,
  isMock: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const isMock = isUsingMockData();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(() => (isMock ? MOCK_PROFILES[0] : null));
  const [isLoading, setIsLoading] = useState(false);

  const signOut = useCallback(async () => {
    if (!isMock) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    setUser(null);
    setProfile(null);
  }, [isMock]);

  useEffect(() => {
    if (isMock) return;

    let isMounted = true;
    const supabase = createClient();

    const fetchSession = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!isMounted) return;
        setUser(currentUser);

        if (currentUser) {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

          if (isMounted && userProfile) {
            setProfile(userProfile as Profile);
          }
        }
      } catch {
        // network or unauthenticated
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      const authUser = session?.user ?? null;
      setUser(authUser);
      if (authUser) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (isMounted && userProfile) setProfile(userProfile as Profile);
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isMock]);

  const value = useMemo(
    () => ({ user, profile, isLoading, isMock, signOut }),
    [user, profile, isLoading, isMock, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
