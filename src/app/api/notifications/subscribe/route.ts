import { NextRequest, NextResponse } from "next/server";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint, keys } = await req.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  await admin.from("push_subscriptions").upsert({
    profile_id: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, platform: "web",
  }, { onConflict: "profile_id,endpoint" });

  return NextResponse.json({ ok: true });
}
