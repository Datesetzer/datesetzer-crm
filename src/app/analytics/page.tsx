// src/app/analytics/page.tsx
import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics" };
export default async function AnalyticsPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await sb.from("profiles").select("*, org:organizations(*)").eq("id", user.id).single();
  if (!profile) redirect("/login");
  const orgId = profile.org_id;
  const [leads, customers, stages] = await Promise.all([
    sb.from("leads").select("id,value,score,status,source,stage_id,created_at").eq("org_id", orgId),
    sb.from("customers").select("id,revenue,status").eq("org_id", orgId),
    sb.from("pipeline_stages").select("id,name,color,probability").in("pipeline_id",
      (await sb.from("pipelines").select("id").eq("org_id", orgId).eq("is_default", true)).data?.map(p => p.id) ?? []),
  ]);
  return (
    <Shell profile={profile}>
      <AnalyticsView leads={leads.data ?? []} customers={customers.data ?? []} stages={stages.data ?? []} />
    </Shell>
  );
}
