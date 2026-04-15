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

function deriveProfileFromUser(user: User | null): Profile | null {
  if (!user?.id) return null;

  const meta = user.user_metadata as {
    full_name?: unknown;
    role?: unknown;
  } | null;

  const role = meta?.role === "teacher" ? "teacher" : "student";
  const fullName =
    typeof meta?.full_name === "string" && meta.full_name.trim()
      ? meta.full_name.trim()
      : null;

  return {
    id: user.id,
    full_name: fullName,
    role,
  };
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("PROFILE_FETCH_TIMEOUT")), 5000)
      );

      const queryPromise = (async () => {
        const { data: rpcData, error: rpcError } = await supabase
          .rpc("get_my_profile");

        if (rpcError) throw rpcError;

        const profileRow = Array.isArray(rpcData) ? rpcData[0] ?? null : rpcData;
        return profileRow as Profile | null;
      })();

      const profileRow = await Promise.race([
        queryPromise,
        timeoutPromise,
      ]) as Profile | null;

      if (profileRow) return profileRow;
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
    setProfile(profileRow ?? deriveProfileFromUser(user));
  }, [user?.id]);

  const syncSessionState = useCallback(
    async (nextSession: Session | null) => {
      const nextUser = nextSession?.user ?? null;
      const fallbackProfile = deriveProfileFromUser(nextUser);

      setLoading(true);
      setSession(nextSession);
      setUser(nextUser);

      if (!nextUser?.id) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile((currentProfile) => {
        if (currentProfile?.id === nextUser.id) return currentProfile;
        return fallbackProfile;
      });
      setLoading(false);

      try {
        const profileRow = await fetchProfile(nextUser.id);
        if (profileRow) {
          setProfile(profileRow);
        }
      } catch {
        setProfile((currentProfile) => currentProfile ?? fallbackProfile);
      }
    },
    [setLoading],
  );

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!cancelled) {
          await syncSessionState(data.session ?? null);
        }
      } catch {
        if (!cancelled) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, nextSession: Session | null) => {
        if (cancelled) return;
        await syncSessionState(nextSession);
      },
    );

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [syncSessionState]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      session,
      user,
      profile,
      loading,
      async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        await syncSessionState(data.session ?? null);
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
  }, [loading, profile, refreshProfile, session, syncSessionState, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
