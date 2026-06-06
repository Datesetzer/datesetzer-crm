"use client";
import { useState } from "react";
import { Avatar, Badge, Btn, Input, Modal, T, fmtDate, fmtEur } from "@/components/ui";
import { supabaseBrowser } from "@/lib/supabase/client";
import { toast } from "sonner";

const STATUS: Record<string, { label: string; c: string }> = {
  ACTIVE:    { label: "Aktiv",    c: "green" },
  PAUSED:    { label: "Pausiert", c: "gold" },
  CHURNED:   { label: "Beendet", c: "red" },
  COMPLETED: { label: "Abgeschl.", c: "muted" },
};

export function CustomersView({ initialCustomers, orgId }: any) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [selected, setSelected] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newC, setNewC] = useState({ first_name:"", last_name:"", email:"", phone:"", company:"", package:"Executive", status:"ACTIVE", revenue:3600, notes:"" });

  const add = async () => {
    if (!newC.first_name) { toast.error("Vorname ist Pflicht"); return; }
    setAdding(true);
    const sb = supabaseBrowser();
    const { data, error } = await sb.from("customers").insert({ ...newC, org_id: orgId }).select().single();
    setAdding(false);
    if (error) { toast.error(error.message); return; }
    setCustomers((p: any[]) => [data, ...p]);
    setShowAdd(false);
    toast.success("Kunde angelegt");
  };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ padding:"12px 20px", borderBottom:`1px solid ${T.border}`,
        display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
        <div style={{ fontSize:12, color:T.muted }}>{customers.length} Kunden</div>
        <Btn small onClick={() => setShowAdd(true)}>+ Neuer Kunde</Btn>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:20 }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
          {customers.map((c: any) => {
            const st = STATUS[c.status] ?? { label: c.status, c: "muted" };
            return (
              <div key={c.id} onClick={() => setSelected(c)}
                style={{ background:T.inkSoft, border:`1px solid ${T.border}`, padding:18,
                  cursor:"pointer", transition:"border-color .15s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = T.goldLine)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
                <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:12,
                  paddingBottom:12, borderBottom:`1px solid ${T.border}` }}>
                  <Avatar name={`${c.first_name} ${c.last_name}`} size={38} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:T.cream, fontWeight:400 }}>{c.first_name} {c.last_name}</div>
                    <div style={{ fontSize:11, color:T.muted }}>{c.package}{c.company ? ` · ${c.company}` : ""}</div>
                  </div>
                  <Badge color={st.c} small>{st.label}</Badge>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[["Umsatz", fmtEur(c.revenue||0)], ["Seit", fmtDate(c.started_at)]].map(([k,v]) => (
                    <div key={k}>
                      <div style={{ fontSize:8, letterSpacing:2, textTransform:"uppercase", color:T.muted, marginBottom:2 }}>{k}</div>
                      <div style={{ fontSize:13, color:T.cream, fontFamily: k==="Umsatz" ? "var(--ff-d)" : "inherit", fontWeight:300 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <Modal title={`${selected.first_name} ${selected.last_name}`} onClose={() => setSelected(null)} wide>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {[["E-Mail",selected.email||"—"],["Telefon",selected.phone||"—"],["Unternehmen",selected.company||"—"],
              ["Paket",selected.package],["Status",STATUS[selected.status]?.label||selected.status],
              ["Seit",fmtDate(selected.started_at)],["Umsatz",fmtEur(selected.revenue||0)]].map(([k,v]) => (
              <div key={k}>
                <div style={{ fontSize:8, letterSpacing:2, textTransform:"uppercase", color:T.muted, marginBottom:3 }}>{k}</div>
                <div style={{ fontSize:13, color:T.cream }}>{v}</div>
              </div>
            ))}
            {selected.notes && (
              <div style={{ gridColumn:"1/3" }}>
                <div style={{ fontSize:8, letterSpacing:2, textTransform:"uppercase", color:T.muted, marginBottom:3 }}>Notizen</div>
                <div style={{ fontSize:13, color:T.creamDim, lineHeight:1.8 }}>{selected.notes}</div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {showAdd && (
        <Modal title="Neuen Kunden anlegen" onClose={() => setShowAdd(false)} wide>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
            <Input label="Vorname *" value={newC.first_name} onChange={v=>setNewC(p=>({...p,first_name:v}))} />
            <Input label="Nachname" value={newC.last_name} onChange={v=>setNewC(p=>({...p,last_name:v}))} />
            <Input label="E-Mail" value={newC.email} onChange={v=>setNewC(p=>({...p,email:v}))} type="email" />
            <Input label="Telefon" value={newC.phone} onChange={v=>setNewC(p=>({...p,phone:v}))} />
            <Input label="Paket" value={newC.package} onChange={v=>setNewC(p=>({...p,package:v}))} options={["Standard","Executive","VIP Premium"]} />
            <Input label="Status" value={newC.status} onChange={v=>setNewC(p=>({...p,status:v}))} options={["ACTIVE","PAUSED","CHURNED"]} />
            <Input label="Umsatz (€)" value={newC.revenue} onChange={v=>setNewC(p=>({...p,revenue:Number(v)}))} type="number" />
          </div>
          <div style={{ marginBottom:14 }}>
            <Input label="Notizen" value={newC.notes} onChange={v=>setNewC(p=>({...p,notes:v}))} multiline />
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <Btn onClick={add} loading={adding}>Anlegen</Btn>
            <Btn variant="outline" onClick={() => setShowAdd(false)}>Abbrechen</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
