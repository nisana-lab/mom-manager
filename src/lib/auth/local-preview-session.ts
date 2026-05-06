import type { Session, User } from "@supabase/supabase-js";

/** יציב לכל מכשיר — נתונים ב-localStorage תחת מזהה זה */
export const LOCAL_PREVIEW_USER_ID = "mom-manager-local-preview";

export function createLocalPreviewSession(): Session {
  const now = new Date().toISOString();
  const user = {
    id: LOCAL_PREVIEW_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "local-preview@mom-manager.invalid",
    email_confirmed_at: now,
    phone: "",
    confirmed_at: now,
    last_sign_in_at: now,
    app_metadata: {},
    user_metadata: { full_name: "תצוגה מקומית" },
    identities: [],
    created_at: now,
    updated_at: now,
    is_anonymous: false,
  } as User;

  const at = Math.floor(Date.now() / 1000) + 3600;
  return {
    access_token: "local-preview",
    refresh_token: "local-preview",
    expires_in: 3600,
    expires_at: at,
    token_type: "bearer",
    user,
  };
}

export function isLocalPreviewUserId(id: string | undefined): boolean {
  return id === LOCAL_PREVIEW_USER_ID;
}
