import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lead, stageName } = await req.json();

  const prompt = `Du bist ein Senior Sales-Analyst für Datesetzer — Premium Executive Dating für Führungskräfte.
Analysiere diesen Lead und antworte NUR in JSON.

Lead:
- Name: ${lead.first_name} ${lead.last_name}
- Titel: ${lead.title || "—"}
- Unternehmen: ${lead.company || "—"}
- Quelle: ${lead.source}
- Stage: ${stageName || "—"}
- Aktueller Score: ${lead.score}/100
- Wert: €${lead.value || 0}
- Notizen: ${lead.notes || "—"}

JSON-Format (kein Markdown, kein Text außerhalb):
{"score":85,"probability":70,"reasoning":"1-2 Sätze auf Deutsch","actions":["Empfehlung 1","Empfehlung 2","Empfehlung 3"]}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    const text = data.content?.find((c: any) => c.type === "text")?.text ?? "{}";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
