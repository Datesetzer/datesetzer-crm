"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    start(async () => {
      const sb = supabaseBrowser();
      const { error: err } = await sb.auth.signInWithPassword({ email, password });
      if (err) { setError("E-Mail oder Passwort ungültig."); return; }
      toast.success("Willkommen zurück!");
      router.push("/dashboard");
      router.refresh();
    });
  };

  const inp = (focus: boolean): React.CSSProperties => ({
    width:"100%", background:"transparent", border:"none",
    borderBottom:`1px solid ${focus ? "#c9a84c" : "rgba(240,233,218,.13)"}`,
    color:"#f0e9da", fontFamily:"'Jost',sans-serif", fontWeight:300,
    fontSize:15, padding:"11px 0", outline:"none", transition:"border-color .2s",
  });

  return (
    <div style={{ minHeight:"100dvh", background:"#09080c", display:"flex",
      alignItems:"center", justifyContent:"center", padding:24, position:"relative", overflow:"hidden" }}>
      {/* Radial bg */}
      <div style={{ position:"absolute", top:"-20%", right:"-10%", width:"60vw", height:"60vw",
        borderRadius:"50%", background:"radial-gradient(circle,rgba(201,168,76,.07) 0%,transparent 65%)", pointerEvents:"none" }} />
      {/* Grain */}
      <div style={{ position:"absolute", inset:0,
        backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
        pointerEvents:"none" }} />

      <div className="afu" style={{ width:"100%", maxWidth:400, position:"relative" }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',Georgia,serif", fontSize:44, fontWeight:300,
            color:"#f0e9da", letterSpacing:-1, marginBottom:6 }}>
            Date<em style={{ color:"#c9a84c", fontStyle:"italic" }}>setzer</em>
          </div>
          <div style={{ fontSize:9, letterSpacing:4, textTransform:"uppercase", color:"#7a7265" }}>
            CRM · Intern
          </div>
        </div>

        <div style={{ background:"#13111a", border:"1px solid rgba(201,168,76,.2)", padding:"38px 34px" }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:300,
            color:"#f0e9da", marginBottom:4 }}>Willkommen zurück.</div>
          <div style={{ fontSize:13, color:"#7a7265", marginBottom:30, lineHeight:1.6 }}>
            Melde dich mit deinem Datesetzer-Konto an.
          </div>

          <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:22 }}>
            <div>
              <label style={{ display:"block", fontSize:9, letterSpacing:2.5,
                textTransform:"uppercase", color:"#7a7265", marginBottom:6, fontWeight:500 }}>E-Mail</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                autoComplete="email" placeholder="deine@email.de" style={inp(false)}
                onFocus={e=>(e.target.style.borderBottomColor="#c9a84c")}
                onBlur={e=>(e.target.style.borderBottomColor="rgba(240,233,218,.13)")} />
            </div>
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <label style={{ fontSize:9, letterSpacing:2.5, textTransform:"uppercase",
                  color:"#7a7265", fontWeight:500 }}>Passwort</label>
                <Link href="/forgot-password" style={{ fontSize:11, color:"#7a7265",
                  transition:"color .15s" }}
                  onMouseEnter={e=>((e.target as HTMLElement).style.color="#c9a84c")}
                  onMouseLeave={e=>((e.target as HTMLElement).style.color="#7a7265")}>Vergessen?</Link>
              </div>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
                autoComplete="current-password" placeholder="••••••••" style={inp(false)}
                onFocus={e=>(e.target.style.borderBottomColor="#c9a84c")}
                onBlur={e=>(e.target.style.borderBottomColor="rgba(240,233,218,.13)")} />
            </div>

            {error && (
              <div style={{ background:"rgba(248,113,113,.08)", border:"1px solid rgba(248,113,113,.25)",
                padding:"10px 14px", fontSize:12, color:"#f87171" }}>{error}</div>
            )}

            <button type="submit" disabled={pending} style={{
              background: pending ? "rgba(201,168,76,.6)" : "#c9a84c", color:"#09080c",
              border:"none", padding:"14px 28px", fontSize:11, letterSpacing:2,
              textTransform:"uppercase", fontWeight:500, cursor: pending ? "not-allowed" : "pointer",
              fontFamily:"'Jost',sans-serif", transition:"background .2s", marginTop:6,
            }}>{pending ? "Anmelden…" : "Anmelden"}</button>
          </form>
        </div>

        <div style={{ textAlign:"center", marginTop:22, fontSize:12, color:"#7a7265" }}>
          Noch kein Konto?{" "}
          <Link href="/register" style={{ color:"#c9a84c", fontWeight:400 }}>Organisation erstellen →</Link>
        </div>
        <div style={{ textAlign:"center", marginTop:10 }}>
          <Link href="https://datesetzer.de" style={{ fontSize:11, color:"#7a7265",
            letterSpacing:1, textTransform:"uppercase" }}>← datesetzer.de</Link>
        </div>
      </div>
    </div>
  );
}
