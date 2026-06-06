"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [form, setForm] = useState({ name:"", email:"", password:"", orgName:"" });
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Fehler bei der Registrierung"); return; }
      toast.success("Konto erstellt! Jetzt anmelden.");
      router.push("/login");
    });
  };

  const inp: React.CSSProperties = {
    width:"100%", background:"transparent", border:"none",
    borderBottom:"1px solid rgba(240,233,218,.13)", color:"#f0e9da",
    fontFamily:"'Jost',sans-serif", fontWeight:300, fontSize:15,
    padding:"11px 0", outline:"none", transition:"border-color .2s",
  };
  const lbl: React.CSSProperties = {
    display:"block", fontSize:9, letterSpacing:2.5, textTransform:"uppercase",
    color:"#7a7265", marginBottom:6, fontWeight:500,
  };

  return (
    <div style={{ minHeight:"100dvh", background:"#09080c", display:"flex",
      alignItems:"center", justifyContent:"center", padding:24 }}>
      <div className="afu" style={{ width:"100%", maxWidth:420 }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:40, fontWeight:300,
            color:"#f0e9da", letterSpacing:-1, marginBottom:6 }}>
            Date<em style={{ color:"#c9a84c", fontStyle:"italic" }}>setzer</em>
          </div>
          <div style={{ fontSize:9, letterSpacing:4, textTransform:"uppercase", color:"#7a7265" }}>
            Neues CRM-Konto
          </div>
        </div>

        <div style={{ background:"#13111a", border:"1px solid rgba(201,168,76,.2)", padding:"36px 32px" }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:300,
            color:"#f0e9da", marginBottom:24 }}>Organisation erstellen.</div>

          <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:20 }}>
            {[
              { label:"Dein Name *", key:"name",    type:"text",     ph:"Max Mustermann" },
              { label:"E-Mail *",    key:"email",   type:"email",    ph:"deine@email.de" },
              { label:"Passwort *",  key:"password",type:"password", ph:"Min. 8 Zeichen" },
              { label:"Organisation *", key:"orgName",type:"text",  ph:"Datesetzer GmbH" },
            ].map(f => (
              <div key={f.key}>
                <label style={lbl}>{f.label}</label>
                <input type={f.type} value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.ph} required style={inp}
                  onFocus={e=>(e.target.style.borderBottomColor="#c9a84c")}
                  onBlur={e=>(e.target.style.borderBottomColor="rgba(240,233,218,.13)")} />
              </div>
            ))}

            {error && (
              <div style={{ background:"rgba(248,113,113,.08)", border:"1px solid rgba(248,113,113,.25)",
                padding:"10px 14px", fontSize:12, color:"#f87171" }}>{error}</div>
            )}

            <button type="submit" disabled={pending} style={{
              background: pending ? "rgba(201,168,76,.6)" : "#c9a84c", color:"#09080c",
              border:"none", padding:"13px 28px", fontSize:11, letterSpacing:2,
              textTransform:"uppercase", fontWeight:500, cursor: pending ? "not-allowed" : "pointer",
              fontFamily:"'Jost',sans-serif", transition:"background .2s", marginTop:4,
            }}>{pending ? "Erstelle Konto…" : "Konto erstellen"}</button>
          </form>
        </div>

        <div style={{ textAlign:"center", marginTop:20, fontSize:12, color:"#7a7265" }}>
          Bereits registriert?{" "}
          <Link href="/login" style={{ color:"#c9a84c" }}>Anmelden →</Link>
        </div>
      </div>
    </div>
  );
}
