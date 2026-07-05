import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Health endpoint for uptime monitoring.
 * Returns 200 when the app and Supabase are reachable, 503 otherwise —
 * point an external uptime monitor (UptimeRobot, Better Stack, ...) at this.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let supabase: "ok" | "error" | "unconfigured" = "unconfigured";
  if (url && anonKey) {
    try {
      const res = await fetch(`${url}/auth/v1/health`, {
        headers: { apikey: anonKey },
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });
      supabase = res.ok ? "ok" : "error";
    } catch {
      supabase = "error";
    }
  }

  const healthy = supabase !== "error";
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      supabase,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 }
  );
}
