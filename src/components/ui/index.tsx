"use client";
import { useState, useEffect, useCallback, ReactNode } from "react";

const T = {
  ink:"#09080c", inkSoft:"#13111a", inkMid:"#1c1a23",
  cream:"#f0e9da", creamDim:"#c8bfae",
  gold:"#c9a84c", gold2:"#e8d08a", goldDim:"rgba(201,168,76,.10)",
  goldLine:"rgba(201,168,76,.20)", goldGlow:"rgba(201,168,76,.06)",
  muted:"#7a7265", border:"rgba(240,233,218,.07)", borderMid:"rgba(240,233,218,.13)",
  green:"#34d399", red:"#f87171", blue:"#60a5fa", purple:"#a78bfa", orange:"#fb923c",
};
export { T };

export const fmtEur = (n: number) => `€${Number(n).toLocaleString("de-DE")}`;
export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "2-digit" }) : "—";
export const scoreColor = (s: number) => s >= 85 ? T.green : s >= 65 ? T.gold : s >= 40 ? T.orange : T.red;

// ── BADGE ─────────────────────────────────────────────────
const BADGE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  gold:   { bg: T.goldDim,              border: T.goldLine,                 text: T.gold },
  green:  { bg: "rgba(52,211,153,.10)", border: "rgba(52,211,153,.25)",     text: T.green },
  red:    { bg: "rgba(248,113,113,.10)",border: "rgba(248,113,113,.25)",    text: T.red },
  blue:   { bg: "rgba(96,165,250,.10)", border: "rgba(96,165,250,.25)",     text: T.blue },
  purple: { bg: "rgba(167,139,250,.10)",border: "rgba(167,139,250,.25)",    text: T.purple },
  orange: { bg: "rgba(251,146,60,.10)", border: "rgba(251,146,60,.25)",     text: T.orange },
  muted:  { bg: "rgba(122,114,101,.10)",border: "rgba(122,114,101,.18)",    text: T.muted },
};
export function Badge({ children, color = "gold", small }: { children: ReactNode; color?: string; small?: boolean }) {
  const c = BADGE_COLORS[color] ?? BADGE_COLORS.gold;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding: small ? "2px 8px" : "3px 10px",
      fontSize: small ? 9 : 10, letterSpacing: 1.5, textTransform:"uppercase", fontWeight: 500,
      background: c.bg, border: `1px solid ${c.border}`, color: c.text, whiteSpace:"nowrap" }}>
      {children}
    </span>
  );
}

