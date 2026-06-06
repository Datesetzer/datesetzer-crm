// src/app/api/ai/email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
export async function POST(req: NextRequest) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { to, leadName } = await req.json();
  const prompt = `Du bist Senior Sales Expert für Datesetzer — Premium Executive Dating.
Schreibe eine kurze, professionelle, personalisierte Verkaufs-E-Mail${leadName ? ` an ${leadName}` : ""} (${to}).
Max 120 Wörter. Elegant, nicht aufdringlich. Klarer nächster Schritt.
Antworte NUR in JSON: {"subject":"Betreff","body":"Text mit \\n für Zeilenumbrüche"}`;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:600, messages:[{role:"user",content:prompt}] }),
  });
  const d = await res.json();
  const text = d.content?.find((c: any) => c.type==="text")?.text ?? "{}";
  try { return NextResponse.json(JSON.parse(text.replace(/```json|```/g,"").trim())); }
  catch { return NextResponse.json({ error:"Parse error" }, { status:500 }); }
}
