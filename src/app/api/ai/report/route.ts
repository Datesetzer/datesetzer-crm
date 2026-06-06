import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();

  const prompt = `Du bist Senior Business Intelligence Analyst für Datesetzer — Premium Executive Dating.
Erstelle einen professionellen deutschen Managementbericht basierend auf diesen CRM-Daten:
- Gesamt-Leads: ${data.leads}
- Gewonnene Deals: ${data.won}
- Conversion Rate: ${data.convRate}%
- Aktiver Umsatz: €${data.revenue?.toLocaleString("de-DE")}
- Pipeline-Wert: €${data.pipeVal?.toLocaleString("de-DE")}
- Gewichteter Forecast: €${data.weighted?.toLocaleString("de-DE")}
- Ø Lead-Score: ${data.avgScore}

Antworte NUR in JSON (kein Markdown):
{"headline":"kurze Überschrift","summary":"2-3 Sätze Management Summary auf Deutsch","health":"excellent|good|warning|critical","strengths":["Stärke 1","Stärke 2","Stärke 3"],"recommendations":["Empfehlung 1","Empfehlung 2","Empfehlung 3"],"forecast":{"Q3":number,"Q4":number,"Q1_next":number}}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const d = await res.json();
  const text = d.content?.find((c: any) => c.type === "text")?.text ?? "{}";
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Parse error" }, { status: 500 });
  }
}
