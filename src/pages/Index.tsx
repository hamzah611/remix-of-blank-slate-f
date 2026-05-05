import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// ─── Data ─────────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { id: "urdu",   name: "Urdu",   native: "اردو",  tagline: "National language of Pakistan", speakers: "70M+ speakers" },
  { id: "sindhi", name: "Sindhi", native: "سنڌي", tagline: "Language of the Indus Valley",   speakers: "30M+ speakers" },
];

const FEATURES = [
  {
    accent: "#D4A853",
    bg: "rgba(212,168,83,0.09)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
      </svg>
    ),
    title: "Trace Every Letter",
    desc: "Draw each character with guided tracing. The app detects stroke coverage and gives real-time feedback.",
  },
  {
    accent: "#6BA3C8",
    bg: "rgba(107,163,200,0.09)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
      </svg>
    ),
    title: "Listen & Absorb",
    desc: "Every word has authentic audio. Train your ear first — speaking follows naturally from listening.",
  },
  {
    accent: "#C17B4A",
    bg: "rgba(193,123,74,0.09)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: "Build Fluency",
    desc: "Short daily lessons that chain together — vocabulary, listening, and real conversation in one flow.",
  },
];

const STEPS = [
  { n: "01", title: "Pick your language", body: "Urdu or Sindhi — both rooted in the same beautiful Nastaliq script." },
  { n: "02", title: "Follow the path",    body: "Each unit unlocks the next. Six lesson types per stage, no skipping ahead." },
  { n: "03", title: "Come back daily",    body: "A streak keeps momentum. Five minutes a day compounds into real fluency." },
];

// ─── Components ───────────────────────────────────────────────────────────────

function FloatingScript() {
  const letters = ["ا", "ب", "ت", "ث", "ج", "ح", "خ", "د"];
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {letters.map((ch, i) => (
        <span key={i} style={{
          position: "absolute",
          fontFamily: "'Amiri', serif",
          fontSize: `${52 + (i % 3) * 34}px`,
          color: "#FFFFFF",
          opacity: 0.035 + (i % 4) * 0.012,
          top: `${8 + ((i * 137) % 80)}%`,
          left: `${5 + ((i * 97) % 90)}%`,
          transform: `rotate(${-12 + (i % 5) * 8}deg)`,
          userSelect: "none",
          direction: "rtl",
        }}>{ch}</span>
      ))}
    </div>
  );
}

