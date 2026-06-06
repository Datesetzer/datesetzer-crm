// src/app/customers/page.tsx
import { supabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Shell } from "@/components/layout/Shell";
import { CustomersView } from "@/components/customers/CustomersView";
export const dynamic = "force-dynamic";
export const metadata = { title: "Kunden" };
export default async function CustomersPage() {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await sb.from("profiles").select("*, org:organizations(*)").eq("id", user.id).single();
  if (!profile) redirect("/login");
  const { data: customers } = await sb.from("customers").select("*").eq("org_id", profile.org_id).order("created_at", { ascending: false });
  return <Shell profile={profile}><CustomersView initialCustomers={customers ?? []} orgId={profile.org_id} /></Shell>;
}
