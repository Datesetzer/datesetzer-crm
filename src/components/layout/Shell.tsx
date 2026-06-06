"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/store/app";
import { useRealtime } from "@/hooks/useRealtime";
import { Avatar, T } from "@/components/ui";
import { toast } from "sonner";

const NAV = [
  { id:"dashboard",   icon:"⬡", label:"Dashboard",    path:"/dashboard" },
  { id:"leads",       icon:"◈", label:"Leads",         path:"/leads" },
  { id:"pipeline",    icon:"▤", label:"Pipeline",       path:"/pipeline" },
  { id:"customers",   icon:"◉", label:"Kunden",         path:"/customers" },
  { id:"tasks",       icon:"◻", label:"Aufgaben",       path:"/tasks" },
  { id:"analytics",   icon:"◬", label:"Analytics",      path:"/analytics" },
  { id:"automations", icon:"⟳", label:"Automationen",   path:"/automations" },
  { id:"emails",      icon:"✉", label:"E-Mails",        path:"/emails" },
  { id:"website-api", icon:"⟡", label:"Website API",   path:"/website-api" },
  { id:"settings",    icon:"⚙", label:"Einstellungen", path:"/settings" },
];

function NotifPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markRead, markAllRead, unreadCount } = useAppStore();
  return (
    <div onClick={e => e.stopPropagation()}
      style={{ position:"absolute", top:52, right:0, width:320, background:T.inkSoft,
        border:`1px solid ${T.goldLine}`, zIndex:300, boxShadow:"0 20px 48px rgba(0,0,0,.6)" }}>
      <div style={{ padding:"12px 16px", borderBottom:`1px solid ${T.border}`,
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:9, letterSpacing:3, textTransform:"uppercase", color:T.gold }}>Benachrichtigungen</div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ fontSize:9, color:T.muted, background:"none",
            border:"none", cursor:"pointer", letterSpacing:1, textTransform:"uppercase" }}>
            Alle gelesen
          </button>
        )}
      </div>
      <div style={{ maxHeight:360, overflowY:"auto" }}>
        {notifications.length === 0 && (
          <div style={{ padding:24, textAlign:"center", color:T.muted, fontSize:13 }}>Keine Benachrichtigungen</div>
        )}
        {notifications.map(n => (
          <div key={n.id} onClick={() => markRead(n.id)}
            style={{ padding:"11px 16px", borderBottom:`1px solid ${T.border}`,
              display:"flex", gap:10, cursor:"pointer",
              background: n.isRead ? "transparent" : T.goldGlow, transition:"background .15s" }}>
            <div style={{ width:5, height:5, borderRadius:"50%", background: n.isRead ? "transparent" : T.gold,
              flexShrink:0, marginTop:5 }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, color: n.isRead ? T.creamDim : T.cream,
                fontWeight: n.isRead ? 300 : 400, lineHeight:1.4 }}>{n.title}</div>
              <div style={{ fontSize:10, color:T.muted, marginTop:2 }}>{n.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Shell({ children, profile }: { children: React.ReactNode; profile: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed, unreadCount } = useAppStore();
  const [mobile, setMobile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  useRealtime(profile?.org_id, profile?.id);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const active = NAV.find(n => pathname.startsWith(n.path))?.id ?? "dashboard";

  const logout = async () => {
    const sb = (await import("@/lib/supabase/client")).supabaseBrowser();
    await sb.auth.signOut();
    router.push("/login");
  };

  const Sidebar = () => (
    <div style={{ width: sidebarCollapsed ? 54 : 210, background:T.ink,
      borderRight:`1px solid ${T.border}`, display:"flex", flexDirection:"column",
      flexShrink:0, transition:"width .22s ease", overflow:"hidden", height:"100dvh" }}>
      {/* Logo */}
      <div style={{ height:52, display:"flex", alignItems:"center",
        paddingLeft: sidebarCollapsed ? 0 : 18, justifyContent: sidebarCollapsed ? "center" : "flex-start",
        borderBottom:`1px solid ${T.border}`, flexShrink:0, gap:8 }}>
        {sidebarCollapsed
          ? <div style={{ fontFamily:"var(--ff-d)", fontSize:17, color:T.cream }}>
              D<em style={{ color:T.gold, fontStyle:"italic" }}>s</em>
            </div>
          : <div style={{ fontFamily:"var(--ff-d)", fontSize:18, color:T.cream }}>
              Date<em style={{ color:T.gold, fontStyle:"italic" }}>setzer</em>
              <span style={{ fontSize:9, letterSpacing:2, textTransform:"uppercase", color:T.muted, marginLeft:7 }}>CRM</span>
            </div>
        }
      </div>
      {/* Nav */}
      <nav style={{ flex:1, padding:"10px 0", overflowY:"auto", overflowX:"hidden" }}>
        {NAV.map(item => {
          const isActive = active === item.id;
          return (
            <button key={item.id} onClick={() => router.push(item.path)}
              title={sidebarCollapsed ? item.label : ""}
              style={{ display:"flex", alignItems:"center", gap:11, width:"100%",
                padding: sidebarCollapsed ? "11px 0" : "10px 16px",
                justifyContent: sidebarCollapsed ? "center" : "flex-start",
                background: isActive ? T.goldGlow : "transparent",
                borderLeft: isActive ? `2px solid ${T.gold}` : "2px solid transparent",
                color: isActive ? T.gold : T.muted,
                border:"none", cursor:"pointer", transition:"all .13s" }}>
              <span style={{ fontSize:15, flexShrink:0 }}>{item.icon}</span>
              {!sidebarCollapsed && (
                <span style={{ fontSize:11, letterSpacing:1.5, textTransform:"uppercase",
                  fontWeight:500, whiteSpace:"nowrap" }}>{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>
      {/* User */}
      <div style={{ borderTop:`1px solid ${T.border}`, padding: sidebarCollapsed ? "8px 0" : "8px 12px",
        display:"flex", alignItems:"center", gap:9, flexShrink:0 }}>
        {!sidebarCollapsed && profile && (
          <>
            <Avatar name={profile.name} size={28} />
            <div style={{ flex:1, overflow:"hidden" }}>
              <div style={{ fontSize:11, color:T.cream, fontWeight:400, overflow:"hidden",
                textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{profile.name}</div>
              <div style={{ fontSize:9, color:T.muted, letterSpacing:1 }}>{profile.role}</div>
            </div>
            <button onClick={logout} title="Abmelden"
              style={{ background:"none", border:"none", color:T.muted, cursor:"pointer", fontSize:12 }}>→</button>
          </>
        )}
        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{ background:"none", border:"none", color:T.muted, cursor:"pointer",
            fontSize:10, flexShrink:0, marginLeft: sidebarCollapsed ? "auto" : 0 }}>
          {sidebarCollapsed ? "▶" : "◀"}
        </button>
      </div>
    </div>
  );

  const Topbar = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div style={{ height:52, borderBottom:`1px solid ${T.border}`, display:"flex",
      alignItems:"center", paddingLeft:22, paddingRight:14, gap:10, flexShrink:0, background:T.ink }}>
      <div style={{ flex:1, minWidth:0 }}>
        {subtitle && <div style={{ fontSize:8, letterSpacing:4, textTransform:"uppercase", color:T.gold, marginBottom:1 }}>{subtitle}</div>}
        <div style={{ fontFamily:"var(--ff-d)", fontSize:17, fontWeight:300, color:T.cream,
          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{title}</div>
      </div>
      {/* Notification bell */}
      <div style={{ position:"relative" }}>
        <button onClick={() => setShowNotif(s => !s)}
          style={{ background:"none", border:`1px solid ${T.border}`, color:T.muted,
            cursor:"pointer", padding:"6px 10px", fontSize:14, transition:"all .15s" }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = T.goldLine)}
          onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
          🔔
          {unreadCount > 0 && (
            <span style={{ position:"absolute", top:-5, right:-5, background:T.red,
              color:"#fff", fontSize:9, fontWeight:700, padding:"1px 5px",
              borderRadius:8, minWidth:16, textAlign:"center" }}>{unreadCount}</span>
          )}
        </button>
        {showNotif && (
          <div style={{ position:"fixed", inset:0, zIndex:200 }} onClick={() => setShowNotif(false)}>
            <NotifPanel onClose={() => setShowNotif(false)} />
          </div>
        )}
      </div>
    </div>
  );

  const MobileNav = () => (
    <div className="mob-nav" style={{ height:56, background:T.ink, borderTop:`1px solid ${T.border}`,
      display:"flex", alignItems:"stretch", flexShrink:0 }}>
      {NAV.slice(0, 5).map(item => {
        const isActive = active === item.id;
        return (
          <button key={item.id} onClick={() => router.push(item.path)}
            style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", gap:3, background:"none", border:"none",
              color: isActive ? T.gold : T.muted, cursor:"pointer" }}>
            <span style={{ fontSize:16 }}>{item.icon}</span>
            <span style={{ fontSize:8, letterSpacing:1, textTransform:"uppercase" }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );

  const currentNav = NAV.find(n => pathname.startsWith(n.path));

  return (
    <div className="shell">
      {!mobile && <Sidebar />}
      <div className="main">
        <Topbar title={currentNav?.label ?? "Dashboard"} subtitle="CRM · Datesetzer" />
        <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
          {children}
        </div>
        {mobile && <MobileNav />}
      </div>
    </div>
  );
}
