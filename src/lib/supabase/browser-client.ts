import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizeSupabaseProjectUrl } from "@/lib/supabase/normalize-project-url";

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
  rememberSession: boolean,
  publicEnv?: SupabasePublicEnv | null
): SupabaseClient {
  const c = tryCreateSupabaseBrowserClient(rememberSession, publicEnv);
  if (!c) {
    throw new Error("חסרים NEXT_PUBLIC_SUPABASE_URL או NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return c;
}

export type SupabasePublicEnv = {
  url: string;
  anonKey: string;
};

/** מוזרק מ־layout (אותו רנדר שרת) — גיבוי אם פרופס/React לא מגיעים ללקוח */
const INJECTED_WINDOW_KEY = "__MOM_MANAGER_SUPABASE__" as const;

function readInjectedPublicEnv(): { url: string; anonKey: string } {
  if (typeof window === "undefined") {
    return { url: "", anonKey: "" };
  }
  const raw = (
    window as unknown as { [K in typeof INJECTED_WINDOW_KEY]?: unknown }
  )[INJECTED_WINDOW_KEY];
  if (!raw || typeof raw !== "object") {
    return { url: "", anonKey: "" };
  }
  const o = raw as Record<string, unknown>;
  const url = typeof o.url === "string" ? o.url : "";
  const anonKey = typeof o.anonKey === "string" ? o.anonKey : "";
  return { url, anonKey };
}

export function tryCreateSupabaseBrowserClient(
  rememberSession: boolean,
  publicEnv?: SupabasePublicEnv | null
): SupabaseClient | null {
  const injected = readInjectedPublicEnv();
  const url = normalizeSupabaseProjectUrl(
    (publicEnv?.url?.trim() || "") ||
      (injected.url?.trim() || "") ||
      (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
  );
  const key = (
    (publicEnv?.anonKey?.trim() || "") ||
    (injected.anonKey?.trim() || "") ||
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "")
  ).trim();
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
