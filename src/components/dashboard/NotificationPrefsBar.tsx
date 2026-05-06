"use client";

import { Bell } from "lucide-react";
import { useMomManager } from "@/hooks/use-mom-manager";

const SUMMARY_HOUR_OPTIONS = [17, 18, 19, 20, 21, 22, 23] as const;

export function NotificationPrefsBar() {
  const { state, ready, applyPersisted } = useMomManager();

  if (!ready || !state) return null;

  const prefs = state.notificationPrefs;
  const perm =
    typeof Notification !== "undefined" ? Notification.permission : "denied";

  const enableBrowser = async () => {
    if (typeof Notification === "undefined") return;
    try {
      const p = await Notification.requestPermission();
      if (p === "granted") {
        applyPersisted((prev) => ({
          ...prev,
          notificationPrefs: {
            ...prev.notificationPrefs,
            browserNotificationsEnabled: true,
          },
        }));
      }
    } catch {
      /* */
    }
  };

  const toggleEnabled = (on: boolean) => {
    if (!on) {
      applyPersisted((prev) => ({
        ...prev,
        notificationPrefs: {
          ...prev.notificationPrefs,
          browserNotificationsEnabled: false,
          backgroundPushEnabled: false,
        },
      }));
      return;
    }
    if (perm !== "granted") {
      void enableBrowser();
      return;
    }
    applyPersisted((prev) => ({
      ...prev,
      notificationPrefs: {
        ...prev.notificationPrefs,
        browserNotificationsEnabled: true,
      },
    }));
  };

  const toggleBackgroundPush = async (on: boolean) => {
    if (!on) {
      applyPersisted((prev) => ({
        ...prev,
        notificationPrefs: {
          ...prev.notificationPrefs,
          backgroundPushEnabled: false,
        },
      }));
      return;
    }
    if (typeof Notification === "undefined") return;
    let p = Notification.permission;
    if (p !== "granted") {
      try {
        p = await Notification.requestPermission();
      } catch {
        return;
      }
    }
    if (p !== "granted") return;
    applyPersisted((prev) => ({
      ...prev,
      notificationPrefs: {
        ...prev.notificationPrefs,
        browserNotificationsEnabled: true,
        backgroundPushEnabled: true,
      },
    }));
  };

  const setHour = (h: number) => {
    if (h < 0 || h > 23 || Number.isNaN(h)) return;
    applyPersisted((prev) => ({
      ...prev,
      notificationPrefs: {
        ...prev.notificationPrefs,
        dailySummaryHour: h,
      },
    }));
  };

  const hourValue = SUMMARY_HOUR_OPTIONS.some((x) => x === prefs.dailySummaryHour)
    ? prefs.dailySummaryHour
    : 20;

  return (
    <section
      dir="rtl"
      className="rounded-2xl border border-sage-200/80 bg-white/90 px-3 py-3 text-right shadow-inner ring-1 ring-black/5"
    >
      <div className="mb-2 flex items-center justify-end gap-2">
        <Bell className="h-4 w-4 text-sage-700" aria-hidden />
        <h2 className="text-sm font-bold text-slate-900">תזכורות וסיכום יומי</h2>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-slate-600">
        התראות כשהדף או ה־PWA פתוחים — תלוי דפדפן ומכשיר.
        <span className="mt-1 block">
          התראות גם כשהאפליקציה סגורה נשלחות ב־Web Push לאחר הגדרת Supabase,
          מפתחות VAPID ומשימת Cron בפריסה (למשל Vercel).
        </span>
      </p>
      <div className="flex flex-wrap items-center justify-end gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800">
          <input
            type="checkbox"
            checked={prefs.browserNotificationsEnabled && perm === "granted"}
            onChange={(e) => toggleEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-sage-300 text-sage-700"
          />
          שליחת התראות (דפדפן)
        </label>
        {perm !== "granted" && (
          <button
            type="button"
            onClick={() => void enableBrowser()}
            className="rounded-lg bg-sage-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-sage-800"
          >
            אישור הרשאת התראות
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-end gap-3">
        <label
          className={`flex cursor-pointer items-center gap-2 text-sm font-medium ${
            perm === "granted" ? "text-slate-800" : "text-slate-500"
          }`}
        >
          <input
            type="checkbox"
            checked={
              Boolean(prefs.backgroundPushEnabled) &&
              prefs.browserNotificationsEnabled &&
              perm === "granted"
            }
            disabled={perm !== "granted"}
            onChange={(e) => void toggleBackgroundPush(e.target.checked)}
            className="h-4 w-4 rounded border-sage-300 text-sage-700 disabled:opacity-50"
          />
          גם כשהאפליקציה סגורה (Web Push)
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <label className="text-xs font-medium text-slate-700">
          שעת סיכום יומי:
          <select
            value={hourValue}
            onChange={(e) => setHour(Number(e.target.value))}
            className="ms-2 rounded-lg border border-sage-200 bg-white px-2 py-1 text-sm"
          >
            {SUMMARY_HOUR_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
