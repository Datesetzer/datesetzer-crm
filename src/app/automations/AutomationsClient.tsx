"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Badge, Btn, T } from "@/components/ui";
import { toast } from "sonner";

const DEFAULT_AUTOS = [
  { id:"d1", name:"Willkommensmail — Neuer Lead", trigger:"LEAD_CREATED", is_active:true, run_count:47,
    description:"Sendet automatisch eine personalisierte Willkommensmail wenn ein neuer Lead angelegt wird." },
  { id:"d2", name:"Follow-up nach 48h", trigger:"LEAD_CREATED", is_active:true, run_count:31,
    description:"Erstellt eine Follow-up Aufgabe 48 Stunden nach Lead-Erstellung." },
  { id:"d3", name:"Deal-Won Benachrichtigung", trigger:"LEAD_WON", is_active:true, run_count:12,
    description:"Benachrichtigt das Team wenn ein Deal gewonnen wird." },
  { id:"d4", name:"Score-Update bei Stagewechsel", trigger:"LEAD_STAGE_CHANGED", is_active:false, run_count:0,
    description:"Passt den Lead-Score an wenn sich die Stage ändert." },
];

const TRIGGER_LABELS: Record<string, string> = {
  LEAD_CREATED:"Lead erstellt", LEAD_WON:"Deal gewonnen",
  LEAD_STAGE_CHANGED:"Stage gewechselt", LEAD_LOST:"Lead verloren",
};

export function AutomationsClient({ initialAutos, orgId }: any) {
  const [autos, setAutos] = useState(initialAutos.length ? initialAutos : DEFAULT_AUTOS);

  const toggle = async (auto: any) => {
    if (auto.id.startsWith("d")) {
      setAutos((p: any[]) => p.map(a => a.id === auto.id ? { ...a, is_active: !a.is_active } : a));
      toast.success(auto.is_active ? "Automation deaktiviert" : "Automation aktiviert");
      return;
    }
    const sb = supabaseBrowser();
    await sb.from("automations").update({ is_active: !auto.is_active }).eq("id", auto.id);
    setAutos((p: any[]) => p.map(a => a.id === auto.id ? { ...a, is_active: !a.is_active } : a));
    toast.success(auto.is_active ? "Automation deaktiviert" : "Automation aktiviert");
  };

  return (
    <div style={{ flex:1, overflowY:"auto", padding:20 }}>
      <div style={{ background:T.goldGlow, border:`1px solid ${T.goldLine}`, padding:"14px 18px",
        marginBottom:20, display:"flex", gap:12, alignItems:"center" }}>
        <span style={{ fontSize:18 }}>⟳</span>
        <div>
          <div style={{ fontSize:12, color:T.cream, fontWeight:400, marginBottom:2 }}>Smart Automations</div>
          <div style={{ fontSize:11, color:T.muted }}>
            Automatische Workflows laufen im Hintergrund und sparen täglich wertvolle Zeit.
          </div>
        </div>
      </div>

      {autos.map((a: any) => (
        <div key={a.id} style={{ background:T.inkSoft, border:`1px solid ${T.border}`, padding:"14px 18px",
          marginBottom:10, display:"flex", gap:14, alignItems:"center",
          transition:"border-color .15s" }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = T.goldLine)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:4 }}>
              <div style={{ fontSize:13, color:T.cream, fontWeight:400 }}>{a.name}</div>
              <Badge color="muted" small>{TRIGGER_LABELS[a.trigger] || a.trigger}</Badge>
            </div>
            <div style={{ fontSize:11, color:T.muted, lineHeight:1.6 }}>{a.description}</div>
            {a.run_count > 0 && <div style={{ fontSize:10, color:T.muted, marginTop:4 }}>{a.run_count}× ausgeführt</div>}
          </div>
          <button onClick={() => toggle(a)}
            style={{ width:40, height:22, borderRadius:11, background: a.is_active ? T.gold : T.border,
              border:"none", cursor:"pointer", position:"relative", transition:"background .2s", flexShrink:0 }}>
            <span style={{ position:"absolute", top:2, left: a.is_active ? 20 : 2, width:18, height:18,
              borderRadius:"50%", background:T.cream, transition:"left .2s" }} />
          </button>
        </div>
      ))}
    </div>
  );
}
