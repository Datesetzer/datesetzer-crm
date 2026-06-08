import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const apiKey =
    req.headers.get("x-api-key") ||
    req.nextUrl.searchParams.get("key") || "";

  const sb = admin();

  const { data: org } = await sb
    .from("organizations")
    .select("id")
    .eq("api_key", apiKey)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  // Accept both snake_case and camelCase field names
  const firstName = body.firstName || body.first_name || "";
  const lastName  = body.lastName  || body.last_name  || "";
  const email     = body.email || "";
  const phone     = body.phone || "";
  const source    = body.source || "WEBSITE";
  const notes     = body.notes || "";
  const pageUrl   = body.pageUrl || body.page_url || "";

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "firstName and lastName required" }, { status: 422 });
  }

  // Get default pipeline stage
  const { data: pipeline } = await sb
    .from("pipelines")
    .select("id")
    .eq("org_id", org.id)
    .eq("is_default", true)
    .single();

  const { data: stage } = await sb
    .from("pipeline_stages")
    .select("id")
    .eq("pipeline_id", pipeline?.id ?? "")
    .order("sort_order", { ascending: true })
    .limit(1)
    .single();

  const { data: lead, error } = await sb
    .from("leads")
    .insert({
      org_id:     org.id,
      first_name: firstName,
      last_name:  lastName,
      email,
      phone,
      source,
      notes,
      page_url:   pageUrl,
      status:     "open",
      score:      50,
      stage_id:   stage?.id ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify all admins
  const { data: profiles } = await sb
    .from("profiles")
    .select("id")
    .eq("org_id", org.id)
    .in("role", ["ADMIN", "MANAGER", "SUPER_ADMIN"]);

  if (profiles?.length) {
    await sb.from("notifications").insert(
      profiles.map((p: any) => ({
        org_id:     org.id,
        profile_id: p.id,
        type:       "NEW_LEAD",
        title:      "Neuer Lead von der Website",
        body:       `${firstName} ${lastName} hat sich beworben.`,
        action_url: `/leads/${lead.id}`,
      }))
    );
  }

  return NextResponse.json({ ok: true, id: lead.id });
}
