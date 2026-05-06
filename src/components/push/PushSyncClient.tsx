"use client";

import { useEffect, useRef } from "react";
import { useMomManager } from "@/hooks/use-mom-manager";
import { buildPushSnapshot } from "@/lib/push/push-snapshot";

const DEVICE_KEY = "mom-manager-device-id";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getOrCreateDeviceId(): string {
  let id = window.localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function PushSyncClient() {
  const { state, ready } = useMomManager();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const snapshot = ready && state ? buildPushSnapshot(state) : null;
  const perm =
    typeof Notification !== "undefined" ? Notification.permission : "denied";
  const syncKey = snapshot
    ? `${JSON.stringify(snapshot)}|${snapshot.notificationPrefs.backgroundPushEnabled}|${snapshot.notificationPrefs.browserNotificationsEnabled}|${perm}`
    : "";

  useEffect(
    () => {
      if (!ready || !state || !snapshot) return;

      const wants =
        snapshot.notificationPrefs.backgroundPushEnabled &&
        snapshot.notificationPrefs.browserNotificationsEnabled &&
        perm === "granted";

      const run = async () => {
        if (!wants) {
          const id = window.localStorage.getItem(DEVICE_KEY);
          if (id) {
            try {
              const reg = await navigator.serviceWorker.ready;
              const sub = await reg.pushManager.getSubscription();
              if (sub) await sub.unsubscribe();
            } catch {
              /* */
            }
            try {
              await fetch("/api/push/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  deviceId: id,
                  state: snapshot,
                  backgroundPush: false,
                }),
              });
            } catch {
              /* */
            }
          }
          return;
        }

        const vapidRes = await fetch("/api/push/vapid-public");
        if (!vapidRes.ok) return;
        const parsed = (await vapidRes.json()) as { publicKey?: string };
        if (!parsed.publicKey) return;

        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();
        const keyBuf = urlBase64ToUint8Array(parsed.publicKey);
        if (!sub) {
          const appKey = new Uint8Array(keyBuf);
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: appKey,
          });
        }

        const deviceId = getOrCreateDeviceId();
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            deviceId,
            subscription: sub.toJSON(),
            state: snapshot,
            backgroundPush: true,
          }),
        });
      };

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void run();
      }, 2000);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    },
    // נשענים על syncKey (מחרוזת) — אובייקט snapshot מתחדש בכל רנדר
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, syncKey]
  );

  return null;
}
