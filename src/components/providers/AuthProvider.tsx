// ============================================================
// AuthProvider – Session & Realtime Auth Management
// 100% Live Supabase Auth (Zero Mock Data)
// ============================================================
'use client';

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  isMock: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signOut = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    const syncProfile = async (targetUser: User | null) => {
      if (!targetUser) {
        setProfile(null);
        return;
      }

      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUser.id)
        .maybeSingle();

      if (!isMounted) return;

      if (userProfile) {
        setProfile({
          ...(userProfile as Profile),
          username: targetUser.user_metadata?.username || userProfile.username || null,
          links: targetUser.user_metadata?.links || userProfile.links || null,
        });
      } else {
        // Self-heal: ensure profile exists in database for this authenticated user
        const isAcademic = Boolean(
          targetUser.email &&
            (targetUser.email.endsWith('.ac.in') ||
              targetUser.email.endsWith('.edu.in') ||
              targetUser.email.endsWith('.res.in'))
        );
        const fallbackProfile: Profile = {
          id: targetUser.id,
          full_name:
            targetUser.user_metadata?.full_name ||
            targetUser.email?.split('@')[0] ||
            'Researcher',
          institution: targetUser.user_metadata?.institution || null,
          department: targetUser.user_metadata?.department || null,
          city_state: null,
          bio: null,
          avatar_url: targetUser.user_metadata?.avatar_url || null,
          orcid_id: targetUser.user_metadata?.orcid_id || null,
          is_verified_researcher: isAcademic,
          collab_status:
            targetUser.user_metadata?.collab_status || 'open_to_collab',
          skills_offered: [],
          skills_needed: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          username: targetUser.user_metadata?.username || null,
          links: targetUser.user_metadata?.links || null,
        };

        try {
          await supabase.from('profiles').upsert(fallbackProfile);
        } catch {
          // ignore
        }

        if (isMounted) {
          setProfile(fallbackProfile);
        }
      }
    };

    const fetchSession = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!isMounted) return;
        setUser(currentUser);
        await syncProfile(currentUser);
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
      await syncProfile(authUser);
    });

    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Profile>;
      if (customEvent.detail) {
        setProfile((prev) => ({
          ...(prev || {}),
          ...customEvent.detail,
        } as Profile));
      } else {
        fetchSession();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('researchsetu:profile_updated', handleProfileUpdate);
    }

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('researchsetu:profile_updated', handleProfileUpdate);
      }
    };
  }, []);

  const value = useMemo(
    () => ({ user, profile, isLoading, isMock: false, signOut }),
    [user, profile, isLoading, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
