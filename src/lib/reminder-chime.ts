/**
 * צליל תזכורת קצר (שני ציפצופים) — עובד כשהאפליקציה פתוחה.
 * בדפדפן חלק מהמכשירים דורשים מגע/לחיצה קודמת כדי לאפשר שמע — קראו ל־unlockReminderAudio באותו gesture.
 */

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (sharedCtx) return sharedCtx;
  const AC =
    window.AudioContext ||
    (
      window as Window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;
  if (!AC) return null;
  sharedCtx = new AC();
  return sharedCtx;
}

/** להפעלה מכפתור «אפשר התראות» / לפני ניסיון צליל — פותח את מנגנון השמע ב־iOS וכו׳ */
export async function unlockReminderAudio(): Promise<void> {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    await ctx.resume().catch(() => {});
  }
}

function scheduleBeep(ctx: AudioContext, startSec: number, freqHz: number): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freqHz, startSec);
  gain.gain.setValueAtTime(0, startSec);
  gain.gain.linearRampToValueAtTime(0.11, startSec + 0.015);
  gain.gain.linearRampToValueAtTime(0, startSec + 0.11);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startSec);
  osc.stop(startSec + 0.12);
}

/** שני ציפצופים קצרים — סגנון «הודעה הגיעה» */
export function playReminderChime(): void {
  void (async () => {
    await unlockReminderAudio();
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;
      scheduleBeep(ctx, t, 880);
      scheduleBeep(ctx, t + 0.16, 1174);
    } catch {
      /* חסימת שמע / הקשר לא זמין */
    }
  })();
}
