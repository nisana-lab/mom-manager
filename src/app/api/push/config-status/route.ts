import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * בדיקה אלמנטרית (ללא סודות) — האם ניתן לרשום מנוי Push ולשלוח מהשרת.
 */
export async function GET() {
  const hasServiceRole = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
  const hasVapid =
    Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()) &&
    Boolean(process.env.VAPID_PRIVATE_KEY?.trim());
  const cronSecretSet = Boolean(process.env.CRON_SECRET?.trim());

  return NextResponse.json({
    pushInfrastructureReady: hasServiceRole && hasVapid,
    cronSecretSet,
    /** לא סוד אבל עוזר להבין למה cron נכשל בפרודקשן */
    needsCronSecretInProduction: process.env.NODE_ENV === "production",
  });
}
