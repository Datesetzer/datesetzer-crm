import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("X-API-Key") ?? "";
  const admin = supabaseAdmin();

  const { data: org } = await admin.from("organizations").select("id").eq("api_key", apiKey).single();
  if (!org) return NextResponse.json({ error: "Invalid API key" }, { status: 401, headers: CORS });

  const body = await req.json().catch(() => ({}));
  const { firstName, lastName, email, phone, company, message, source, utmSource, utmMedium, utmCampaign, pageUrl, referrer } = body;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "firstName and lastName required" }, { status: 422, headers: CORS });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  // Auto score
  let score = 30;
  if (email)   score += 15;
  if (phone)   score += 12;
  if (company) score += 10;
  if (message) score += 8;
  score = Math.min(100, score);

  const { data: pipeline } = await admin.from("pipelines").select("id,stages:pipeline_stages(id,order)")
    .eq("org_id", org.id).eq("is_default", true).single();
  const firstStage = (pipeline?.stages as any[])?.sort((a, b) => a.order - b.order)[0];

  const { data: lead, error } = await admin.from("leads").insert({
    org_id: org.id, pipeline_id: pipeline?.id, stage_id: firstStage?.id,
    created_by_id: null, first_name: firstName, last_name: lastName,
    email, phone, company, source: source || "WEBSITE", score, notes: message,
    utm_source: utmSource, utm_medium: utmMedium, utm_campaign: utmCampaign,
    page_url: pageUrl, referrer, ip_address: ip,
  }).select().single();

  if (!error && lead) {
    await admin.from("activities").insert({
      org_id: org.id, lead_id: lead.id, type: "LEAD_CREATED",
      title: "Website-Lead",
      description: `${firstName} ${lastName} hat das Formular auf ${pageUrl || "datesetzer.de"} ausgefüllt.`,
    });
  }

  return NextResponse.json({
    success: true, message: "Vielen Dank! Wir melden uns in Kürze.", leadId: lead?.id,
  }, { status: 201, headers: CORS });
}
