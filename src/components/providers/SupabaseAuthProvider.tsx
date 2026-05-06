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
import {
  readAuthRememberMe,
  tryCreateSupabaseBrowserClient,
  writeAuthRememberMe,
} from "@/lib/supabase/browser-client";

type AuthContextValue = {
  supabase: SupabaseClient | null;
  user: User | null;
  session: Session | null;
  ready: boolean;
  configError: boolean;
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
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    const remember = readAuthRememberMe();
    const client = tryCreateSupabaseBrowserClient(remember);
    if (!client) {
      setConfigError(true);
      setReady(true);
      return;
    }
    setSupabase(client);

    let detached: (() => void) | undefined;

    const run = async () => {
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
      setReady(true);
    };
    void run();

    return () => {
      detached?.();
    };
  }, []);

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
      const client = tryCreateSupabaseBrowserClient(rememberMe);
      if (!client) {
        setConfigError(true);
        return { error: { message: "missing_env" } as AuthError };
      }
      setSupabase(client);
      const res = await client.auth.signInWithPassword({ email, password });
      return { error: res.error };
    },
    []
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
      const client = tryCreateSupabaseBrowserClient(rememberMe);
      if (!client) {
        setConfigError(true);
        return { error: { message: "missing_env" } as AuthError };
      }
      setSupabase(client);
      const res = await client.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() },
        },
      });
      return { error: res.error };
    },
    []
  );

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
  }, [supabase]);

  const value = useMemo(
    () => ({
      supabase,
      user: session?.user ?? null,
      session,
      ready,
      configError,
      signIn,
      signUp,
      signOut,
    }),
    [supabase, session, ready, configError, signIn, signUp, signOut]
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
