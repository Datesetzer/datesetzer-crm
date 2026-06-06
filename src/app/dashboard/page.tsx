import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await sb.from("profiles")
    .select("*, org:organizations(*)")
    .eq("id", user.id).single();
  if (!profile) redirect("/login");

  const orgId = profile.org_id;

  const [leads, customers, tasks, stages] = await Promise.all([
    sb.from("leads")
      .select("id,first_name,last_name,score,value,status,source,created_at,stage_id")
      .eq("org_id", orgId).order("created_at", { ascending: false }).limit(200),
    sb.from("customers")
      .select("id,revenue,status").eq("org_id", orgId),
    sb.from("tasks")
      .select("id,title,status,priority,due_at,lead_id")
      .eq("org_id", orgId).neq("status", "CANCELLED").order("due_at"),
    sb.from("pipeline_stages")
      .select("id,name,color,probability,order")
      .in("pipeline_id",
        (await sb.from("pipelines").select("id").eq("org_id", orgId).eq("is_default", true)).data?.map(p => p.id) ?? []
      ).order("order"),
  ]);

  const L = leads.data ?? [];
  const C = customers.data ?? [];
  const Tk = tasks.data ?? [];
  const St = stages.data ?? [];

  const revenue = C.filter(c => c.status === "ACTIVE").reduce((s, c) => s + Number(c.revenue), 0);
  const won = L.filter(l => l.status === "won");
  const active = L.filter(l => !["won","lost"].includes(l.status));
  const pipeVal = active.reduce((s, l) => s + Number(l.value), 0);
  const convRate = L.length > 0 ? Math.round(won.length / L.length * 100) : 0;
  const avgScore = L.length > 0 ? Math.round(L.reduce((s, l) => s + l.score, 0) / L.length) : 0;
  const openTasks = Tk.filter(t => t.status === "TODO");
  const overdue = openTasks.filter(t => t.due_at && new Date(t.due_at) < new Date());

  const stageCounts = St.map(s => ({
    ...s,
    count: L.filter(l => l.stage_id === s.id).length,
    value: L.filter(l => l.stage_id === s.id).reduce((sum, l) => sum + Number(l.value), 0),
  }));

  return (
    <Shell profile={profile}>
      <DashboardView
        kpis={{ revenue, pipeVal, convRate, avgScore, openTasks: openTasks.length, overdue: overdue.length }}
        recentLeads={L.slice(0, 8)}
        tasks={Tk.slice(0, 8)}
        stageCounts={stageCounts}
        profile={profile}
      />
    </Shell>
  );
}
