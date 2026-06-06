"use client";
import { useState } from "react";
import { Btn, T } from "@/components/ui";
import { toast } from "sonner";

export function WebsiteAPIClient({ apiKey, appUrl }: { apiKey: string; appUrl: string }) {
  const [copied, setCopied] = useState<string|null>(null);
  const [testing, setTesting] = useState(false);
  const [testOk, setTestOk] = useState(false);

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key); setTimeout(() => setCopied(null), 2000);
    toast.success("Kopiert!");
  };

  const test = async () => {
    setTesting(true); setTestOk(false);
    try {
      const res = await fetch(`${appUrl}/api/public/inbound`, {
        method:"POST",
        headers:{"Content-Type":"application/json","X-API-Key":apiKey},
        body: JSON.stringify({ firstName:"Test", lastName:"Lead", email:"test@datesetzer.de",
          source:"WEBSITE", pageUrl: appUrl }),
      });
      if (res.ok) { setTestOk(true); toast.success("✓ Integration funktioniert! Test-Lead angelegt."); }
      else toast.error("Fehler: " + res.status);
    } catch { toast.error("Verbindungsfehler"); }
    setTesting(false);
  };

  const snippet = `<!-- Datesetzer CRM Integration -->
<!-- Auf datesetzer.de einbinden -->
<script
  src="${appUrl}/embed.js"
  data-key="${apiKey}"
  async
></script>

<!-- Formular taggen: -->
<form data-crm-form data-crm-source="WEBSITE">
  <input name="firstName" placeholder="Vorname" required>
  <input name="lastName"  placeholder="Nachname" required>
  <input name="email"     type="email" placeholder="E-Mail" required>
  <input name="phone"     placeholder="Telefon">
  <input name="company"   placeholder="Unternehmen">
  <textarea name="message" placeholder="Nachricht"></textarea>
  <button type="submit">Jetzt anfragen</button>
</form>`;

  const curlSnippet = `curl -X POST ${appUrl}/api/public/inbound \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '{"firstName":"Max","lastName":"Muster","email":"max@example.de","source":"WEBSITE"}'`;

  return (
    <div style={{ flex:1, overflowY:"auto", padding:20 }}>
      {/* API Key */}
      <div style={{ background:T.goldGlow, border:`1px solid ${T.goldLine}`, padding:"16px 20px", marginBottom:16 }}>
        <div style={{ fontSize:8, letterSpacing:3, textTransform:"uppercase", color:T.gold, marginBottom:10 }}>API-Schlüssel</div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <code style={{ flex:1, fontFamily:"monospace", fontSize:12, color:T.cream,
            background:"rgba(240,233,218,.05)", padding:"8px 12px", letterSpacing:0.5,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{apiKey}</code>
          <Btn variant="ghost" small onClick={() => copy("key", apiKey)}>
            {copied === "key" ? "✓ Kopiert" : "Kopieren"}
          </Btn>
        </div>
        <div style={{ fontSize:11, color:T.muted, marginTop:8 }}>
          Dieser Schlüssel authentifiziert alle API-Anfragen von datesetzer.de.
        </div>
      </div>

      {/* Status + Test */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
        <div style={{ background:T.inkSoft, border:`1px solid ${T.border}`, padding:"16px 18px" }}>
          <div style={{ fontSize:8, letterSpacing:3, textTransform:"uppercase", color:T.gold, marginBottom:12 }}>Endpunkte</div>
          {[["Inbound (Formular)", "/api/public/inbound"],["Status","/api/health"]].map(([k,v]) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${T.border}` }}>
              <span style={{ fontSize:10, color:T.muted }}>{k}</span>
              <code style={{ fontSize:10, color:T.cream, fontFamily:"monospace" }}>{v}</code>
            </div>
          ))}
        </div>
        <div style={{ background:T.inkSoft, border:`1px solid ${T.border}`, padding:"16px 18px" }}>
          <div style={{ fontSize:8, letterSpacing:3, textTransform:"uppercase", color:T.gold, marginBottom:12 }}>Integration testen</div>
          <div style={{ fontSize:12, color:T.muted, marginBottom:14, lineHeight:1.6 }}>
            Sendet einen Test-Lead und prüft ob die Verbindung funktioniert.
          </div>
          <Btn onClick={test} loading={testing}>Test senden</Btn>
          {testOk && (
            <div style={{ marginTop:10, padding:"8px 12px", background:"rgba(52,211,153,.08)",
              border:"1px solid rgba(52,211,153,.2)", fontSize:11, color:T.green }}>
              ✓ Test-Lead wurde angelegt
            </div>
          )}
        </div>
      </div>

      {/* Code snippets */}
      {[
        { label:"HTML Formular — für datesetzer.de", code:snippet, key:"html" },
        { label:"cURL — direkter API-Aufruf", code:curlSnippet, key:"curl" },
      ].map(s => (
        <div key={s.key} style={{ background:T.inkSoft, border:`1px solid ${T.border}`, marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"10px 16px", borderBottom:`1px solid ${T.border}` }}>
            <div style={{ fontSize:8, letterSpacing:3, textTransform:"uppercase", color:T.gold }}>{s.label}</div>
            <Btn variant="ghost" small onClick={() => copy(s.key, s.code)}>
              {copied === s.key ? "✓ Kopiert" : "Kopieren"}
            </Btn>
          </div>
          <pre style={{ padding:18, fontSize:11, color:T.creamDim, fontFamily:"monospace",
            lineHeight:1.75, overflowX:"auto", margin:0, whiteSpace:"pre-wrap" }}>{s.code}</pre>
        </div>
      ))}
    </div>
  );
}