// ── AVATAR ────────────────────────────────────────────────
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(" ").slice(0, 2).map(w => w[0] || "").join("").toUpperCase();
  const cols = [T.goldDim, "rgba(96,165,250,.15)", "rgba(167,139,250,.15)", "rgba(52,211,153,.15)", "rgba(251,146,60,.15)"];
  const bg = cols[(name.charCodeAt(0) || 0) % cols.length];
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg,
      border: `1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center",
      flexShrink: 0, fontFamily:"'Cormorant Garamond',serif", fontSize: size * 0.38,
      color: T.gold, fontWeight: 400, letterSpacing: -0.5 }}>
      {initials}
    </div>
  );
}

// ── SPINNER ───────────────────────────────────────────────
export function Spinner({ size = 18 }: { size?: number }) {
  return <div style={{ width: size, height: size, border: `2px solid ${T.border}`,
    borderTopColor: T.gold, borderRadius: "50%", animation: "spin .7s linear infinite" }} />;
}

// ── SKELETON ──────────────────────────────────────────────
export function Skel({ w = "100%", h = 14, mb = 0 }: { w?: string; h?: number; mb?: number }) {
  return <div className="skel" style={{ width: w, height: h, marginBottom: mb }} />;
}

// ── BUTTON ────────────────────────────────────────────────
type BtnVariant = "primary" | "ghost" | "outline" | "danger";
export function Btn({
  children, onClick, variant = "primary", small, disabled, loading, style: s, type = "button"
}: {
  children: ReactNode; onClick?: () => void; variant?: BtnVariant;
  small?: boolean; disabled?: boolean; loading?: boolean;
  style?: React.CSSProperties; type?: "button" | "submit";
}) {
  const [hov, setHov] = useState(false);
  const base: React.CSSProperties = {
    display:"inline-flex", alignItems:"center", gap: 6,
    fontFamily:"'Jost',sans-serif", fontSize: small ? 9 : 10, letterSpacing: 2,
    textTransform:"uppercase", fontWeight: 500,
    padding: small ? "7px 14px" : "11px 22px",
    border:"none", cursor: disabled || loading ? "not-allowed" : "pointer",
    transition:"all .18s", whiteSpace:"nowrap",
    opacity: disabled || loading ? 0.6 : 1, ...s,
  };
  const variants: Record<BtnVariant, React.CSSProperties> = {
    primary: { background: hov ? T.gold2 : T.gold, color: T.ink },
    ghost:   { background: hov ? "rgba(240,233,218,.05)" : "transparent",
               border: `1px solid ${hov ? "rgba(201,168,76,.4)" : T.goldLine}`, color: T.gold },
    outline: { background: hov ? "rgba(240,233,218,.04)" : "transparent",
               border: `1px solid ${hov ? "rgba(240,233,218,.2)" : T.border}`, color: T.creamDim },
    danger:  { background: hov ? "rgba(248,113,113,.18)" : "rgba(248,113,113,.08)",
               border:`1px solid rgba(248,113,113,.25)`, color: T.red },
  };
  return (
    <button type={type} style={{ ...base, ...variants[variant] }}
      onClick={disabled || loading ? undefined : onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      disabled={disabled || loading}>
      {loading ? <Spinner size={12} /> : null}{children}
    </button>
  );
}

// ── INPUT ─────────────────────────────────────────────────
export function Input({
  label, value, onChange, type = "text", placeholder, multiline, options, small, disabled, name
}: {
  label?: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string; multiline?: boolean;
  options?: ({ value: string; label: string } | string)[];
  small?: boolean; disabled?: boolean; name?: string;
}) {
  const [foc, setFoc] = useState(false);
  const lbl: React.CSSProperties = { display:"block", fontSize: 9, letterSpacing: 2.5,
    textTransform:"uppercase", color: T.muted, marginBottom: 5, fontWeight: 500 };
  const inp: React.CSSProperties = {
    width:"100%", background:"transparent", border:"none",
    borderBottom: `1px solid ${foc ? T.gold : T.border}`,
    color: T.cream, fontFamily:"'Jost',sans-serif",
    fontSize: small ? 12 : 14, fontWeight: 300,
    padding: small ? "7px 0" : "10px 0", outline:"none",
    transition:"border-color .2s", opacity: disabled ? 0.5 : 1,
  };
  const on = () => setFoc(true);
  const off = () => setFoc(false);
  if (options) return (
    <div>
      {label && <label style={lbl}>{label}</label>}
      <select name={name} value={value} onChange={e => onChange(e.target.value)}
        disabled={disabled} style={{ ...inp, appearance:"none", cursor:"pointer" }}
        onFocus={on} onBlur={off}>
        {options.map(o => {
          const v = typeof o === "string" ? o : o.value;
          const l = typeof o === "string" ? o : o.label;
          return <option key={v} value={v} style={{ background: T.inkSoft }}>{l}</option>;
        })}
      </select>
    </div>
  );
  if (multiline) return (
    <div>
      {label && <label style={lbl}>{label}</label>}
      <textarea name={name} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={3} disabled={disabled}
        style={{ ...inp, resize:"vertical", lineHeight: 1.7 }} onFocus={on} onBlur={off} />
    </div>
  );
  return (
    <div>
      {label && <label style={lbl}>{label}</label>}
      <input name={name} type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled} style={inp} onFocus={on} onBlur={off} />
    </div>
  );
}

// ── MODAL ─────────────────────────────────────────────────
export function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position:"fixed", inset:0, zIndex:900,
      background:"rgba(9,8,12,.88)", backdropFilter:"blur(12px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding: 16 }}>
      <div className="asi" onClick={e => e.stopPropagation()}
        style={{ background: T.inkSoft, border:`1px solid ${T.goldLine}`,
          width:"100%", maxWidth: wide ? 640 : 440, maxHeight:"92vh", overflow:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"16px 22px", borderBottom:`1px solid ${T.border}`,
          position:"sticky", top:0, background: T.inkSoft, zIndex:10 }}>
          <div style={{ fontFamily:"var(--ff-d)", fontSize:20, fontWeight:300, color:T.cream }}>{title}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:T.muted,
            cursor:"pointer", fontSize:18, lineHeight:1, padding:4 }}>✕</button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

// ── SCORE RING ────────────────────────────────────────────
export function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = size / 2 - 4, c = 2 * Math.PI * r, dash = c * score / 100;
  const col = scoreColor(score);
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)", flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={T.border} strokeWidth={3} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={3}
        strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
        style={{ transition:"stroke-dasharray .5s ease" }} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
        style={{ fill:col, fontSize:size*.28, fontWeight:500, fontFamily:"'Jost',sans-serif",
          transform:`rotate(90deg)`, transformOrigin:`${size/2}px ${size/2}px` }}>
        {score}
      </text>
    </svg>
  );
}

// ── KPI CARD ──────────────────────────────────────────────
export function KPI({ label, value, sub, color = T.gold, trend, icon }: {
  label: string; value: string | number; sub?: string;
  color?: string; trend?: number; icon?: string;
}) {
  return (
    <div className="afu" style={{ background:T.inkSoft, border:`1px solid ${T.border}`,
      padding:"18px 20px", position:"relative", overflow:"hidden",
      transition:"border-color .2s", cursor:"default" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = T.goldLine)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}>
      <div style={{ fontSize:8, letterSpacing:3, textTransform:"uppercase", color:T.muted, marginBottom:8 }}>{label}</div>
      <div style={{ fontFamily:"var(--ff-d)", fontSize:30, fontWeight:300, color, lineHeight:1, marginBottom:5 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:T.muted }}>{sub}</div>}
      {trend != null && <div style={{ fontSize:10, color: trend >= 0 ? T.green : T.red, marginTop:3 }}>
        {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%</div>}
      <div style={{ position:"absolute", bottom:-10, right:-4, fontFamily:"var(--ff-d)", fontSize:60,
        fontWeight:300, color:`${color}07`, lineHeight:1, pointerEvents:"none" }}>{icon}</div>
    </div>
  );
}
