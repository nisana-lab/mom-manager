"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { PushSyncClient } from "@/components/push/PushSyncClient";
import { SmartNotificationsClient } from "@/components/notifications/SmartNotificationsClient";
import { MomManagerProvider } from "@/components/providers/MomManagerProvider";
import { PwaInstallCta } from "@/components/pwa/PwaInstallCta";
import type { SupabasePublicEnv } from "@/lib/supabase/browser-client";
import { SupabaseAuthProvider, useAuth } from "@/components/providers/SupabaseAuthProvider";

export function AppShell({
  children,
  publicEnv,
}: {
  children: React.ReactNode;
  /** מ־layout (שרת) — מפתחות Supabase ללקוח */
  publicEnv: SupabasePublicEnv;
}) {
  return (
    <SupabaseAuthProvider publicEnv={publicEnv}>
      <AppShellInner>{children}</AppShellInner>
    </SupabaseAuthProvider>
  );
}

function LocalPreviewBanner() {
  return (
    <div
      className="border-b border-sage-200/80 bg-sage-50/95 px-4 py-2 text-center text-xs leading-snug text-sage-800 ring-1 ring-black/5"
      role="status"
    >
      <strong className="font-semibold">מצב תצוגה מקומית</strong>
      {" · "}
      הנתונים נשמרים רק בדפדפן הזה. לסנכרון בין מכשירים והתחברות אמיתית — הוסיפי
      קובץ{" "}
      <code className="rounded bg-white/80 px-1" dir="ltr">
        .env.local
      </code>{" "}
      עם מפתחות Supabase והפעילי מחדש את השרת.
    </div>
  );
}

function AppShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, localPreviewMode } = useAuth();

  useEffect(() => {
    if (!ready) return;
    const publicPaths = pathname === "/auth" || pathname === "/~offline";
    if (!user && !publicPaths) {
      router.replace("/auth");
    }
    if (user && pathname === "/auth") {
      router.replace("/");
    }
  }, [user, ready, pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        טוענת…
      </div>
    );
  }

  if (pathname === "/auth") {
    return <div className="relative min-h-screen">{children}</div>;
  }

  if (pathname === "/~offline") {
    return (
      <div className="relative min-h-screen bg-cream-100">
        <main className="mx-auto max-w-5xl px-4 pb-6 pt-[max(0.5rem,env(safe-area-inset-top))]">
          {children}
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        מעבירה להתחברות…
      </div>
    );
  }

  return (
    <MomManagerProvider>
      <div className="relative min-h-screen">
        {localPreviewMode && <LocalPreviewBanner />}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-sage-200/40 blur-3xl" />
          <div className="absolute -right-16 bottom-32 h-80 w-80 rounded-full bg-rose-200/35 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/80 to-transparent" />
        </div>
        <SmartNotificationsClient />
        <PushSyncClient />
        <PwaInstallCta />
        <main className="mx-auto min-h-screen max-w-5xl px-4 pb-6 pt-[max(0.5rem,env(safe-area-inset-top))]">
          {children}
        </main>
        <BottomNav />
      </div>
    </MomManagerProvider>
  );
}
