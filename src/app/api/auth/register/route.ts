import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { name, email, password, orgName } = await req.json();
  if (!name || !email || !password || !orgName) {
    return NextResponse.json({ error: "Alle Felder sind Pflicht." }, { status: 422 });
  }

  const admin = supabaseAdmin();

  // Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email, password, user_metadata: { name }, email_confirm: true,
  });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
  const userId = authData.user.id;

  // Create org
  const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const { data: org, error: orgErr } = await admin.from("organizations").insert({
    name: orgName,
    slug: `${slug}-${Math.random().toString(36).slice(2,6)}`,
    api_key: crypto.randomUUID().replace(/-/g,""),
  }).select().single();
  if (orgErr) return NextResponse.json({ error: "Organisation konnte nicht erstellt werden." }, { status: 500 });

  // Create profile
  await admin.from("profiles").insert({ id: userId, email, name, role: "ADMIN", org_id: org.id });

  // Create default pipeline + stages
  const { data: pipeline } = await admin.from("pipelines")
    .insert({ org_id: org.id, name: "Standard Pipeline", is_default: true }).select().single();

  if (pipeline) {
    await admin.from("pipeline_stages").insert([
      { pipeline_id: pipeline.id, name:"Neu",          order:0, color:"#60a5fa", probability:10 },
      { pipeline_id: pipeline.id, name:"Kontaktiert",  order:1, color:"#c9a84c", probability:25 },
      { pipeline_id: pipeline.id, name:"Qualifiziert", order:2, color:"#a78bfa", probability:50 },
      { pipeline_id: pipeline.id, name:"Angebot",      order:3, color:"#fb923c", probability:75 },
      { pipeline_id: pipeline.id, name:"Gewonnen",     order:4, color:"#34d399", probability:100, is_won:true },
      { pipeline_id: pipeline.id, name:"Verloren",     order:5, color:"#f87171", probability:0,   is_lost:true },
    ]);
  }

  return NextResponse.json({ ok: true });
}
