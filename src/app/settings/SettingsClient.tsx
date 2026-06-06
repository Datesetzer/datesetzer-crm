"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Avatar, Badge, Btn, Input, T } from "@/components/ui";
import { usePush } from "@/hooks/useRealtime";
import { toast } from "sonner";

export function SettingsClient({ profile, teammates }: any) {
  const { enabled, loading, enable } = usePush();
  const [name, setName] = useState(profile.name || "");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"profile"|"team"|"push"|"danger">("profile");

  const saveProfile = async () => {
    setSaving(true);
    const sb = supabaseBrowser();
    const { error } = await sb.from("profiles").update({ name }).eq("id", profile.id);
    setSaving(false);
    if (error) { toast.error("Fehler beim Speichern"); return; }
    toast.success("Profil gespeichert");
  };

  const Tab = ({ id, label }: { id: any; label: string }) => (
    <button onClick={() => setTab(id)}
      style={{ padding:"9px 16px", fontSize:9, letterSpacing:2, textTransform:"uppercase",
        fontWeight:500, background:"none", border:"none",
        borderBottom: tab===id ? `2px solid ${T.gold}` : "2px solid transparent",
        color: tab===id ? T.gold : T.muted, cursor:"pointer" }}>{label}</button>
  );

  const ROLE_LABELS: Record<string,string> = {
    SUPER_ADMIN:"Super Admin", ADMIN:"Admin", MANAGER:"Manager", SALES:"Sales", SUPPORT:"Support", VIEWER:"Viewer"
  };
  const ROLE_COLORS: Record<string,string> = {
    SUPER_ADMIN:"purple", ADMIN:"gold", MANAGER:"blue", SALES:"green", SUPPORT:"orange", VIEWER:"muted"
  };

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ borderBottom:`1px solid ${T.border}`, display:"flex", flexShrink:0, paddingLeft:8 }}>
        <Tab id="profile" label="Profil" />
        <Tab id="team" label="Team" />
        <Tab id="push" label="Benachrichtigungen" />
        <Tab id="danger" label="Erweitert" />
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:24 }}>
        {tab === "profile" && (
          <div style={{ maxWidth:440 }}>
            <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:28,
              paddingBottom:20, borderBottom:`1px solid ${T.border}` }}>
              <Avatar name={profile.name} size={56} />
              <div>
                <div style={{ fontFamily:"var(--ff-d)", fontSize:20, fontWeight:300, color:T.cream }}>{profile.name}</div>
                <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>{profile.email}</div>
                <div style={{ marginTop:5 }}>
                  <Badge color={ROLE_COLORS[profile.role]||"muted"} small>{ROLE_LABELS[profile.role]||profile.role}</Badge>
                </div>
              </div>
            </div>

            <div style={{ display:"grid", gap:18, marginBottom:20 }}>
              <Input label="Name" value={name} onChange={setName} />
              <div>
                <div style={{ fontSize:9, letterSpacing:2.5, textTransform:"uppercase", color:T.muted, marginBottom:5 }}>E-Mail</div>
                <div style={{ fontSize:14, color:T.muted, padding:"10px 0",
                  borderBottom:`1px solid ${T.border}` }}>{profile.email}</div>
                <div style={{ fontSize:10, color:T.muted, marginTop:4 }}>E-Mail kann nicht geändert werden.</div>
              </div>
              <div>
                <div style={{ fontSize:9, letterSpacing:2.5, textTransform:"uppercase", color:T.muted, marginBottom:5 }}>Organisation</div>
                <div style={{ fontSize:14, color:T.muted, padding:"10px 0",
                  borderBottom:`1px solid ${T.border}` }}>{(profile.org as any)?.name}</div>
              </div>
            </div>
            <Btn onClick={saveProfile} loading={saving}>Speichern</Btn>
          </div>
        )}

        {tab === "team" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
              <div style={{ fontFamily:"var(--ff-d)", fontSize:18, fontWeight:300, color:T.cream }}>
                Team-Mitglieder
              </div>
              <div style={{ fontSize:11, color:T.muted }}>{teammates.length} Mitglieder</div>
            </div>
            {teammates.map((t: any) => (
              <div key={t.id} style={{ display:"flex", gap:12, alignItems:"center",
                padding:"12px 0", borderBottom:`1px solid ${T.border}` }}>
                <Avatar name={t.name} size={36} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:T.cream, fontWeight:400 }}>{t.name}</div>
                  <div style={{ fontSize:11, color:T.muted }}>{t.email}</div>
                </div>
                <Badge color={ROLE_COLORS[t.role]||"muted"} small>{ROLE_LABELS[t.role]||t.role}</Badge>
              </div>
            ))}

            <div style={{ marginTop:24, padding:"16px 18px", background:T.goldGlow,
              border:`1px solid ${T.goldLine}` }}>
              <div style={{ fontSize:11, color:T.gold, marginBottom:6, fontWeight:500 }}>
                Team-Mitglied einladen
              </div>
              <div style={{ fontSize:12, color:T.muted, lineHeight:1.6, marginBottom:12 }}>
                Neue Mitglieder können sich unter crm.datesetzer.de/register mit der E-Mail-Domain
                deiner Organisation registrieren. Der Admin weist dann die Rolle zu.
              </div>
              <div style={{ fontFamily:"monospace", fontSize:11, color:T.creamDim,
                background:"rgba(240,233,218,.04)", padding:"8px 12px" }}>
                {process.env.NEXT_PUBLIC_APP_URL || "https://crm.datesetzer.de"}/register
              </div>
            </div>
          </div>
        )}

        {tab === "push" && (
          <div style={{ maxWidth:440 }}>
            <div style={{ fontFamily:"var(--ff-d)", fontSize:18, fontWeight:300,
              color:T.cream, marginBottom:6 }}>Push Notifications</div>
            <div style={{ fontSize:13, color:T.muted, marginBottom:24, lineHeight:1.7 }}>
              Erhalte sofortige Browser-Benachrichtigungen bei neuen Leads, gewonnenen Deals und überfälligen Aufgaben —
              auch wenn das CRM nicht geöffnet ist.
            </div>

            <div style={{ background:T.inkSoft, border:`1px solid ${T.border}`, padding:"18px 20px", marginBottom:16 }}>
              {[
                ["🎯 Neue Leads", "Sofort wenn ein Lead über die Website eingeht"],
                ["🎉 Deal gewonnen", "Bei jedem gewonnenen Abschluss"],
                ["⏰ Überfällige Tasks", "Täglich morgens um 8 Uhr"],
                ["📧 E-Mails geöffnet", "Wenn ein Kontakt deine E-Mail öffnet"],
              ].map(([icon, text]) => (
                <div key={icon as string} style={{ display:"flex", gap:12, padding:"8px 0",
                  borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:16 }}>{icon}</span>
                  <span style={{ fontSize:12, color:T.creamDim }}>{text}</span>
                </div>
              ))}
            </div>

            {enabled ? (
              <div style={{ padding:"14px 16px", background:"rgba(52,211,153,.08)",
                border:"1px solid rgba(52,211,153,.2)", fontSize:13, color:T.green }}>
                ✓ Push Notifications sind aktiviert
              </div>
            ) : (
              <Btn onClick={enable} loading={loading}>
                🔔 Push Notifications aktivieren
              </Btn>
            )}

            <div style={{ marginTop:16, fontSize:11, color:T.muted, lineHeight:1.7 }}>
              Funktioniert im Browser und auf iOS/Android wenn das CRM als App installiert ist.
              Berechtigungen können jederzeit in den Browser-Einstellungen widerrufen werden.
            </div>
          </div>
        )}

        {tab === "danger" && (
          <div style={{ maxWidth:440 }}>
            <div style={{ fontFamily:"var(--ff-d)", fontSize:18, fontWeight:300,
              color:T.cream, marginBottom:20 }}>Erweiterte Einstellungen</div>

            <div style={{ background:T.inkSoft, border:`1px solid ${T.border}`, padding:"18px 20px", marginBottom:16 }}>
              <div style={{ fontSize:10, letterSpacing:2, textTransform:"uppercase",
                color:T.muted, marginBottom:10 }}>Organisation</div>
              {[
                ["Name", (profile.org as any)?.name],
                ["Slug", (profile.org as any)?.slug],
                ["Plan", (profile.org as any)?.plan || "Starter"],
                ["API-Key", `${((profile.org as any)?.api_key || "").slice(0,12)}…`],
              ].map(([k,v]) => (
                <div key={k as string} style={{ display:"flex", justifyContent:"space-between",
                  padding:"8px 0", borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:11, color:T.muted }}>{k}</span>
                  <span style={{ fontSize:11, color:T.creamDim, fontFamily: k==="API-Key" ? "monospace" : "inherit" }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ padding:"16px 18px", background:"rgba(248,113,113,.05)",
              border:"1px solid rgba(248,113,113,.15)" }}>
              <div style={{ fontSize:10, letterSpacing:2, textTransform:"uppercase",
                color:T.red, marginBottom:8 }}>Konto abmelden</div>
              <div style={{ fontSize:12, color:T.muted, marginBottom:14, lineHeight:1.6 }}>
                Meldet dich aus dem CRM ab. Deine Daten bleiben erhalten.
              </div>
              <button onClick={async () => {
                const sb = supabaseBrowser();
                await sb.auth.signOut();
                window.location.href = "/login";
              }} style={{ background:"rgba(248,113,113,.08)", border:"1px solid rgba(248,113,113,.25)",
                color:T.red, padding:"9px 20px", fontSize:10, letterSpacing:2,
                textTransform:"uppercase", cursor:"pointer", fontFamily:"'Jost',sans-serif" }}>
                Abmelden
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
