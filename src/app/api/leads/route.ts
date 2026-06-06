import { NextRequest, NextResponse } from "next/server";
import { supabaseServer, supabaseAdmin } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  firstName:   z.string().min(1),
  lastName:    z.string().min(1),
  email:       z.string().email().optional().nullable(),
  phone:       z.string().optional().nullable(),
  company:     z.string().optional().nullable(),
  title:       z.string().optional().nullable(),
  source:      z.string().default("WEBSITE"),
  stageId:     z.string().optional(),
  value:       z.number().default(0),
  score:       z.number().min(0).max(100).default(50),
  notes:       z.string().optional().nullable(),
  utmSource:   z.string().optional().nullable(),
  utmMedium:   z.string().optional().nullable(),
  utmCampaign: z.string().optional().nullable(),
  pageUrl:     z.string().optional().nullable(),
  referrer:    z.string().optional().nullable(),
  ipAddress:   z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await sb.from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(sp.get("limit") ?? "50"));
  const from = (page - 1) * limit;
  const search = sp.get("q") ?? "";
  const stageId = sp.get("stage") ?? "";

  let q = sb.from("leads")
    .select("*, stage:pipeline_stages(id,name,color), assignee:profiles!leads_assignee_id_fkey(id,name)", { count: "exact" })
    .eq("org_id", profile.org_id)
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
  if (stageId) q = q.eq("stage_id", stageId);

  const { data, count, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data, meta: { total: count ?? 0, page, limit } });
}

export async function POST(req: NextRequest) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await sb.from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { data: pipeline } = await sb.from("pipelines").select("id,stages:pipeline_stages(id,order)")
    .eq("org_id", profile.org_id).eq("is_default", true).single();

  const stageId = parsed.data.stageId ??
    (pipeline?.stages as any[])?.sort((a, b) => a.order - b.order)[0]?.id;

  const { data: lead, error } = await sb.from("leads").insert({
    org_id: profile.org_id, pipeline_id: pipeline?.id,
    stage_id: stageId, created_by_id: user.id,
    first_name: parsed.data.firstName, last_name: parsed.data.lastName,
    email: parsed.data.email, phone: parsed.data.phone,
    company: parsed.data.company, title: parsed.data.title,
    source: parsed.data.source, value: parsed.data.value, score: parsed.data.score,
    notes: parsed.data.notes, utm_source: parsed.data.utmSource,
    utm_medium: parsed.data.utmMedium, utm_campaign: parsed.data.utmCampaign,
    page_url: parsed.data.pageUrl, referrer: parsed.data.referrer,
    ip_address: parsed.data.ipAddress,
  }).select("*, stage:pipeline_stages(id,name,color)").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await sb.from("activities").insert({
    org_id: profile.org_id, profile_id: user.id, lead_id: lead.id,
    type: "LEAD_CREATED", title: "Lead erstellt",
    description: `${lead.first_name} ${lead.last_name} wurde angelegt.`,
  });

  return NextResponse.json({ data: lead }, { status: 201 });
}
