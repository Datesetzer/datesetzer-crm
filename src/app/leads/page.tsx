import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { LeadsView } from "@/components/leads/LeadsView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leads" };

export default async function LeadsPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await sb.from("profiles")
    .select("*, org:organizations(*)").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const orgId = profile.org_id;

  const [leadsRes, stagesRes, profilesRes] = await Promise.all([
    sb.from("leads")
      .select(`
        id, first_name, last_name, email, phone, company, title,
        source, value, score, status, notes, created_at, stage_id, assignee_id,
        stage:pipeline_stages(id,name,color),
        assignee:profiles!leads_assignee_id_fkey(id,name)
      `)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),

    sb.from("pipeline_stages")
      .select("id,name,color,probability,order")
      .in("pipeline_id",
        (await sb.from("pipelines").select("id").eq("org_id", orgId).eq("is_default", true))
          .data?.map(p => p.id) ?? []
      ).order("order"),

    sb.from("profiles").select("id,name").eq("org_id", orgId),
  ]);

  return (
    <Shell profile={profile}>
      <LeadsView
        initialLeads={leadsRes.data ?? []}
        stages={stagesRes.data ?? []}
        profiles={profilesRes.data ?? []}
        orgId={orgId}
        userId={user.id}
      />
    </Shell>
  );
}
