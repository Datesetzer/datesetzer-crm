// src/app/emails/page.tsx
import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { EmailsClient } from "./EmailsClient";
export const dynamic = "force-dynamic";
export const metadata = { title: "E-Mails" };
export default async function EmailsPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await sb.from("profiles").select("*, org:organizations(*)").eq("id", user.id).single();
  if (!profile) redirect("/login");
  const { data: logs } = await sb.from("email_logs").select("*").eq("org_id", profile.org_id).order("created_at", { ascending: false }).limit(50);
  const { data: leads } = await sb.from("leads").select("id,first_name,last_name,email").eq("org_id", profile.org_id).not("email", "is", null);
  return <Shell profile={profile}><EmailsClient initialLogs={logs ?? []} leads={leads ?? []} orgId={profile.org_id} /></Shell>;
}
