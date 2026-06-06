"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Avatar, T, fmtEur, scoreColor } from "@/components/ui";
import { toast } from "sonner";

export function PipelineView({ stages, initialLeads, orgId }: any) {
  const [leads, setLeads] = useState(initialLeads);
  const [dragging, setDragging] = useState<any>(null);
  const [dragOver, setDragOver] = useState<string|null>(null);

  const drop = async (stageId: string) => {
    if (!dragging || dragging.stage_id === stageId) { setDragging(null); setDragOver(null); return; }
    const sb = supabaseBrowser();
    await sb.from("leads").update({ stage_id: stageId }).eq("id", dragging.id);
    setLeads((p: any[]) => p.map(l => l.id === dragging.id ? { ...l, stage_id: stageId } : l));
    const stg = stages.find((s: any) => s.id === stageId);
    toast.success(`${dragging.first_name} → ${stg?.name}`);
    setDragging(null); setDragOver(null);
  };

  const totalPipe = leads.filter((l: any) => !["s5","s6"].includes(l.stage_id)).reduce((s: number, l: any) => s + Number(l.value), 0);

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ padding:"10px 20px", borderBottom:`1px solid ${T.border}`, flexShrink:0,
        display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ fontFamily:"var(--ff-d)", fontSize:15, color:T.cream, fontWeight:300 }}>
          Pipeline · <em style={{ color:T.gold, fontStyle:"italic" }}>{fmtEur(totalPipe)}</em>
        </div>
        <div style={{ fontSize:11, color:T.muted }}>{leads.length} Leads · {stages.length} Stages</div>
      </div>
      <div style={{ flex:1, overflow:"auto", display:"flex", gap:10, padding:"14px 14px 14px" }}>
        {stages.map((stage: any) => {
          const sl = leads.filter((l: any) => l.stage_id === stage.id);
          const sv = sl.reduce((s: number, l: any) => s + Number(l.value), 0);
          const isOver = dragOver === stage.id;
          return (
            <div key={stage.id} style={{ width:216, flexShrink:0, display:"flex", flexDirection:"column", gap:8 }}
              onDragOver={e => { e.preventDefault(); setDragOver(stage.id); }}
              onDrop={() => drop(stage.id)}
              onDragLeave={() => setDragOver(null)}>
              {/* Header */}
              <div style={{ padding:"9px 12px", background:T.inkSoft,
                border:`1px solid ${isOver ? stage.color : T.border}`, transition:"border-color .15s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:stage.color }} />
                  <span style={{ fontSize:9, letterSpacing:2, textTransform:"uppercase",
                    fontWeight:500, color:stage.color, flex:1 }}>{stage.name}</span>
                  <span style={{ fontSize:10, color:T.muted }}>{sl.length}</span>
                </div>
                <div style={{ fontSize:11, color:T.muted }}>{fmtEur(sv)}</div>
              </div>
              {/* Cards */}
              <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:6,
                minHeight:60, border: isOver ? `1px dashed ${stage.color}` : "1px solid transparent",
                transition:"border .15s", padding:2 }}>
                {sl.map((l: any) => (
                  <div key={l.id} draggable onDragStart={() => setDragging(l)}
                    style={{ background:T.inkSoft, border:`1px solid ${T.border}`,
                      padding:"10px 12px", cursor:"grab", userSelect:"none", transition:"all .15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = stage.color; e.currentTarget.style.transform = "translateY(-1px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "none"; }}>
                    <div style={{ display:"flex", gap:7, alignItems:"center", marginBottom:7 }}>
                      <Avatar name={`${l.first_name} ${l.last_name}`} size={24} />
                      <div>
                        <div style={{ fontSize:11, color:T.cream, fontWeight:400, lineHeight:1.2 }}>{l.first_name} {l.last_name}</div>
                        <div style={{ fontSize:9, color:T.muted }}>{l.company || l.source}</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:12, color:T.gold, fontFamily:"var(--ff-d)", fontWeight:300 }}>{fmtEur(l.value||0)}</span>
                      <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                        <div style={{ width:3, height:3, borderRadius:"50%", background:scoreColor(l.score) }} />
                        <span style={{ fontSize:9, color:T.muted }}>{l.score}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {sl.length === 0 && (
                  <div style={{ color:T.muted, fontSize:10, textAlign:"center", padding:"14px 0", letterSpacing:1 }}>
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
