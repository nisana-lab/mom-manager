"use client";

import type { AuthError, Session, User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createLocalPreviewSession } from "@/lib/auth/local-preview-session";
import {
  readAuthRememberMe,
  tryCreateSupabaseBrowserClient,
  writeAuthRememberMe,
  type SupabasePublicEnv,
} from "@/lib/supabase/browser-client";

type AuthContextValue = {
  supabase: SupabaseClient | null;
  user: User | null;
  session: Session | null;
  ready: boolean;
  /** אין Supabase — רק תצוגה ו-localStorage במכשיר */
  localPreviewMode: boolean;
  signIn: (args: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => Promise<{ error: AuthError | null }>;
  signUp: (args: {
    email: string;
    password: string;
    fullName: string;
    rememberMe: boolean;
  }) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  /** אחרי התנתקות במצב מקומי — חזרה לסשן תצוגה בלי Supabase */
  resumeLocalPreview: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function SupabaseAuthProvider({
  children,
  publicEnv,
}: {
  children: ReactNode;
  /** מגיע מהשרת (layout) — נדרש כדי שלא ייעלמו NEXT_PUBLIC בצד הלקוח */
  publicEnv: SupabasePublicEnv;
}) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const remember = readAuthRememberMe();
    const client = tryCreateSupabaseBrowserClient(remember, publicEnv);
    if (!client) {
      setSession(createLocalPreviewSession());
      setReady(true);
      return;
    }
    setSupabase(client);

    let detached: (() => void) | undefined;

    const run = async () => {
      const safety = window.setTimeout(() => setReady(true), 4000);
      try {
        const {
          data: { subscription },
        } = client.auth.onAuthStateChange((_event, sess) => {
          setSession(sess);
        });
        detached = () => subscription.unsubscribe();

        const {
          data: { session: initial },
        } = await client.auth.getSession();
        setSession(initial);
      } catch {
        /* רשת / Supabase — ממשיכים בלי סשן */
      } finally {
        window.clearTimeout(safety);
        setReady(true);
      }
    };
    void run();

    return () => {
      detached?.();
    };
  }, [publicEnv]);

  const signIn = useCallback(
    async ({
      email,
      password,
      rememberMe,
    }: {
      email: string;
      password: string;
      rememberMe: boolean;
    }) => {
      writeAuthRememberMe(rememberMe);
      const client = tryCreateSupabaseBrowserClient(rememberMe, publicEnv);
      if (!client) {
        return { error: { message: "missing_env" } as AuthError };
      }
      setSupabase(client);
      const res = await client.auth.signInWithPassword({ email, password });
      return { error: res.error };
    },
    [publicEnv]
  );

  const signUp = useCallback(
    async ({
      email,
      password,
      fullName,
      rememberMe,
    }: {
      email: string;
      password: string;
      fullName: string;
      rememberMe: boolean;
    }) => {
      writeAuthRememberMe(rememberMe);
      const client = tryCreateSupabaseBrowserClient(rememberMe, publicEnv);
      if (!client) {
        return { error: { message: "missing_env" } as AuthError };
      }
      setSupabase(client);
      const origin =
        typeof window !== "undefined" ? window.location.origin : undefined;
      const res = await client.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: origin ? `${origin}/` : undefined,
        },
      });
      return { error: res.error };
    },
    [publicEnv]
  );

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
  }, [supabase]);

  const resumeLocalPreview = useCallback(() => {
    if (tryCreateSupabaseBrowserClient(readAuthRememberMe(), publicEnv)) {
      return;
    }
    setSession(createLocalPreviewSession());
  }, [publicEnv]);

  const localPreviewMode = supabase === null && session !== null;

  const value = useMemo(
    () => ({
      supabase,
      user: session?.user ?? null,
      session,
      ready,
      localPreviewMode,
      signIn,
      signUp,
      signOut,
      resumeLocalPreview,
    }),
    [
      supabase,
      session,
      ready,
      localPreviewMode,
      signIn,
      signUp,
      signOut,
      resumeLocalPreview,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within SupabaseAuthProvider");
  }
  return ctx;
}
