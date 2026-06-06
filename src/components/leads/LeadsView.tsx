"use client";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Avatar, Badge, Btn, Input, Modal, ScoreRing, Skel, T, fmtDate, fmtEur, scoreColor } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase/client";

const SOURCES = ["WEBSITE","LINKEDIN","INSTAGRAM","REFERRAL","COLD_OUTREACH","EVENT","OTHER"];

function LeadDetail({ lead, stages, profiles, onClose, onUpdated }: any) {
  const [tab, setTab] = useState<"info"|"edit"|"activity"|"ai">("info");
  const [edit, setEdit] = useState({ ...lead });
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [newAct, setNewAct] = useState({ type: "Email", text: "" });
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActs, setLoadingActs] = useState(false);
  const router = useRouter();

  const save = async () => {
    setSaving(true);
    const sb = supabaseBrowser();
    const { error } = await sb.from("leads").update({
      first_name: edit.first_name, last_name: edit.last_name,
      email: edit.email, phone: edit.phone, company: edit.company,
      title: edit.title, stage_id: edit.stage_id, score: edit.score,
      value: edit.value, notes: edit.notes, assignee_id: edit.assignee_id,
    }).eq("id", lead.id);
    setSaving(false);
    if (error) { toast.error("Fehler beim Speichern"); return; }
    toast.success("Lead gespeichert");
    onUpdated(edit);
  };

  const loadActivities = async () => {
    if (tab !== "activity") return;
    setLoadingActs(true);
    const sb = supabaseBrowser();
    const { data } = await sb.from("activities")
      .select("*, profile:profiles(name)").eq("lead_id", lead.id).order("created_at", { ascending: false });
    setActivities(data ?? []);
    setLoadingActs(false);
  };

  const addActivity = async () => {
    if (!newAct.text.trim()) return;
    const sb = supabaseBrowser();
    await sb.from("activities").insert({
      org_id: lead.org_id, lead_id: lead.id, type: "NOTE",
      title: newAct.type, description: newAct.text,
    });
    setNewAct({ type: "Email", text: "" });
    loadActivities();
    toast.success("Aktivität hinzugefügt");
  };

  const runAI = async () => {
    setAiLoading(true); setAiResult(null);
    try {
      const stage = stages.find((s: any) => s.id === edit.stage_id);
      const res = await fetch("/api/ai/score-lead", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead: edit, stageName: stage?.name }),
      });
      const d = await res.json();
      setAiResult(d);
      if (d.score) setEdit((e: any) => ({ ...e, score: d.score }));
    } catch { toast.error("KI-Analyse fehlgeschlagen"); }
    setAiLoading(false);
  };

  const stage = stages.find((s: any) => s.id === edit.stage_id);
  const Tab = ({ id, label }: { id: any; label: string }) => (
    <button onClick={() => { setTab(id); if (id === "activity") loadActivities(); }}
      style={{ padding:"7px 13px", fontSize:9, letterSpacing:2, textTransform:"uppercase",
        fontWeight:500, background:"none", border:"none",
        borderBottom: tab === id ? `2px solid ${T.gold}` : "2px solid transparent",
        color: tab === id ? T.gold : T.muted, cursor:"pointer" }}>{label}</button>
  );

  return (
    <Modal title={`${lead.first_name} ${lead.last_name}`} onClose={onClose} wide>
      {/* Header */}
      <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:16,
        paddingBottom:14, borderBottom:`1px solid ${T.border}` }}>
        <Avatar name={`${lead.first_name} ${lead.last_name}`} size={46} />
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, color:T.muted, marginBottom:5 }}>
            {edit.title}{edit.company ? ` · ${edit.company}` : ""}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <ScoreRing score={edit.score} size={42} />
            <div style={{ flex:1, height:2, background:T.border, borderRadius:1 }}>
              <div style={{ width:`${edit.score}%`, height:"100%", background:scoreColor(edit.score), transition:"width .5s" }} />
            </div>
          </div>
        </div>
        {stage && <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:stage.color }} />
          <span style={{ fontSize:10, color:stage.color }}>{stage.name}</span>
        </div>}
      </div>
      {/* Tabs */}
      <div style={{ display:"flex", borderBottom:`1px solid ${T.border}`, marginBottom:16 }}>
        <Tab id="info" label="Info" /><Tab id="edit" label="Bearbeiten" />
        <Tab id="activity" label="Aktivitäten" /><Tab id="ai" label="KI-Analyse" />
      </div>

      {tab === "info" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {[["E-Mail", edit.email||"—"],["Telefon", edit.phone||"—"],["Unternehmen", edit.company||"—"],
            ["Quelle", edit.source||"—"],["Erstellt", fmtDate(edit.created_at)],["Wert", fmtEur(edit.value||0)]
          ].map(([k,v]) => (
            <div key={k}>
              <div style={{ fontSize:8, letterSpacing:2, textTransform:"uppercase", color:T.muted, marginBottom:3 }}>{k}</div>
              <div style={{ fontSize:13, color:T.cream }}>{v}</div>
            </div>
          ))}
          {edit.notes && (
            <div style={{ gridColumn:"1/3" }}>
              <div style={{ fontSize:8, letterSpacing:2, textTransform:"uppercase", color:T.muted, marginBottom:3 }}>Notizen</div>
              <div style={{ fontSize:13, color:T.creamDim, lineHeight:1.8 }}>{edit.notes}</div>
            </div>
          )}
        </div>
      )}

      {tab === "edit" && (
        <div style={{ display:"grid", gap:14 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Input label="Vorname" value={edit.first_name||""} onChange={v=>setEdit((e:any)=>({...e,first_name:v}))} />
            <Input label="Nachname" value={edit.last_name||""} onChange={v=>setEdit((e:any)=>({...e,last_name:v}))} />
            <Input label="E-Mail" value={edit.email||""} onChange={v=>setEdit((e:any)=>({...e,email:v}))} type="email" />
            <Input label="Telefon" value={edit.phone||""} onChange={v=>setEdit((e:any)=>({...e,phone:v}))} />
            <Input label="Unternehmen" value={edit.company||""} onChange={v=>setEdit((e:any)=>({...e,company:v}))} />
            <Input label="Stage" value={edit.stage_id||""} onChange={v=>setEdit((e:any)=>({...e,stage_id:v}))}
              options={stages.map((s:any)=>({value:s.id,label:s.name}))} />
            <Input label="Wert (€)" value={edit.value||0} onChange={v=>setEdit((e:any)=>({...e,value:Number(v)}))} type="number" />
            <div>
              <label style={{ display:"block", fontSize:9, letterSpacing:2.5, textTransform:"uppercase",
                color:T.muted, marginBottom:5, fontWeight:500 }}>Score: {edit.score}</label>
              <input type="range" min={0} max={100} value={edit.score}
                onChange={e=>setEdit((p:any)=>({...p,score:Number(e.target.value)}))}
                style={{ width:"100%", accentColor:T.gold }} />
            </div>
          </div>
          <Input label="Notizen" value={edit.notes||""} onChange={v=>setEdit((e:any)=>({...e,notes:v}))} multiline />
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={save} loading={saving}>Speichern</Btn>
            <Btn variant="outline" onClick={onClose}>Abbrechen</Btn>
          </div>
        </div>
      )}

      {tab === "activity" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"auto 1fr auto", gap:8, marginBottom:16, alignItems:"flex-end" }}>
            <div style={{ minWidth:110 }}>
              <Input label="Typ" value={newAct.type} onChange={v=>setNewAct(a=>({...a,type:v}))}
                options={["Email","Anruf","Meeting","Notiz","Vertrag"]} small />
            </div>
            <Input label="Beschreibung" value={newAct.text} onChange={v=>setNewAct(a=>({...a,text:v}))}
              placeholder="Aktivität beschreiben…" small />
            <div style={{ paddingBottom:1 }}><Btn variant="ghost" small onClick={addActivity}>+</Btn></div>
          </div>
          {loadingActs && <Skel h={40} mb={8} />}
          {activities.length === 0 && !loadingActs && (
            <div style={{ color:T.muted, fontSize:12 }}>Noch keine Aktivitäten.</div>
          )}
          {activities.map((a: any) => (
            <div key={a.id} style={{ display:"flex", gap:9, padding:"9px 0", borderBottom:`1px solid ${T.border}` }}>
              <div style={{ width:4, height:4, borderRadius:"50%", background:T.gold, marginTop:6, flexShrink:0 }} />
              <div>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:2 }}>
                  <Badge color="gold" small>{a.title}</Badge>
                  <span style={{ fontSize:10, color:T.muted }}>{fmtDate(a.created_at)}</span>
                  {a.profile?.name && <span style={{ fontSize:10, color:T.muted }}>{a.profile.name}</span>}
                </div>
                <div style={{ fontSize:12, color:T.creamDim, lineHeight:1.6 }}>{a.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "ai" && (
        <div>
          <div style={{ background:T.goldGlow, border:`1px solid ${T.goldLine}`, padding:"14px 16px", marginBottom:16 }}>
            <div style={{ fontSize:9, letterSpacing:3, textTransform:"uppercase", color:T.gold, marginBottom:6 }}>KI Lead-Analyse</div>
            <div style={{ fontSize:12, color:T.creamDim, lineHeight:1.7, marginBottom:12 }}>
              Claude analysiert diesen Lead vollständig und gibt dir Score, Abschlusswahrscheinlichkeit und konkrete Handlungsempfehlungen.
            </div>
            <Btn onClick={runAI} loading={aiLoading}>{aiLoading ? "Analysiere…" : "KI-Analyse starten"}</Btn>
          </div>
          {aiLoading && <><Skel h={60} mb={8}/><Skel h={40} mb={8} w="80%"/><Skel h={40} w="60%"/></>}
          {aiResult && !aiLoading && (
            <div className="afu" style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div style={{ background:T.inkMid, border:`1px solid ${T.border}`, padding:"14px 16px", textAlign:"center" }}>
                  <div style={{ fontSize:8, letterSpacing:3, textTransform:"uppercase", color:T.muted, marginBottom:8 }}>KI-Score</div>
                  <ScoreRing score={aiResult.score} size={60} />
                </div>
                <div style={{ background:T.inkMid, border:`1px solid ${T.border}`, padding:"14px 16px", textAlign:"center" }}>
                  <div style={{ fontSize:8, letterSpacing:3, textTransform:"uppercase", color:T.muted, marginBottom:8 }}>Abschlusswahrsch.</div>
                  <div style={{ fontFamily:"var(--ff-d)", fontSize:34, fontWeight:300, color:scoreColor(aiResult.probability) }}>
                    {aiResult.probability}%
                  </div>
                </div>
              </div>
              <div style={{ background:T.inkMid, border:`1px solid ${T.border}`, padding:"14px 16px" }}>
                <div style={{ fontSize:9, letterSpacing:2, textTransform:"uppercase", color:T.gold, marginBottom:8 }}>Bewertung</div>
                <div style={{ fontSize:13, color:T.creamDim, lineHeight:1.8 }}>{aiResult.reasoning}</div>
              </div>
              <div style={{ background:T.inkMid, border:`1px solid ${T.border}`, padding:"14px 16px" }}>
                <div style={{ fontSize:9, letterSpacing:2, textTransform:"uppercase", color:T.gold, marginBottom:10 }}>Empfehlungen</div>
                {aiResult.actions?.map((a: string, i: number) => (
                  <div key={i} style={{ display:"flex", gap:10, padding:"6px 0",
                    borderBottom: i < aiResult.actions.length-1 ? `1px solid ${T.border}` : "none" }}>
                    <div style={{ width:18, height:18, borderRadius:"50%", border:`1px solid ${T.goldLine}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:9, color:T.gold, flexShrink:0 }}>{i+1}</div>
                    <div style={{ fontSize:12, color:T.creamDim, lineHeight:1.6 }}>{a}</div>
                  </div>
                ))}
              </div>
              <Btn variant="ghost" small onClick={save}>Score übernehmen ({aiResult.score}) & speichern</Btn>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export function LeadsView({ initialLeads, stages, profiles, orgId, userId }: any) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("ALL");
  const [sort, setSort] = useState("created_at");
  const [selected, setSelected] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<string|null>(null);
  const [newLead, setNewLead] = useState({
    first_name:"", last_name:"", email:"", phone:"", company:"", title:"",
    source:"WEBSITE", stage_id: stages[0]?.id || "", value:3600, score:50, notes:"",
  });
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads
      .filter((l: any) => {
        const match = (`${l.first_name} ${l.last_name} ${l.email||""} ${l.company||""}`).toLowerCase().includes(q);
        const stageOk = filterStage === "ALL" || l.stage_id === filterStage;
        return match && stageOk;
      })
      .sort((a: any, b: any) => sort === "score" ? b.score - a.score :
        sort === "value" ? b.value - a.value :
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [leads, search, filterStage, sort]);

  const handleAdd = async () => {
    if (!newLead.first_name || !newLead.last_name) { toast.error("Vor- und Nachname sind Pflicht"); return; }
    setAdding(true);
    const sb = supabaseBrowser();
    const { data: pipeline } = await sb.from("pipelines").select("id").eq("org_id", orgId).eq("is_default", true).single();
    const { data, error } = await sb.from("leads").insert({
      org_id: orgId, pipeline_id: pipeline?.id, created_by_id: userId,
      first_name: newLead.first_name, last_name: newLead.last_name,
      email: newLead.email || null, phone: newLead.phone || null,
      company: newLead.company || null, title: newLead.title || null,
      source: newLead.source, stage_id: newLead.stage_id,
      value: newLead.value, score: newLead.score, notes: newLead.notes || null,
    }).select("*, stage:pipeline_stages(id,name,color)").single();
    setAdding(false);
    if (error) { toast.error("Fehler: " + error.message); return; }
    setLeads((p: any[]) => [data, ...p]);
    setShowAdd(false);
    toast.success(`Lead ${newLead.first_name} ${newLead.last_name} angelegt`);
    setNewLead({ first_name:"", last_name:"", email:"", phone:"", company:"", title:"",
      source:"WEBSITE", stage_id:stages[0]?.id||"", value:3600, score:50, notes:"" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Lead wirklich löschen?")) return;
    setDeleting(id);
    const sb = supabaseBrowser();
    await sb.from("leads").delete().eq("id", id);
    setLeads((p: any[]) => p.filter(l => l.id !== id));
    setDeleting(null);
    toast.success("Lead gelöscht");
  };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Actions bar */}
      <div style={{ padding:"14px 20px", borderBottom:`1px solid ${T.border}`,
        display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", flexShrink:0 }}>
        {/* Search */}
        <div style={{ flex:1, minWidth:180, position:"relative" }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Suche nach Name, E-Mail, Unternehmen…"
            style={{ width:"100%", background:T.inkSoft, border:`1px solid ${T.border}`, color:T.cream,
              padding:"8px 12px 8px 30px", fontSize:12, outline:"none", fontFamily:"'Jost',sans-serif", fontWeight:300 }} />
          <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)",
            color:T.muted, fontSize:13, pointerEvents:"none" }}>⌕</span>
        </div>
        {/* Stage filter */}
        <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
          {[{ id:"ALL", name:"Alle" }, ...stages].map((s: any) => (
            <button key={s.id} onClick={()=>setFilterStage(s.id)}
              style={{ padding:"6px 11px", fontSize:9, letterSpacing:1.5, textTransform:"uppercase",
                fontWeight:500, background: filterStage===s.id ? T.goldDim : "transparent",
                border:`1px solid ${filterStage===s.id ? T.goldLine : T.border}`,
                color: filterStage===s.id ? T.gold : T.muted, cursor:"pointer" }}>{s.name}</button>
          ))}
        </div>
        <select value={sort} onChange={e=>setSort(e.target.value)}
          style={{ background:T.inkSoft, border:`1px solid ${T.border}`, color:T.muted,
            padding:"7px 10px", fontSize:10, fontFamily:"'Jost',sans-serif", cursor:"pointer", outline:"none" }}>
          <option value="created_at">Neueste</option>
          <option value="score">Score ↓</option>
          <option value="value">Wert ↓</option>
        </select>
        <Btn onClick={()=>setShowAdd(true)}>+ Neuer Lead</Btn>
      </div>

      {/* Table */}
      <div style={{ flex:1, overflowY:"auto" }}>
        <div style={{ background:T.inkSoft, borderBottom:`1px solid ${T.border}` }}>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 100px 80px 100px 64px",
            gap:12, padding:"7px 16px", fontSize:8, letterSpacing:2.5, textTransform:"uppercase",
            color:T.muted, borderBottom:`1px solid ${T.border}` }}>
            <span>Name</span><span>Kontakt</span><span>Stage</span><span>Score</span><span>Wert</span><span></span>
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"40px 0", color:T.muted, fontSize:13 }}>Keine Leads gefunden.</div>
          )}

          {filtered.map((l: any) => {
            const stage = l.stage || stages.find((s: any) => s.id === l.stage_id);
            return (
              <div key={l.id}
                style={{ display:"grid", gridTemplateColumns:"2fr 1.5fr 100px 80px 100px 64px",
                  gap:12, padding:"11px 16px", borderBottom:`1px solid ${T.border}`,
                  alignItems:"center", cursor:"pointer", transition:"background .13s" }}
                onMouseEnter={e=>(e.currentTarget.style.background="rgba(240,233,218,.02)")}
                onMouseLeave={e=>(e.currentTarget.style.background="transparent")}
                onClick={()=>setSelected(l)}>
                <div style={{ display:"flex", gap:9, alignItems:"center" }}>
                  <Avatar name={`${l.first_name} ${l.last_name}`} size={32} />
                  <div>
                    <div style={{ fontSize:13, color:T.cream, fontWeight:400 }}>{l.first_name} {l.last_name}</div>
                    <div style={{ fontSize:10, color:T.muted }}>{l.company || l.title || l.source}</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:T.creamDim, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {l.email || "—"}
                  </div>
                  <div style={{ fontSize:10, color:T.muted }}>{l.source}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  {stage && <><div style={{ width:5, height:5, borderRadius:"50%", background:stage.color }} />
                    <span style={{ fontSize:10, color:stage.color }}>{stage.name}</span></>}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ flex:1, height:2, background:T.border }}>
                    <div style={{ width:`${l.score}%`, height:"100%", background:scoreColor(l.score) }} />
                  </div>
                  <span style={{ fontSize:10, color:scoreColor(l.score), minWidth:22, textAlign:"right" }}>{l.score}</span>
                </div>
                <div style={{ fontSize:13, color:T.cream, fontFamily:"var(--ff-d)", fontWeight:300 }}>
                  {fmtEur(l.value || 0)}
                </div>
                <div style={{ display:"flex", gap:5 }}>
                  <button onClick={e=>{e.stopPropagation();setSelected(l);}}
                    style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:12 }}>✎</button>
                  <button onClick={e=>{e.stopPropagation();handleDelete(l.id);}}
                    style={{ background:"none", border:"none", color:T.red, cursor:"pointer",
                      fontSize:12, opacity: deleting===l.id ? 0.4 : 0.7 }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding:"10px 16px", fontSize:11, color:T.muted }}>
          {filtered.length} von {leads.length} Leads
        </div>
      </div>

      {/* Lead detail */}
      {selected && (
        <LeadDetail lead={selected} stages={stages} profiles={profiles}
          onClose={()=>setSelected(null)}
          onUpdated={(upd: any)=>{ setLeads((p: any[])=>p.map(l=>l.id===upd.id?{...l,...upd}:l)); setSelected(upd); }} />
      )}

      {/* Add lead modal */}
      {showAdd && (
        <Modal title="Neuen Lead anlegen" onClose={()=>setShowAdd(false)} wide>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
            <Input label="Vorname *" value={newLead.first_name} onChange={v=>setNewLead(p=>({...p,first_name:v}))} />
            <Input label="Nachname *" value={newLead.last_name} onChange={v=>setNewLead(p=>({...p,last_name:v}))} />
            <Input label="E-Mail" value={newLead.email} onChange={v=>setNewLead(p=>({...p,email:v}))} type="email" />
            <Input label="Telefon" value={newLead.phone} onChange={v=>setNewLead(p=>({...p,phone:v}))} />
            <Input label="Unternehmen" value={newLead.company} onChange={v=>setNewLead(p=>({...p,company:v}))} />
            <Input label="Titel" value={newLead.title} onChange={v=>setNewLead(p=>({...p,title:v}))} />
            <Input label="Quelle" value={newLead.source} onChange={v=>setNewLead(p=>({...p,source:v}))} options={SOURCES} />
            <Input label="Stage" value={newLead.stage_id} onChange={v=>setNewLead(p=>({...p,stage_id:v}))}
              options={stages.map((s:any)=>({value:s.id,label:s.name}))} />
            <Input label="Wert (€)" value={newLead.value} onChange={v=>setNewLead(p=>({...p,value:Number(v)}))} type="number" />
            <div>
              <label style={{ display:"block", fontSize:9, letterSpacing:2.5, textTransform:"uppercase",
                color:T.muted, marginBottom:5, fontWeight:500 }}>Score: {newLead.score}</label>
              <input type="range" min={0} max={100} value={newLead.score}
                onChange={e=>setNewLead(p=>({...p,score:Number(e.target.value)}))}
                style={{ width:"100%", accentColor:T.gold }} />
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <Input label="Notizen" value={newLead.notes} onChange={v=>setNewLead(p=>({...p,notes:v}))} multiline />
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={handleAdd} loading={adding}>Lead anlegen</Btn>
            <Btn variant="outline" onClick={()=>setShowAdd(false)}>Abbrechen</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
