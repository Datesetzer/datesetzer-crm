// src/app/tasks/page.tsx
import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { TasksView } from "@/components/tasks/TasksView";
export const dynamic = "force-dynamic";
export const metadata = { title: "Aufgaben" };
export default async function TasksPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await sb.from("profiles").select("*, org:organizations(*)").eq("id", user.id).single();
  if (!profile) redirect("/login");
  const { data: tasks } = await sb.from("tasks").select("*, lead:leads(first_name,last_name)").eq("org_id", profile.org_id).neq("status","CANCELLED").order("due_at");
  return <Shell profile={profile}><TasksView initialTasks={tasks ?? []} orgId={profile.org_id} userId={user.id} /></Shell>;
}
