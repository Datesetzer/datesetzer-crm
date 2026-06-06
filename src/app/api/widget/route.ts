import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key") || req.nextUrl.searchParams.get("key");
  
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Find org by API key
  const { data: org } = await admin
    .from("organizations")
    .select("id, name")
    .eq("api_key", apiKey ?? "")
    .single();

  if (!org) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // New leads today
  const { count: leadsToday } = await admin
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org.id)
    .gte("created_at", today.toISOString());

  // Total pipeline value (open leads)
  const { data: pipelineData } = await admin
    .from("leads")
    .select("value")
    .eq("org_id", org.id)
    .eq("status", "open");

  const pipelineValue = pipelineData?.reduce((sum, l) => sum + (Number(l.value) || 0), 0) ?? 0;

  // Leads this month vs last month
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const { count: leadsThisMonth } = await admin
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org.id)
    .gte("created_at", firstOfMonth.toISOString());

  return NextResponse.json({
    org: org.name,
    leadsToday: leadsToday ?? 0,
    leadsThisMonth: leadsThisMonth ?? 0,
    pipelineValue,
    pipelineFormatted: new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(pipelineValue),
    updatedAt: new Date().toISOString(),
  });
}
