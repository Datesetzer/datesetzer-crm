// src/app/automations/page.tsx
import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { AutomationsClient } from "./AutomationsClient";
export const dynamic = "force-dynamic";
export const metadata = { title: "Automationen" };
export default async function AutomationsPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await sb.from("profiles").select("*, org:organizations(*)").eq("id", user.id).single();
  if (!profile) redirect("/login");
  const { data: autos } = await sb.from("automations").select("*").eq("org_id", profile.org_id).order("created_at", { ascending: false });
  return <Shell profile={profile}><AutomationsClient initialAutos={autos ?? []} orgId={profile.org_id} /></Shell>;
}
