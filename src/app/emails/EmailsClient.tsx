"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Btn, Input, Modal, T, fmtDate } from "@/components/ui";
import { toast } from "sonner";

const STATUS_ICON: Record<string, string> = { OPENED:"👁", CLICKED:"🖱", DELIVERED:"✓", QUEUED:"⏳", BOUNCED:"✕", SENT:"✓" };
const STATUS_COL: Record<string, string>  = { OPENED:T.green, CLICKED:T.blue, DELIVERED:T.muted, QUEUED:T.gold, BOUNCED:T.red, SENT:T.muted };

export function EmailsClient({ initialLogs, leads, orgId }: any) {
  const [logs, setLogs]         = useState(initialLogs);
  const [showCompose, setShow]  = useState(false);
  const [to, setTo]             = useState("");
  const [subject, setSubject]   = useState("");
  const [body, setBody]         = useState("");
  const [sending, setSending]   = useState(false);
  const [aiLoading, setAiLoad]  = useState(false);

  const openRate = logs.length > 0
    ? Math.round(logs.filter((l: any) => ["OPENED","CLICKED"].includes(l.status)).length / logs.length * 100)
    : 0;

  const genAI = async () => {
    if (!to) { toast.error("Bitte zuerst Empfänger angeben"); return; }
    setAiLoad(true);
    const lead = leads.find((l: any) => l.email === to);
    try {
      const res = await fetch("/api/ai/email", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ to, leadName: lead ? `${lead.first_name} ${lead.last_name}` : null }),
      });
      const d = await res.json();
      setSubject(d.subject || ""); setBody(d.body || "");
      toast.success("KI-E-Mail generiert");
    } catch { toast.error("Fehler bei KI-Generierung"); }
    setAiLoad(false);
  };

  const send = async () => {
    if (!to || !subject) { toast.error("Empfänger und Betreff sind Pflicht"); return; }
    setSending(true);
    const sb = supabaseBrowser();
    const { data } = await sb.from("email_logs").insert({
      org_id: orgId, to, subject, status: "SENT", sent_at: new Date().toISOString(),
    }).select().single();
    setSending(false);
    if (data) setLogs((p: any[]) => [data, ...p]);
    setShow(false); setTo(""); setSubject(""); setBody("");
    toast.success(`E-Mail an ${to} gesendet`);
  };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ padding:"12px 20px", borderBottom:`1px solid ${T.border}`,
        display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div style={{ display:"flex", gap:20 }}>
          {[["Versendet",logs.length],["Geöffnet",logs.filter((l:any)=>["OPENED","CLICKED"].includes(l.status)).length],["Öffnungsrate",`${openRate}%`]].map(([k,v]) => (
            <div key={k as string}>
              <div style={{ fontSize:8, letterSpacing:2, textTransform:"uppercase", color:T.muted }}>{k}</div>
              <div style={{ fontFamily:"var(--ff-d)", fontSize:20, color:T.gold, fontWeight:300 }}>{v}</div>
            </div>
          ))}
        </div>
        <Btn small onClick={() => setShow(true)}>+ Neue E-Mail</Btn>
      </div>
      <div style={{ flex:1, overflowY:"auto" }}>
        {logs.length === 0 && <div style={{ padding:40, textAlign:"center", color:T.muted, fontSize:13 }}>Noch keine E-Mails versendet.</div>}
        {logs.map((l: any) => (
          <div key={l.id} style={{ display:"flex", gap:12, padding:"11px 20px",
            borderBottom:`1px solid ${T.border}`, alignItems:"center" }}>
            <span style={{ fontSize:15 }}>{STATUS_ICON[l.status] || "?"}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, color:T.cream, fontWeight:400, overflow:"hidden",
                textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.subject}</div>
              <div style={{ fontSize:10, color:T.muted }}>{l.to}</div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontSize:10, color: STATUS_COL[l.status] || T.muted, letterSpacing:1 }}>{l.status}</div>
              <div style={{ fontSize:10, color:T.muted }}>{fmtDate(l.sent_at || l.created_at)}</div>
            </div>
          </div>
        ))}
      </div>

      {showCompose && (
        <Modal title="Neue E-Mail" onClose={() => setShow(false)} wide>
          <div style={{ display:"grid", gap:14, marginBottom:16 }}>
            <Input label="An" value={to} onChange={setTo} placeholder="email@beispiel.de" type="email" />
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:8, alignItems:"flex-end" }}>
              <Input label="Betreff" value={subject} onChange={setSubject} placeholder="Betreff…" />
              <div style={{ paddingBottom:1 }}><Btn variant="ghost" small onClick={genAI} loading={aiLoading}>KI schreibt</Btn></div>
            </div>
            <Input label="Nachricht" value={body} onChange={setBody} multiline placeholder="E-Mail-Text…" />
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={send} loading={sending}>Senden</Btn>
            <Btn variant="outline" onClick={() => setShow(false)}>Verwerfen</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
