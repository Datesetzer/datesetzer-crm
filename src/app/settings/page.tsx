import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { SettingsClient } from "./SettingsClient";
export const dynamic = "force-dynamic";
export const metadata = { title: "Einstellungen" };
export default async function SettingsPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await sb.from("profiles").select("*, org:organizations(*)").eq("id", user.id).single();
  if (!profile) redirect("/login");
  const { data: teammates } = await sb.from("profiles").select("id,name,email,role").eq("org_id", profile.org_id).order("created_at");
  return <Shell profile={profile}><SettingsClient profile={profile} teammates={teammates ?? []} /></Shell>;
}
