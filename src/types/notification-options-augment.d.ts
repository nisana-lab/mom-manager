/**
 * הרחבה: טיפוסי lib של webworker לא תמיד כוללים את כל השדות של התראות במובייל.
 * vibrate נתמך בזמן ריצה ב־Chrome Android וכו׳.
 */
export {};

declare global {
  interface NotificationOptions {
    vibrate?: VibrationPattern;
  }
}
