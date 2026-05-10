/**
 * הקראת תזכורות בעברית דרך Web Speech API (כשהאפליקציה פתוחה).
 * תלוי במכשיר ובקולות מותקנים — ב-Chrome/Android לרוב יש עברית.
 */

function hasSpeech(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined"
  );
}

/** עוצר הקראה שרצה (סגירת תזכורת / תזכורת חדשה) */
export function cancelReminderSpeech(): void {
  if (!hasSpeech()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* */
  }
}

function pickHebrewVoice(): SpeechSynthesisVoice | undefined {
  if (!hasSpeech()) return undefined;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => /^(he|iw)/i.test(v.lang.trim())) ??
    voices.find((v) => /he|iw/i.test(v.lang))
  );
}

/**
 * הקראת טקסט התזכורת — לרוב אחרי הציפצוף (מושהה בממשק המזכירות).
 */
export function speakReminderTask(title: string, timeLabel: string): void {
  if (!hasSpeech()) return;
  const rawTitle = typeof title === "string" ? title.trim() : "";
  const rawTime = typeof timeLabel === "string" ? timeLabel.trim() : "";
  if (!rawTitle && !rawTime) return;

  const parts: string[] = [];
  if (rawTitle) parts.push(`הגיע הזמן ל${rawTitle}`);
  else parts.push("הגיע הזמן");
  if (rawTime) parts.push(`בשעה ${rawTime}`);
  const text = parts.join(". ");

  const speakOnce = () => {
    cancelReminderSpeech();
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "he-IL";
      u.rate = 0.92;
      u.pitch = 1;
      const voice = pickHebrewVoice();
      if (voice) u.voice = voice;
      window.speechSynthesis.speak(u);
    } catch {
      /* */
    }
  };

  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener("voiceschanged", speakOnce, {
      once: true,
    });
    return;
  }
  speakOnce();
}

/** ניסוי מהגדרות — משפט קצר בעברית */
export function speakReminderPreviewSample(): void {
  speakReminderTask("משימת דוגמה לבדיקת הקול", "12:00");
}
