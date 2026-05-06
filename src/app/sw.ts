/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

self.addEventListener("push", (event: PushEvent) => {
  const payload = {
    title: "MOM-MANAGER",
    body: "",
    tag: "mom-manager",
  };
  try {
    const text = event.data?.text();
    if (text) {
      const j = JSON.parse(text) as {
        title?: string;
        body?: string;
        tag?: string;
      };
      if (typeof j.title === "string" && j.title) payload.title = j.title;
      if (typeof j.body === "string") payload.body = j.body;
      if (typeof j.tag === "string" && j.tag) payload.tag = j.tag;
    }
  } catch {
    /* */
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      icon: "/icons/192",
      lang: "he",
    })
  );
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const c of all) {
        if (c.url && "focus" in c) {
          await c.focus();
          return;
        }
      }
      await self.clients.openWindow("/");
    })()
  );
});
