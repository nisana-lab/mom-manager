"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { useMomManager } from "@/hooks/use-mom-manager";
import {
  playReminderChime,
  unlockReminderAudio,
} from "@/lib/reminder-chime";
import { speakReminderPreviewSample } from "@/lib/reminder-speech";

const SUMMARY_HOUR_OPTIONS = [17, 18, 19, 20, 21, 22, 23] as const;

type PushServerStatus = {
  pushInfrastructureReady: boolean;
  cronSecretSet: boolean;
  needsCronSecretInProduction: boolean;
} | null;

export function NotificationPrefsBar() {
  const { state, ready, applyPersisted } = useMomManager();
  const [pushServerStatus, setPushServerStatus] =
    useState<PushServerStatus>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/push/config-status")
      .then((r) => r.json())
      .then((j) => {
        if (cancelled || !j || typeof j !== "object") return;
        setPushServerStatus({
          pushInfrastructureReady: Boolean(j.pushInfrastructureReady),
          cronSecretSet: Boolean(j.cronSecretSet),
          needsCronSecretInProduction: Boolean(j.needsCronSecretInProduction),
        });
      })
      .catch(() => {
        if (!cancelled) setPushServerStatus(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready || !state) return null;

  const prefs = state.notificationPrefs;
  const perm =
    typeof Notification !== "undefined" ? Notification.permission : "denied";

  const enableBrowser = async () => {
    if (typeof Notification === "undefined") return;
    await unlockReminderAudio();
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
      await unlockReminderAudio();
      try {
        p = await Notification.requestPermission();
      } catch {
        return;
      }
    }
    if (p !== "granted") return;
    await unlockReminderAudio();
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

  const toggleReminderVoice = (on: boolean) => {
    applyPersisted((prev) => ({
      ...prev,
      notificationPrefs: {
        ...prev.notificationPrefs,
        reminderVoiceEnabled: on,
      },
    }));
  };

  const hourValue = SUMMARY_HOUR_OPTIONS.some((x) => x === prefs.dailySummaryHour)
    ? prefs.dailySummaryHour
    : 20;

  /** צליל באפליקציה + בקשת הרשאה אם צריך + התראת בדיקה */
  const testReminderFeedback = async () => {
    await unlockReminderAudio();
    playReminderChime();
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      try {
        new Notification("MOM-MANAGER · בדיקה", {
          body: "כך נראית התראת תזכורת מהדפדפן",
          tag: "mom-manager-test",
          lang: "he",
          silent: false,
          vibrate: [140, 90, 140],
        });
      } catch {
        /* */
      }
      return;
    }
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
        try {
          new Notification("MOM-MANAGER · בדיקה", {
            body: "ההרשאה אושרה — תזכורות יכולות להופיע גם כשהטאב ברקע",
            tag: "mom-manager-test",
            lang: "he",
            silent: false,
            vibrate: [140, 90, 140],
          });
        } catch {
          /* */
        }
      }
    } catch {
      /* */
    }
  };

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
        אפשר להפעיל הקראה קולית של שם המשימה בעברית אחרי הציפצוף (דפדפן עם תמיכה
        בקול — לרוב Chrome/Android). כשמגיעה תזכורת יישמע ציפצוף קצר באפליקציה
        (ובמובייל אפשר גם רטט). התראת מערכת
        מהדפדפן תופיע רק אחרי שתאשרי — בטלפון לוחצים על «אישור הרשאת התראות» או
        «בדיקת צליל והתראה», ואז מאשרים בחלון של המערכת (ב־iPhone: לעיתים דרך הגדרות
        האתר או אחרי התקנת האפליקציה למסך הבית).
        <span className="mt-1 block font-medium text-slate-700">
          תזכורות כשהאפליקציה כבויה: סמני למטה «גם כשהאפליקציה סגורה», אשרי התראות,
          והתקיני את האתר כאפליקציה לטלפון (Chrome/Android או Safari→מסך הבית ב־iOS).
          בשרת צריך מפתח Service Role של Supabase, זוג מפתחות VAPID ומשימת Cron — ראי
          קובץ SETUP.txt בפרויקט.
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
        <button
          type="button"
          onClick={() => void testReminderFeedback()}
          className="rounded-lg border border-sage-400 bg-sage-50 px-2.5 py-1 text-xs font-semibold text-sage-900 hover:bg-sage-100"
        >
          בדיקת צליל והתראה
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-end gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-800">
          <input
            type="checkbox"
            checked={prefs.reminderVoiceEnabled}
            onChange={(e) => toggleReminderVoice(e.target.checked)}
            className="h-4 w-4 rounded border-sage-300 text-sage-700"
          />
          הקראת משימה בקול (אחרי הציפצוף)
        </label>
        <button
          type="button"
          onClick={() => {
            void unlockReminderAudio();
            speakReminderPreviewSample();
          }}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50"
        >
          ניסוי הקראה בקול
        </button>
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
      {prefs.backgroundPushEnabled &&
        pushServerStatus &&
        !pushServerStatus.pushInfrastructureReady && (
          <p
            className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-2 py-2 text-xs leading-snug text-amber-950"
            role="status"
          >
            השרת עדיין לא מוגדר ל־Web Push: הוסיפי ב־Vercel את{" "}
            <span dir="ltr" className="font-mono">
              SUPABASE_SERVICE_ROLE_KEY
            </span>
            ,{" "}
            <span dir="ltr" className="font-mono">
              NEXT_PUBLIC_VAPID_PUBLIC_KEY
            </span>{" "}
            ו־
            <span dir="ltr" className="font-mono">
              VAPID_PRIVATE_KEY
            </span>{" "}
            (יצירת זוג: מתוך תיקיית האפליקציה —{" "}
            <span dir="ltr" className="font-mono">
              npx web-push generate-vapid-keys
            </span>
            ). ודאי שב־Supabase רצה גם יצירת טבלת{" "}
            <span dir="ltr" className="font-mono">
              mom_push_devices
            </span>{" "}
            (כלול ב־schema-for-dashboard.sql).
          </p>
        )}
      {prefs.backgroundPushEnabled &&
        pushServerStatus?.pushInfrastructureReady &&
        pushServerStatus.needsCronSecretInProduction &&
        !pushServerStatus.cronSecretSet && (
          <p
            className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-2 py-2 text-xs leading-snug text-amber-950"
            role="status"
          >
            לשליחת תזכורות אוטומטית מהענן בפרודקשן: הגדירי משתנה{" "}
            <span dir="ltr" className="font-mono">
              CRON_SECRET
            </span>{" "}
            ב־Vercel (מחרוזת אקראית), ואז Redeploy. הפרויקט כולל Cron כל 5 דקות ל־
            <span dir="ltr" className="font-mono">
              /api/push/cron
            </span>
            .
          </p>
        )}
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