function GeometricDivider() {
  return (
    <svg width="100%" height="24" aria-hidden="true" style={{ display: "block", opacity: 0.14 }}>
      <defs>
        <pattern id="gdiv" x="0" y="0" width="48" height="24" patternUnits="userSpaceOnUse">
          <line x1="0" y1="12" x2="48" y2="12" stroke="#1E2D3D" strokeWidth="0.8"/>
          <path d="M 24 7 L 29 12 L 24 17 L 19 12 Z" stroke="#1E2D3D" strokeWidth="0.8" fill="none"/>
          <circle cx="0"  cy="12" r="1.4" fill="#1E2D3D"/>
          <circle cx="48" cy="12" r="1.4" fill="#1E2D3D"/>
        </pattern>
      </defs>
      <rect width="100%" height="24" fill="url(#gdiv)"/>
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const Index = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [session, setSession]   = useState<Session | null>(null);
  const [vis, setVis]           = useState(false);
  const langRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  useEffect(() => { const t = setTimeout(() => setVis(true), 50); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const displayName =
    (session?.user.user_metadata?.display_name as string | undefined) ??
    session?.user.email?.split("@")[0];

  const scrollToLang = () => langRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  const handleStart = () => {
    if (!selected) { scrollToLang(); return; }
    const lang = LANGUAGES.find((l) => l.id === selected);
    if (lang) localStorage.setItem("guftugu_language", lang.name);
    navigate(session ? "/course-map" : "/auth");
  };

  // shared transition helper
  const t = (delay = 0) => ({
    opacity: vis ? 1 : 0,
    transform: vis ? "translateY(0)" : "translateY(16px)",
    transition: `opacity 560ms ease ${delay}ms, transform 560ms ease ${delay}ms`,
  });

  return (
    <div style={{ backgroundColor: "#FAF6F0", minHeight: "100vh" }}>

      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="gf-nav">
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span className="gf-wordmark-script">گفتگو</span>
          <span className="gf-wordmark-latin">Guftugu</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {session ? (
            <>
              <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, fontWeight: 500, color: "#1E2D3D", opacity: 0.5 }}>
                {displayName}
              </span>
              <button
                onClick={() => navigate("/course-map")}
                style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 10, border: "none", backgroundColor: "#1E2D3D", color: "#FAF6F0", cursor: "pointer", transition: "opacity 150ms ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >Continue →</button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/auth")}
                style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, fontWeight: 600, padding: "9px 16px", borderRadius: 10, border: "1px solid rgba(30,45,61,0.14)", backgroundColor: "transparent", color: "#1E2D3D", cursor: "pointer", transition: "background 150ms ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(30,45,61,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >Sign in</button>
              <button
                onClick={scrollToLang}
                style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, fontWeight: 700, padding: "9px 18px", borderRadius: 10, border: "none", backgroundColor: "#1E2D3D", color: "#FAF6F0", cursor: "pointer", transition: "opacity 150ms ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >Get started</button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{ position: "relative", backgroundColor: "#1E2D3D", overflow: "hidden", padding: "108px 24px 100px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <FloatingScript />

        {/* Subtle gold radial glow */}
        <div aria-hidden="true" style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)", width: 700, height: 500, background: "radial-gradient(ellipse, rgba(212,168,83,0.09) 0%, transparent 65%)", pointerEvents: "none" }} />

        {/* Eyebrow */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "rgba(212,168,83,0.13)", border: "1px solid rgba(212,168,83,0.28)", borderRadius: 99, padding: "6px 16px", marginBottom: 34, ...t(0) }}>
          <span style={{ fontSize: 15, color: "#D4A853", fontFamily: "'Amiri', serif" }}>زبان</span>
          <span style={{ width: 1, height: 13, backgroundColor: "rgba(212,168,83,0.35)" }} />
          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D4A853" }}>Language Learning</span>
        </div>

        {/* Headline */}
        <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(38px, 8vw, 74px)", fontWeight: 700, color: "#FAF6F0", lineHeight: 1.08, letterSpacing: "-0.03em", maxWidth: 740, marginBottom: 14, ...t(80) }}>
          Learn the language<br />
          <em style={{ color: "#D4A853", fontStyle: "italic" }}>of your roots.</em>
        </h1>

        {/* Arabic echo */}
        <p style={{ fontFamily: "'Amiri', serif", fontSize: "clamp(26px, 4.5vw, 46px)", color: "rgba(250,246,240,0.28)", direction: "rtl", lineHeight: 1.6, marginBottom: 26, ...t(160) }}>
          اپنی زبان سیکھیں
        </p>

        {/* Sub */}
        <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: "clamp(15px, 2.2vw, 17px)", color: "rgba(250,246,240,0.52)", maxWidth: 460, lineHeight: 1.75, marginBottom: 44, ...t(240) }}>
          Bite-sized lessons in Urdu and Sindhi — built around tracing script, native audio, and real conversation.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", ...t(320) }}>
          <button
            onClick={scrollToLang}
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em", padding: "16px 38px", borderRadius: 14, border: "none", backgroundColor: "#D4A853", color: "#1E2D3D", cursor: "pointer", boxShadow: "0 8px 32px rgba(212,168,83,0.38)", transition: "transform 100ms ease, box-shadow 150ms ease" }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 40px rgba(212,168,83,0.5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(212,168,83,0.38)"; }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
          >Start for free →</button>
          {!session && (
            <button
              onClick={() => navigate("/auth")}
              style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 15, fontWeight: 600, padding: "16px 28px", borderRadius: 14, border: "1px solid rgba(250,246,240,0.18)", backgroundColor: "transparent", color: "rgba(250,246,240,0.75)", cursor: "pointer", transition: "background 150ms ease, border-color 150ms ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(250,246,240,0.08)"; e.currentTarget.style.borderColor = "rgba(250,246,240,0.36)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(250,246,240,0.18)"; }}
            >Sign in</button>
          )}
        </div>

        {/* Fade to cream */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 56, background: "linear-gradient(to bottom, transparent, #FAF6F0)", pointerEvents: "none" }} />
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", maxWidth: 1020, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p className="gf-label" style={{ marginBottom: 10 }}>Why Guftugu</p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(26px, 5vw, 38px)", fontWeight: 700, color: "#1E2D3D", letterSpacing: "-0.025em", lineHeight: 1.15 }}>
            A different kind of language app
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="animate-slide-up"
              style={{ animationDelay: `${i * 110}ms`, backgroundColor: "#FFFFFF", border: "1px solid rgba(30,45,61,0.07)", borderRadius: 22, padding: "34px 28px", position: "relative", overflow: "hidden", transition: "transform 180ms ease, box-shadow 180ms ease" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 48px rgba(30,45,61,0.09)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "none"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
            >
              {/* Top accent bar */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: f.accent, borderRadius: "22px 22px 0 0" }} />
              {/* Icon */}
              <div style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: f.bg, display: "flex", alignItems: "center", justifyContent: "center", color: f.accent, marginBottom: 20 }}>
                {f.icon}
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: "#1E2D3D", marginBottom: 10, letterSpacing: "-0.01em" }}>
                {f.title}
              </h3>
              <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14, color: "#1E2D3D", opacity: 0.52, lineHeight: 1.75 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────────────── */}
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px" }}><GeometricDivider /></div>

      {/* ── How it works ─────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", maxWidth: 720, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p className="gf-label" style={{ marginBottom: 10 }}>The path</p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(26px, 5vw, 38px)", fontWeight: 700, color: "#1E2D3D", letterSpacing: "-0.025em" }}>
            How it works
          </h2>
        </div>

        <div style={{ position: "relative" }}>
          {/* Vertical connector line */}
          <div style={{ position: "absolute", left: 15, top: 36, bottom: 36, width: 1, backgroundColor: "rgba(30,45,61,0.08)", pointerEvents: "none" }} />

          {STEPS.map((step, i) => (
            <div
              key={i}
              className="animate-slide-up"
              style={{ animationDelay: `${i * 100}ms`, display: "flex", gap: 28, padding: "0 0 40px", position: "relative" }}
            >
              {/* Number badge */}
              <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: "50%", backgroundColor: i === 0 ? "#D4A853" : "#FFFFFF", border: `1.5px solid ${i === 0 ? "#D4A853" : "rgba(30,45,61,0.14)"}`, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, fontWeight: 800, color: i === 0 ? "#1E2D3D" : "rgba(30,45,61,0.35)", letterSpacing: "0.02em" }}>{i + 1}</span>
              </div>
              {/* Text */}
              <div style={{ paddingTop: 4 }}>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: "#1E2D3D", marginBottom: 7, letterSpacing: "-0.01em" }}>
                  {step.title}
                </h3>
                <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14, color: "#1E2D3D", opacity: 0.48, lineHeight: 1.75 }}>
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────────────── */}
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 24px" }}><GeometricDivider /></div>

      {/* ── Language selector ────────────────────────────────── */}
      <section ref={langRef as React.RefObject<HTMLElement>} style={{ padding: "80px 24px 100px", maxWidth: 580, margin: "0 auto", textAlign: "center", scrollMarginTop: 80 }}>
        <p className="gf-label" style={{ marginBottom: 10 }}>Begin your journey</p>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 6vw, 42px)", fontWeight: 700, color: "#1E2D3D", letterSpacing: "-0.025em", marginBottom: 10, lineHeight: 1.12 }}>
          Choose your language
        </h2>
        <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14, color: "rgba(30,45,61,0.45)", marginBottom: 36, lineHeight: 1.65 }}>
          Both share the same Nastaliq script — pick the one closest to you.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          {LANGUAGES.map((lang) => {
            const sel = selected === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setSelected(lang.id)}
                style={{
                  backgroundColor: sel ? "rgba(107,163,200,0.06)" : "#FFFFFF",
                  border: sel ? "2px solid #6BA3C8" : "1.5px solid rgba(30,45,61,0.09)",
                  borderRadius: 20, padding: "28px 20px", cursor: "pointer", textAlign: "center",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  boxShadow: sel ? "0 6px 24px rgba(107,163,200,0.18)" : "0 1px 6px rgba(30,45,61,0.05)",
                  transition: "all 170ms ease",
                }}
                onMouseEnter={(e) => { if (!sel) { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(30,45,61,0.09)"; } }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; (e.currentTarget as HTMLButtonElement).style.boxShadow = sel ? "0 6px 24px rgba(107,163,200,0.18)" : "0 1px 6px rgba(30,45,61,0.05)"; }}
              >
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: "#1E2D3D" }}>{lang.name}</span>
                <span style={{ fontFamily: "'Amiri', serif", fontSize: 42, color: sel ? "#6BA3C8" : "#1E2D3D", lineHeight: 1.55, direction: "rtl" }}>{lang.native}</span>
                <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, color: "rgba(30,45,61,0.45)", lineHeight: 1.5 }}>{lang.tagline}</span>
                <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: sel ? "#6BA3C8" : "rgba(30,45,61,0.28)" }}>{lang.speakers}</span>
              </button>
            );
          })}
        </div>

        <button
          disabled={!selected}
          onClick={handleStart}
          className="gf-focus-ring"
          style={{ width: "100%", height: 56, borderRadius: 14, border: "none", backgroundColor: selected ? "#1E2D3D" : "rgba(30,45,61,0.12)", color: selected ? "#FAF6F0" : "rgba(30,45,61,0.3)", fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", cursor: selected ? "pointer" : "not-allowed", boxShadow: selected ? "0 6px 24px rgba(30,45,61,0.22)" : "none", transition: "all 200ms ease" }}
          onMouseEnter={(e) => { if (selected) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(30,45,61,0.28)"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = selected ? "0 6px 24px rgba(30,45,61,0.22)" : "none"; }}
          onMouseDown={(e) => { if (selected) e.currentTarget.style.transform = "scale(0.97)"; }}
          onMouseUp={(e) => { if (selected) e.currentTarget.style.transform = "translateY(-1px)"; }}
        >
          {selected ? `Start learning ${LANGUAGES.find(l => l.id === selected)?.name} →` : "Select a language above"}
        </button>

        <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, color: "rgba(30,45,61,0.28)", marginTop: 14 }}>
          Free · No account needed to explore
        </p>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(30,45,61,0.08)", padding: "26px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span className="gf-wordmark-script" style={{ fontSize: 20 }}>گفتگو</span>
          <span className="gf-wordmark-latin" style={{ fontSize: 14 }}>Guftugu</span>
        </div>
        <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, color: "rgba(30,45,61,0.28)" }}>
          Urdu · Sindhi · More coming soon
        </p>
      </footer>

    </div>
  );
};

export default Index;
