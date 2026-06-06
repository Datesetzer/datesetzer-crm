import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { WebsiteAPIClient } from "./WebsiteAPIClient";
export const dynamic = "force-dynamic";
export const metadata = { title: "Website API" };
export default async function WebsiteAPIPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await sb.from("profiles").select("*, org:organizations(*)").eq("id", user.id).single();
  if (!profile) redirect("/login");
  return <Shell profile={profile}><WebsiteAPIClient apiKey={(profile.org as any)?.api_key || ""} appUrl={process.env.NEXT_PUBLIC_APP_URL || ""} /></Shell>;
}
