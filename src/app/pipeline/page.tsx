// Pipeline page
// src/app/pipeline/page.tsx
import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { PipelineView } from "@/components/pipeline/PipelineView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await sb.from("profiles").select("*, org:organizations(*)").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const orgId = profile.org_id;
  const pipeRes = await sb.from("pipelines").select("id,name,is_default").eq("org_id", orgId).eq("is_default", true).single();
  const pipeId = pipeRes.data?.id;

  const [stagesRes, leadsRes] = await Promise.all([
    sb.from("pipeline_stages").select("id,name,color,probability,order,is_won,is_lost")
      .eq("pipeline_id", pipeId || "").order("order"),
    sb.from("leads").select("id,first_name,last_name,company,title,source,value,score,stage_id,assignee_id,created_at")
      .eq("org_id", orgId).neq("status","archived"),
  ]);

  return (
    <Shell profile={profile}>
      <PipelineView
        stages={stagesRes.data ?? []}
        initialLeads={leadsRes.data ?? []}
        orgId={orgId}
      />
    </Shell>
  );
}
