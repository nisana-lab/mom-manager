import type { ChecklistTaskDef } from "@/lib/checklist-model";

export type DailySummaryTone = "positive" | "mixed" | "tough";

export type DailySummaryResult = {
  done: number;
  total: number;
  ratio: number;
  tone: DailySummaryTone;
  headline: string;
  subline: string;
  tips: string[];
  /** שמות משימות שלא סומנו */
  missedTitles: string[];
};

export function buildDailySummary(
  checklist: Record<string, boolean>,
  tasks: ChecklistTaskDef[]
): DailySummaryResult {
  const total = tasks.length;
  const missed: ChecklistTaskDef[] = [];
  let done = 0;
  for (const t of tasks) {
    if (checklist[t.id]) done++;
    else missed.push(t);
  }
  const ratio = total > 0 ? done / total : 1;
  const missedTitles = missed.map((t) =>
    t.title.trim() ? t.title : t.id
  );

  let tone: DailySummaryTone;
  let headline: string;
  let subline: string;
  const tips: string[] = [];

  if (ratio >= 0.85) {
    tone = "positive";
    headline = "יום מצוין עבורך";
    subline =
      "רוב המשימות בוצעו — זה לא מובן מאליו. כדאי לשמור על הקצב הזה.";
    tips.push("מחר: שמרי על אותה שגרה — קטן ובטוח.");
  } else if (ratio >= 0.55) {
    tone = "mixed";
    headline = "יום בינוני — יש מה לחייך";
    subline =
      "חלק מהמשימות נשארו פתוחות. זה הזמן לסגור את הפערים מחר.";
    tips.push("נסי למקם משימה אחת קשה מוקדם יותר ביום.");
    if (missedTitles.length <= 3) {
      tips.push(`לשימור: ${missedTitles.slice(0, 3).join(" · ")}`);
    }
  } else {
    tone = "tough";
    headline = "יום מאתגר";
    subline =
      "לא הכול הסתדר היום — זה קורה. המטרה היא שיפור הליהי, לא שלמות.";
    tips.push("מחר: בחרי 3 משימות חובה ובצעי אותן לפני הערב.");
    tips.push("שקלי מה חוזר על עצמו ואיפה אפשר לפשט (ארוחה / הכנות לילה).");
    if (missedTitles.length > 0) {
      tips.push(
        `נשארו פתוחות (לדוגמה): ${missedTitles.slice(0, 5).join(" · ")}`
      );
    }
  }

  return {
    done,
    total,
    ratio,
    tone,
    headline,
    subline,
    tips,
    missedTitles,
  };
}
