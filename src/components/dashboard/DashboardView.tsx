"use client";
import { KPI, Avatar, Badge, T, fmtEur, fmtDate, scoreColor } from "@/components/ui";

function MiniChart({ data, color = T.gold }: { data: { l: string; v: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.v), 1);
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:4, height:60 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
          <div style={{ width:"100%", height:`${(d.v / max) * 52}px`,
            background: i === data.length - 1 ? color : `${color}44`,
            borderRadius:1, transition:"height .4s ease" }} />
          <div style={{ fontSize:8, color:T.muted, textAlign:"center", whiteSpace:"nowrap" }}>{d.l}</div>
        </div>
      ))}
    </div>
  );
}

export function DashboardView({ kpis, recentLeads, tasks, stageCounts, profile }: {
  kpis: { revenue: number; pipeVal: number; convRate: number; avgScore: number; openTasks: number; overdue: number };
  recentLeads: any[];
  tasks: any[];
  stageCounts: any[];
  profile: any;
}) {
  const chartData = [
    { l:"Jan", v:14400 }, { l:"Feb", v:21600 }, { l:"Mär", v:18000 },
    { l:"Apr", v:26400 }, { l:"Mai", v:31200 }, { l:"Jun", v: kpis.revenue },
  ];

  return (
    <div style={{ flex:1, overflowY:"auto", padding:20, display:"flex", flexDirection:"column", gap:14 }}>
      {/* Welcome */}
      <div style={{ borderBottom:`1px solid ${T.border}`, paddingBottom:14, marginBottom:2 }}>
        <div style={{ fontFamily:"var(--ff-d)", fontSize:22, fontWeight:300, color:T.cream }}>
          Willkommen zurück, <em style={{ color:T.gold, fontStyle:"italic" }}>{profile?.name?.split(" ")[0]}</em>.
        </div>
        <div style={{ fontSize:12, color:T.muted, marginTop:3 }}>
          {new Date().toLocaleDateString("de-DE", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:10 }}>
        <KPI label="Umsatz (aktiv)" value={fmtEur(kpis.revenue)} trend={12} icon="€" />
        <KPI label="Pipeline-Wert" value={fmtEur(kpis.pipeVal)} color={T.cream} trend={8} icon="◈" />
        <KPI label="Conversion" value={`${kpis.convRate}%`} trend={3} icon="%" />
        <KPI label="Ø Lead-Score" value={kpis.avgScore} color={scoreColor(kpis.avgScore)} trend={5} icon="★" />
        <KPI label="Offene Tasks" value={kpis.openTasks}
          color={kpis.overdue > 0 ? T.red : T.cream}
          sub={kpis.overdue > 0 ? `${kpis.overdue} überfällig` : undefined} icon="◻" />
      </div>

      {/* Charts */}
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:12 }}>
        <div style={{ background:T.inkSoft, border:`1px solid ${T.border}`, padding:"16px 18px" }}>
          <div style={{ fontSize:8, letterSpacing:3, textTransform:"uppercase", color:T.gold, marginBottom:12 }}>
            Umsatz — Monatsverlauf
          </div>
          <MiniChart data={chartData} />
        </div>
        <div style={{ background:T.inkSoft, border:`1px solid ${T.border}`, padding:"16px 18px" }}>
          <div style={{ fontSize:8, letterSpacing:3, textTransform:"uppercase", color:T.gold, marginBottom:12 }}>
            Pipeline-Stages
          </div>
          {stageCounts.map((s: any) => (
            <div key={s.id} style={{ display:"flex", alignItems:"center", gap:7, marginBottom:8 }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:s.color, flexShrink:0 }} />
              <span style={{ flex:1, fontSize:11, color:T.creamDim }}>{s.name}</span>
              <span style={{ fontSize:11, color:T.muted }}>{s.count}</span>
              <div style={{ width:36, height:2, background:T.border, borderRadius:1 }}>
                <div style={{ width:`${Math.min(100,(s.count/Math.max(...stageCounts.map((x:any)=>x.count),1))*100)}%`,
                  height:"100%", background:s.color, borderRadius:1 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent leads + tasks */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <div style={{ background:T.inkSoft, border:`1px solid ${T.border}`, padding:"16px 18px" }}>
          <div style={{ fontSize:8, letterSpacing:3, textTransform:"uppercase", color:T.gold, marginBottom:12 }}>
            Neueste Leads
          </div>
          {recentLeads.length === 0 && <div style={{ color:T.muted, fontSize:12 }}>Noch keine Leads.</div>}
          {recentLeads.map((l: any) => (
            <div key={l.id} style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 0",
              borderBottom:`1px solid ${T.border}` }}>
              <Avatar name={`${l.first_name} ${l.last_name}`} size={28} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, color:T.cream, fontWeight:400, overflow:"hidden",
                  textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.first_name} {l.last_name}</div>
                <div style={{ fontSize:10, color:T.muted }}>{l.source} · {fmtDate(l.created_at)}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:3, height:3, borderRadius:"50%", background:scoreColor(l.score) }} />
                <span style={{ fontSize:10, color:scoreColor(l.score) }}>{l.score}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background:T.inkSoft, border:`1px solid ${T.border}`, padding:"16px 18px" }}>
          <div style={{ fontSize:8, letterSpacing:3, textTransform:"uppercase", color:T.gold, marginBottom:12 }}>
            Offene Aufgaben
          </div>
          {tasks.filter((t: any) => t.status === "TODO").length === 0 && (
            <div style={{ color:T.muted, fontSize:12 }}>Alle Aufgaben erledigt ✓</div>
          )}
          {tasks.filter((t: any) => t.status === "TODO").map((t: any) => {
            const isOverdue = t.due_at && new Date(t.due_at) < new Date();
            return (
              <div key={t.id} style={{ display:"flex", gap:9, padding:"8px 0",
                borderBottom:`1px solid ${T.border}`, alignItems:"flex-start" }}>
                <div style={{ width:5, height:5, borderRadius:"50%", flexShrink:0, marginTop:5,
                  background: t.priority === "URGENT" ? T.red : t.priority === "HIGH" ? T.orange : T.gold }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:T.cream }}>{t.title}</div>
                  <div style={{ fontSize:10, color: isOverdue ? T.red : T.muted }}>
                    Fällig: {fmtDate(t.due_at)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
