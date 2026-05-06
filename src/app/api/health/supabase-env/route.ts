import { NextResponse } from "next/server";

/** בדיקה בטוחה לפריסה: לא חושף מפתחות, רק האם הוגדרו וה-host של Supabase */
export const dynamic = "force-dynamic";

export async function GET() {
  const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const hasKey = Boolean((process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim());

  let supabaseHost: string | null = null;
  try {
    if (rawUrl) {
      supabaseHost = new URL(rawUrl).hostname;
    }
  } catch {
    supabaseHost = null;
  }

  const urlOk = Boolean(rawUrl && supabaseHost);
  const ok = urlOk && hasKey;

  return NextResponse.json({
    ok,
    urlPresent: urlOk,
    keyPresent: hasKey,
    supabaseHost,
  });
}
