import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const REMEMBER_KEY = "mom-manager-auth-remember";

export function readAuthRememberMe(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(REMEMBER_KEY) !== "0";
}

export function writeAuthRememberMe(remember: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
}

export function createSupabaseBrowserClient(
  rememberSession: boolean
): SupabaseClient {
  const c = tryCreateSupabaseBrowserClient(rememberSession);
  if (!c) {
    throw new Error("חסרים NEXT_PUBLIC_SUPABASE_URL או NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return c;
}

export function tryCreateSupabaseBrowserClient(
  rememberSession: boolean
): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  const storage =
    typeof window !== "undefined"
      ? rememberSession
        ? window.localStorage
        : window.sessionStorage
      : undefined;

  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage,
    },
  });
}
