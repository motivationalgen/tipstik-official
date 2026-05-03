import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import type { UserTier } from "@/lib/tier";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  tier: UserTier;
  consoleToken: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const computeTier = (roles: string[]): UserTier => {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("vip")) return "vip";
  if (roles.includes("pro")) return "pro";
  if (roles.includes("member") || roles.includes("user")) return "member";
  return "guest";
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tier, setTier] = useState<UserTier>("guest");
  const [consoleToken, setConsoleToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadAdminInfo(s.user.id), 0);
      } else {
        setIsAdmin(false);
        setTier("guest");
        setConsoleToken(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) loadAdminInfo(s.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadAdminInfo = async (userId: string) => {
    const [{ data: roles }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("tier_expires_at").eq("id", userId).maybeSingle(),
    ]);
    const roleList = (roles ?? []).map((r) => r.role as string);
    let userTier = computeTier(roleList);
    // Honor expiry on the client (server cron is the source of truth)
    const expiresAt = profile?.tier_expires_at ? new Date(profile.tier_expires_at) : null;
    if ((userTier === "pro" || userTier === "vip") && expiresAt && expiresAt.getTime() < Date.now()) {
      userTier = "member";
    }
    setTier(userTier);
    const admin = userTier === "admin";
    setIsAdmin(admin);
    if (admin) {
      const { data: token } = await supabase.from("admin_console").select("token").eq("id", 1).maybeSingle();
      setConsoleToken(token?.token ?? null);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, tier, consoleToken, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
