"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { PushSyncClient } from "@/components/push/PushSyncClient";
import { SmartNotificationsClient } from "@/components/notifications/SmartNotificationsClient";
import { MomManagerProvider } from "@/components/providers/MomManagerProvider";
import { PwaInstallCta } from "@/components/pwa/PwaInstallCta";
import { SupabaseAuthProvider, useAuth } from "@/components/providers/SupabaseAuthProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseAuthProvider>
      <AppShellInner>{children}</AppShellInner>
    </SupabaseAuthProvider>
  );
}

function AppShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, configError } = useAuth();

  useEffect(() => {
    if (!ready || configError) return;
    if (!user && pathname !== "/auth") {
      router.replace("/auth");
    }
    if (user && pathname === "/auth") {
      router.replace("/");
    }
  }, [user, ready, configError, pathname, router]);

  if (configError) {
    return (
      <div className="relative min-h-screen">
        <main className="mx-auto max-w-5xl px-4 pb-6 pt-[max(0.5rem,env(safe-area-inset-top))]">
          {children}
        </main>
      </div>
    );
  }

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
