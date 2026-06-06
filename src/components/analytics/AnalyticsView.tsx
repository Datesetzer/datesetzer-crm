"use client";
import { useState } from "react";
import { KPI, Btn, Skel, ScoreRing, T, fmtEur, scoreColor } from "@/components/ui";
import { toast } from "sonner";

export function AnalyticsView({ leads, customers, stages }: any) {
  const [aiReport, setAiReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const won = leads.filter((l: any) => l.status === "won");
  const revenue = customers.filter((c: any) => c.status === "ACTIVE").reduce((s: number, c: any) => s + Number(c.revenue), 0);
  const pipeVal = leads.filter((l: any) => !["won","lost"].includes(l.status)).reduce((s: number, l: any) => s + Number(l.value), 0);
  const weighted = leads.filter((l: any) => !["won","lost"].includes(l.status)).reduce((s: number, l: any) => {
    const st = stages.find((st: any) => st.id === l.stage_id);
    return s + Number(l.value) * ((st?.probability || 0) / 100);
  }, 0);
  const convRate = leads.length > 0 ? Math.round(won.length / leads.length * 100) : 0;
  const avgScore = leads.length > 0 ? Math.round(leads.reduce((s: number, l: any) => s + l.score, 0) / leads.length) : 0;

  const stageCounts = stages.map((s: any) => ({
    ...s, count: leads.filter((l: any) => l.stage_id === s.id).length,
    value: leads.filter((l: any) => l.stage_id === s.id).reduce((sum: number, l: any) => sum + Number(l.value), 0),
  }));

  const srcData = ["WEBSITE","LINKEDIN","INSTAGRAM","REFERRAL","COLD_OUTREACH","OTHER"].map(src => ({
    src, count: leads.filter((l: any) => l.source === src).length,
  })).filter(d => d.count > 0);
  const maxSrc = Math.max(...srcData.map(d => d.count), 1);

  const genReport = async () => {
    setLoading(true); setAiReport(null);
    try {
      const res = await fetch("/api/ai/report", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: leads.length, won: won.length, convRate, revenue, pipeVal, weighted, avgScore }),
      });
      const d = await res.json();
      setAiReport(d);
    } catch { toast.error("KI-Bericht fehlgeschlagen"); }
    setLoading(false);
  };

  return (
    <div style={{ flex:1, overflowY:"auto", padding:20, display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:8, letterSpacing:3, textTransform:"uppercase", color:T.muted }}>
          {leads.length} Leads gesamt · {customers.length} Kunden
        </div>
        <Btn onClick={genReport} loading={loading}>KI-Bericht generieren</Btn>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:10 }}>
        <KPI label="Umsatz" value={fmtEur(revenue)} trend={12} icon="€" />
        <KPI label="Pipeline-Wert" value={fmtEur(pipeVal)} color={T.cream} icon="◈" />
        <KPI label="Gewichteter Forecast" value={fmtEur(Math.round(weighted))} color={T.purple} icon="◬" />
        <KPI label="Conversion" value={`${convRate}%`} color={T.green} icon="%" />
        <KPI label="Ø Score" value={avgScore} color={scoreColor(avgScore)} icon="★" />
      </div>

      {/* Charts */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div style={{ background:T.inkSoft, border:`1px solid ${T.border}`, padding:"16px 18px" }}>
          <div style={{ fontSize:8, letterSpacing:3, textTransform:"uppercase", color:T.gold, marginBottom:12 }}>Pipeline-Funnel</div>
          {stageCounts.map((s: any) => (
            <div key={s.id} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ fontSize:11, color:T.creamDim, display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ width:4, height:4, borderRadius:"50%", background:s.color, display:"inline-block" }} />
                  {s.name}
                </span>
                <span style={{ fontSize:11, color:T.muted }}>{s.count} · {fmtEur(s.value)}</span>
              </div>
              <div style={{ height:3, background:T.border, borderRadius:2 }}>
                <div style={{ width:`${(s.count/Math.max(leads.length,1))*100}%`, height:"100%",
                  background:s.color, borderRadius:2, transition:"width .5s" }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ background:T.inkSoft, border:`1px solid ${T.border}`, padding:"16px 18px" }}>
          <div style={{ fontSize:8, letterSpacing:3, textTransform:"uppercase", color:T.gold, marginBottom:12 }}>Lead-Quellen</div>
          {srcData.map((d, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
              <span style={{ fontSize:10, color:T.creamDim, minWidth:90 }}>{d.src}</span>
              <div style={{ flex:1, height:5, background:T.border, borderRadius:3 }}>
                <div style={{ width:`${(d.count/maxSrc)*100}%`, height:"100%", background:T.gold, borderRadius:3 }} />
              </div>
              <span style={{ fontSize:11, color:T.muted, minWidth:18, textAlign:"right" }}>{d.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Report */}
      {loading && (
        <div style={{ background:T.inkSoft, border:`1px solid ${T.border}`, padding:22 }}>
          <Skel h={16} mb={10} /><Skel h={14} w="90%" mb={8} /><Skel h={14} w="75%" />
        </div>
      )}
      {aiReport && !loading && (
        <div className="afu" style={{ background:T.inkSoft, border:`1px solid ${T.goldLine}`, padding:"18px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
            marginBottom:12, paddingBottom:12, borderBottom:`1px solid ${T.border}` }}>
            <div>
              <div style={{ fontSize:8, letterSpacing:3, textTransform:"uppercase", color:T.gold, marginBottom:6 }}>KI-Managementbericht</div>
              <div style={{ fontFamily:"var(--ff-d)", fontSize:20, fontWeight:300, color:T.cream }}>{aiReport.headline}</div>
            </div>
            {aiReport.health && (
              <div style={{ padding:"4px 12px", fontSize:10, letterSpacing:1.5, textTransform:"uppercase", fontWeight:500,
                background: aiReport.health==="excellent" ? "rgba(52,211,153,.1)" : "rgba(201,168,76,.1)",
                border:`1px solid ${aiReport.health==="excellent" ? "rgba(52,211,153,.25)" : T.goldLine}`,
                color: aiReport.health==="excellent" ? T.green : T.gold }}>
                {aiReport.health}
              </div>
            )}
          </div>
          <div style={{ fontSize:13, color:T.creamDim, lineHeight:1.8, marginBottom:16 }}>{aiReport.summary}</div>
          {aiReport.forecast && (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:16 }}>
              {Object.entries(aiReport.forecast).map(([q,v]) => (
                <div key={q} style={{ padding:"12px 14px", border:`1px solid ${T.border}`, textAlign:"center" }}>
                  <div style={{ fontSize:8, letterSpacing:2, textTransform:"uppercase", color:T.muted, marginBottom:4 }}>{q.toUpperCase()}</div>
                  <div style={{ fontFamily:"var(--ff-d)", fontSize:22, color:T.gold, fontWeight:300 }}>{fmtEur(v as number)}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div>
              <div style={{ fontSize:8, letterSpacing:2, textTransform:"uppercase", color:T.green, marginBottom:8 }}>Stärken</div>
              {aiReport.strengths?.map((s: string, i: number) => (
                <div key={i} style={{ display:"flex", gap:8, marginBottom:6 }}>
                  <span style={{ color:T.green, fontSize:10 }}>✓</span>
                  <span style={{ fontSize:12, color:T.creamDim, lineHeight:1.5 }}>{s}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize:8, letterSpacing:2, textTransform:"uppercase", color:T.gold, marginBottom:8 }}>Empfehlungen</div>
              {aiReport.recommendations?.map((r: string, i: number) => (
                <div key={i} style={{ display:"flex", gap:8, marginBottom:6 }}>
                  <span style={{ color:T.gold, fontSize:10 }}>→</span>
                  <span style={{ fontSize:12, color:T.creamDim, lineHeight:1.5 }}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
