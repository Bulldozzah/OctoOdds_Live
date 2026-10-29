import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, hasPaidAccess, type Profile } from "./supabase";

interface AuthValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** True until the first session + profile lookup settles. */
  loading: boolean;
  /** Recoverable profile load failure (network, RLS, missing row). */
  profileError: string | null;
  isAdmin: boolean;
  isSuperuser: boolean;
  /** Paywall off, or admin/superuser, or an active paid subscription. */
  hasAccess: boolean;
  /** Global app_settings flag. Fail-closed: true until it loads and if it can't be read. */
  paywallEnabled: boolean;
  refreshProfile: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** PostgREST reports an expired/invalid JWT as PGRST301 / 401. */
const isAuthError = (error: { code?: string; message?: string }): boolean =>
  error.code === "PGRST301" ||
  error.code === "401" ||
  /jwt|token|expired/i.test(error.message ?? "");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [paywallEnabled, setPaywallEnabled] = useState(true);
  // Starts true so the server render and the first client paint agree.
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setProfileError(null);
      return;
    }
    const fetchProfile = () => supabase.from("profiles").select("*").eq("id", userId).single();
    let { data, error } = await fetchProfile();

    // A restored session can carry an already-expired token: refresh once and retry.
    if (error && isAuthError(error)) {
      const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
      if (!refreshErr && refreshed.session) ({ data, error } = await fetchProfile());
    }

    if (!error) {
      setProfile(data as Profile);
      setProfileError(null);
      return;
    }
    setProfile(null);
    if (isAuthError(error)) {
      setProfileError(null);
      await supabase.auth.signOut();
    } else {
      setProfileError(error.message);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from("app_settings")
      .select("bool_value")
      .eq("key", "paywall_enabled")
      .single();
    if (!error && data) setPaywallEnabled(data.bool_value as boolean);
  }, []);

  useEffect(() => {
    let mounted = true;
    void loadSettings();

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadProfile(data.session?.user?.id);
      if (mounted) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      await loadProfile(newSession?.user?.id);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile, loadSettings]);

  const refreshProfile = useCallback(() => loadProfile(session?.user?.id), [loadProfile, session]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setProfileError(null);
  }, []);

  const value: AuthValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    profileError,
    isAdmin: profile?.role === "admin",
    isSuperuser: profile?.role === "superuser",
    hasAccess: !paywallEnabled || hasPaidAccess(profile),
    paywallEnabled,
    refreshProfile,
    refreshSettings: loadSettings,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
