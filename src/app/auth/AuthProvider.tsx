import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { supabase } from "@/app/services/supabaseClient";
import type { Profile, UserRole } from "@/app/auth/authTypes";

type SignUpParams = {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
};

type SignUpResult = {
  needsEmailConfirmation: boolean;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(params: SignUpParams): Promise<SignUpResult>;
  signOut(): Promise<void>;
  refreshProfile(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("SELECT timeout after 5s")), 5000)
      );

      const queryPromise = supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", userId)
        .maybeSingle();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as {
        data: Profile | null;
        error: Error | null;
      };

      if (error) throw error;
      if (data) return data;
    } catch {}

    if (attempt < 3) {
      await sleep(250 * (attempt + 1));
    }
  }

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    const profileRow = await fetchProfile(user.id);
    setProfile(profileRow);
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const nextSession = data.session ?? null;
        const nextUser = nextSession?.user ?? null;

        if (!cancelled) {
          setSession(nextSession);
          setUser(nextUser);
        }

        if (nextUser?.id) {
          try {
            const profileRow = await fetchProfile(nextUser.id);
            if (!cancelled) setProfile(profileRow);
          } catch {
            if (!cancelled) setProfile(null);
          }
        } else if (!cancelled) {
          setProfile(null);
        }
      } catch {
        if (!cancelled) {
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, nextSession: Session | null) => {
        if (cancelled) return;

        setSession(nextSession);
        const nextUser = nextSession?.user ?? null;
        setUser(nextUser);

        if (!nextUser?.id) {
          setProfile(null);
          return;
        }

        try {
          const profileRow = await fetchProfile(nextUser.id);
          if (!cancelled) setProfile(profileRow);
        } catch {
          if (!cancelled) setProfile(null);
        }
      },
    );

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      session,
      user,
      profile,
      loading,
      async signIn(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      },
      async signUp({ email, password, fullName, role }: SignUpParams) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role },
          },
        });
        if (error) throw error;

        return { needsEmailConfirmation: !data.session };
      },
      async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
      refreshProfile,
    };
  }, [loading, profile, refreshProfile, session, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
