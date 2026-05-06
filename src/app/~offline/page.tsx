import Link from "next/link";
import { WifiOff } from "lucide-react";

export const metadata = {
  title: "לא מקוון",
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 pb-28 pt-12 text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 ring-1 ring-sage-200/80">
        <WifiOff className="h-8 w-8" aria-hidden />
      </span>
      <h1 className="font-display text-2xl font-bold text-slate-900">
        אין חיבור לאינטרנט
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
        עדיין אפשר לעבוד במצב לא מקוון עם מה שכבר נשמר במכשיר. כשהרשת
        חוזרת — האפליקציה תתעדכן אוטומטית.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-xl bg-sage-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-sage-700"
      >
        ניסיון נוסף — ללוח הבקרה
      </Link>
    </div>
  );
}
