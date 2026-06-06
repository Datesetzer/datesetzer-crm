"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Badge, Btn, Input, Modal, T, fmtDate } from "@/components/ui";
import { toast } from "sonner";

const PRIO_COL: Record<string, string> = { URGENT: T.red, HIGH: T.orange, MEDIUM: T.gold, LOW: T.muted };
const PRIO_BADGE: Record<string, string> = { URGENT: "red", HIGH: "orange", MEDIUM: "gold", LOW: "muted" };

export function TasksView({ initialTasks, orgId, userId }: any) {
  const [tasks, setTasks] = useState(initialTasks);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newT, setNewT] = useState({ title:"", due_at:"", priority:"MEDIUM", description:"" });

  const toggle = async (task: any) => {
    const sb = supabaseBrowser();
    const status = task.status === "DONE" ? "TODO" : "DONE";
    await sb.from("tasks").update({ status, completed_at: status === "DONE" ? new Date().toISOString() : null }).eq("id", task.id);
    setTasks((p: any[]) => p.map(t => t.id === task.id ? { ...t, status } : t));
  };

  const del = async (id: string) => {
    const sb = supabaseBrowser();
    await sb.from("tasks").update({ status: "CANCELLED" }).eq("id", id);
    setTasks((p: any[]) => p.filter(t => t.id !== id));
    toast.success("Aufgabe entfernt");
  };

  const add = async () => {
    if (!newT.title) { toast.error("Titel ist Pflicht"); return; }
    setAdding(true);
    const sb = supabaseBrowser();
    const { data, error } = await sb.from("tasks").insert({
      org_id: orgId, assignee_id: userId,
      title: newT.title, priority: newT.priority,
      due_at: newT.due_at || null, description: newT.description || null,
    }).select().single();
    setAdding(false);
    if (error) { toast.error(error.message); return; }
    setTasks((p: any[]) => [data, ...p]);
    setShowAdd(false);
    setNewT({ title:"", due_at:"", priority:"MEDIUM", description:"" });
    toast.success("Aufgabe erstellt");
  };

  const open = tasks.filter((t: any) => t.status === "TODO");
  const done = tasks.filter((t: any) => t.status === "DONE");
  const overdue = open.filter((t: any) => t.due_at && new Date(t.due_at) < new Date());

  const Row = ({ t }: { t: any }) => (
    <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 0",
      borderBottom:`1px solid ${T.border}`, opacity: t.status === "DONE" ? 0.5 : 1 }}>
      <button onClick={() => toggle(t)}
        style={{ width:18, height:18, border:`1px solid ${t.status==="DONE" ? T.green : T.border}`,
          borderRadius:"50%", background: t.status==="DONE" ? "rgba(52,211,153,.1)" : "transparent",
          display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
          flexShrink:0, fontSize:9, color:T.green, marginTop:2 }}>
        {t.status === "DONE" ? "✓" : ""}
      </button>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, color:T.cream, fontWeight:400,
          textDecoration: t.status==="DONE" ? "line-through" : "none" }}>{t.title}</div>
        {(t.lead || t.description) && (
          <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>
            {t.lead ? `→ ${t.lead.first_name} ${t.lead.last_name}` : t.description}
          </div>
        )}
      </div>
      <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
        <Badge color={PRIO_BADGE[t.priority]||"muted"} small>{t.priority}</Badge>
        {t.due_at && (
          <span style={{ fontSize:10, color: t.status!=="DONE" && new Date(t.due_at)<new Date() ? T.red : T.muted }}>
            {fmtDate(t.due_at)}
          </span>
        )}
        <button onClick={() => del(t.id)}
          style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", opacity:0.6, fontSize:12 }}>✕</button>
      </div>
    </div>
  );

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ padding:"12px 20px", borderBottom:`1px solid ${T.border}`,
        display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <div style={{ fontSize:12, color:T.muted }}>{open.length} offen</div>
          {overdue.length > 0 && (
            <div style={{ background:"rgba(248,113,113,.08)", border:"1px solid rgba(248,113,113,.2)",
              padding:"3px 10px", fontSize:10, color:T.red }}>
              {overdue.length} überfällig
            </div>
          )}
        </div>
        <Btn small onClick={() => setShowAdd(true)}>+ Aufgabe</Btn>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:20 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
          <div>
            <div style={{ fontSize:8, letterSpacing:3, textTransform:"uppercase", color:T.gold, marginBottom:12,
              display:"flex", alignItems:"center", gap:8 }}>
              Offen <span style={{ background:T.goldDim, border:`1px solid ${T.goldLine}`,
                color:T.gold, fontSize:9, padding:"1px 7px" }}>{open.length}</span>
            </div>
            {open.length === 0 && <div style={{ color:T.muted, fontSize:12 }}>Alle Aufgaben erledigt ✓</div>}
            {open.map((t: any) => <Row key={t.id} t={t} />)}
          </div>
          <div>
            <div style={{ fontSize:8, letterSpacing:3, textTransform:"uppercase", color:T.muted, marginBottom:12 }}>
              Erledigt ({done.length})
            </div>
            {done.length === 0 && <div style={{ color:T.muted, fontSize:12 }}>Noch nichts erledigt.</div>}
            {done.map((t: any) => <Row key={t.id} t={t} />)}
          </div>
        </div>
      </div>

      {showAdd && (
        <Modal title="Neue Aufgabe" onClose={() => setShowAdd(false)}>
          <div style={{ display:"grid", gap:14, marginBottom:16 }}>
            <Input label="Titel *" value={newT.title} onChange={v=>setNewT(p=>({...p,title:v}))} placeholder="Aufgabe beschreiben…" />
            <Input label="Fälligkeitsdatum" value={newT.due_at} onChange={v=>setNewT(p=>({...p,due_at:v}))} type="date" />
            <Input label="Priorität" value={newT.priority} onChange={v=>setNewT(p=>({...p,priority:v}))} options={["URGENT","HIGH","MEDIUM","LOW"]} />
            <Input label="Notiz" value={newT.description} onChange={v=>setNewT(p=>({...p,description:v}))} placeholder="Optional…" />
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={add} loading={adding}>Erstellen</Btn>
            <Btn variant="outline" onClick={() => setShowAdd(false)}>Abbrechen</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
