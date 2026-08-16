import React, { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export type UserRole = "owner" | "staff";

export interface UserMetadata {
  full_name?: string;
  fullName?: string;
  avatar_url?: string;
  role?: string;
  [key: string]: any;
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: UserMetadata;
  role?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  role: UserRole;
  roleLabel: string;
  isOwner: boolean;
  isStaff: boolean;
  fullName: string;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function normalizeRole(roleInput?: string | null): UserRole {
  if (!roleInput) return "staff";
  const lower = roleInput.toString().toLowerCase().trim();
  if (
    lower === "owner" ||
    lower.includes("chủ") ||
    lower.includes("quản lý") ||
    lower === "admin"
  ) {
    return "owner";
  }
  return "staff";
}

export function getRoleDisplayLabel(role: UserRole | string): string {
  const norm = normalizeRole(role);
  return norm === "owner" ? "Chủ cửa hàng" : "Nhân viên bán hàng";
}

export function getUserFullName(user?: AuthUser | null): string {
  if (!user) return "Linh Trần";
  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.fullName ||
    (user.email ? user.email.split("@")[0] : null) ||
    "Linh Trần"
  );
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const rawRole = user?.user_metadata?.role || user?.role || "staff";
  const role: UserRole = normalizeRole(rawRole);
  const isOwner = role === "owner";
  const isStaff = role === "staff";
  const roleLabel = getRoleDisplayLabel(role);
  const fullName = getUserFullName(user);

  useEffect(() => {
    let mounted = true;

    // Check initial Supabase session
    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) {
          if (data?.session?.user) {
            setSession(data.session);
            setUser({
              id: data.session.user.id,
              email: data.session.user.email,
              user_metadata: data.session.user.user_metadata,
              role: data.session.user.user_metadata?.role || "owner",
            });
          } else {
            setSession(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.warn("[AuthContext] Error getting session:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen to Supabase auth state changes (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      if (newSession?.user) {
        setUser({
          id: newSession.user.id,
          email: newSession.user.email,
          user_metadata: newSession.user.user_metadata,
          role: newSession.user.user_metadata?.role || "owner",
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (res.error) {
        setLoading(false);
        return res;
      }

      if (res.data?.user) {
        setSession(res.data.session);
        setUser({
          id: res.data.user.id,
          email: res.data.user.email,
          user_metadata: res.data.user.user_metadata,
          role: res.data.user.user_metadata?.role || "owner",
        });
      }
      setLoading(false);
      return res;
    } catch (err: any) {
      setLoading(false);
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("[AuthContext] Supabase signOut error:", err);
    } finally {
      setSession(null);
      setUser(null);
      setLoading(false);
      toast.success("Đã đăng xuất khỏi hệ thống LinhFarm");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        role,
        roleLabel,
        isOwner,
        isStaff,
        fullName,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
