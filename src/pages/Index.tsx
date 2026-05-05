import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// ─── Data ─────────────────────────────────────────────────────────────────────

const LANGUAGES = [
  {
    id: "urdu",
    name: "Urdu",
    native: "اردو",
    tagline: "National language of Pakistan",
    speakers: "70M+ speakers",
  },
  {
    id: "sindhi",
    name: "Sindhi",
    native: "سنڌي",
    tagline: "Language of the Indus Valley",
    speakers: "30M+ speakers",
  },
];

const FEATURES = [
  {
    icon: "✦",
    title: "Trace & Learn",
    desc: "Follow each stroke of Arabic script with guided letter tracing that builds real muscle memory.",
  },
  {
    icon: "◎",
    title: "Listen & Repeat",
    desc: "Authentic audio brings words to life. Train your ear before your tongue.",
  },
  {
    icon: "❖",
    title: "Build Fluency",
    desc: "Short daily lessons that chain together — vocabulary, grammar, conversation in one flow.",
  },
];

const STEPS = [
  { n: "01", title: "Pick your language", body: "Urdu or Sindhi — both rooted in the same beautiful script." },
  { n: "02", title: "Follow the path", body: "Each unit unlocks the next. Six stages per lesson, no skipping ahead." },
  { n: "03", title: "Come back daily", body: "A streak keeps momentum. Five minutes a day compounds fast." },
];

// ─── Small components ─────────────────────────────────────────────────────────

function GeometricDivider() {
  return (
    <svg width="100%" height="24" aria-hidden="true" style={{ display: "block", opacity: 0.18 }}>
      <defs>
        <pattern id="gdiv" x="0" y="0" width="48" height="24" patternUnits="userSpaceOnUse">
          <line x1="0" y1="12" x2="48" y2="12" stroke="#1E2D3D" strokeWidth="0.8" />
          <path d="M 24 7 L 29 12 L 24 17 L 19 12 Z" stroke="#1E2D3D" strokeWidth="0.8" fill="none" />
          <circle cx="0" cy="12" r="1.5" fill="#1E2D3D" />
          <circle cx="48" cy="12" r="1.5" fill="#1E2D3D" />
        </pattern>
      </defs>
      <rect width="100%" height="24" fill="url(#gdiv)" />
    </svg>
  );
}

// Decorative floating Arabic letters in the hero background
function FloatingScript() {
  const letters = ["ا", "ب", "ت", "ث", "ج", "ح", "خ", "د"];
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {letters.map((ch, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            fontFamily: "'Amiri', serif",
            fontSize: `${48 + (i % 3) * 32}px`,
            color: "#FFFFFF",
            opacity: 0.04 + (i % 4) * 0.015,
            top: `${8 + ((i * 137) % 80)}%`,
            left: `${5 + ((i * 97) % 90)}%`,
            transform: `rotate(${-12 + (i % 5) * 8}deg)`,
            userSelect: "none",
            direction: "rtl",
          }}
        >
          {ch}
        </span>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const Index = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const langSectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 60);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const displayName =
    (session?.user.user_metadata?.display_name as string | undefined) ??
    session?.user.email?.split("@")[0];

  const scrollToLanguages = () => {
    langSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleStart = () => {
    if (!selected) { scrollToLanguages(); return; }
    const lang = LANGUAGES.find((l) => l.id === selected);
    if (lang) localStorage.setItem("guftugu_language", lang.name);
    navigate(session ? "/course-map" : "/auth");
  };

  return (
    <div style={{ backgroundColor: "#FAF6F0", minHeight: "100vh" }}>

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="gf-nav">
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span className="gf-wordmark-script">گفتگو</span>
          <span className="gf-wordmark-latin">Guftugu</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {session ? (
            <>
              <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, fontWeight: 500, color: "#1E2D3D", opacity: 0.55 }}>
                {displayName}
              </span>
              <button
                onClick={() => navigate("/course-map")}
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, fontWeight: 700,
                  padding: "9px 18px", borderRadius: 10, border: "none",
                  backgroundColor: "#1E2D3D", color: "#FAF6F0", cursor: "pointer",
                  transition: "opacity 150ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Continue →
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/auth")}
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, fontWeight: 600,
                  padding: "9px 16px", borderRadius: 10,
                  border: "1px solid rgba(30,45,61,0.15)",
                  backgroundColor: "transparent", color: "#1E2D3D", cursor: "pointer",
                  transition: "background 150ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(30,45,61,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                Sign in
              </button>
              <button
                onClick={scrollToLanguages}
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, fontWeight: 700,
                  padding: "9px 18px", borderRadius: 10, border: "none",
                  backgroundColor: "#1E2D3D", color: "#FAF6F0", cursor: "pointer",
                  transition: "opacity 150ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                Get started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          backgroundColor: "#1E2D3D",
          overflow: "hidden",
          padding: "100px 24px 96px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <FloatingScript />

        {/* Top eyebrow label */}
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            backgroundColor: "rgba(212,168,83,0.15)",
            border: "1px solid rgba(212,168,83,0.3)",
            borderRadius: 99, padding: "6px 16px", marginBottom: 32,
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 500ms ease, transform 500ms ease",
          }}
        >
          <span style={{ fontSize: 14, color: "#D4A853", fontFamily: "'Amiri', serif" }}>زبان</span>
          <span style={{ width: 1, height: 14, backgroundColor: "rgba(212,168,83,0.4)" }} />
          <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D4A853" }}>
            Language Learning
          </span>
        </div>

        {/* Main headline */}
        <h1
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(36px, 8vw, 72px)",
            fontWeight: 700,
            color: "#FAF6F0",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            maxWidth: 720,
            marginBottom: 12,
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(18px)",
            transition: "opacity 550ms ease 80ms, transform 550ms ease 80ms",
          }}
        >
          Learn the language
          <br />
          <em style={{ color: "#D4A853", fontStyle: "italic" }}>of your roots.</em>
        </h1>

        {/* Arabic headline */}
        <p
          style={{
            fontFamily: "'Amiri', serif",
            fontSize: "clamp(28px, 5vw, 48px)",
            color: "rgba(250,246,240,0.35)",
            direction: "rtl",
            lineHeight: 1.6,
            marginBottom: 28,
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(14px)",
            transition: "opacity 550ms ease 160ms, transform 550ms ease 160ms",
          }}
        >
          اپنی زبان سیکھیں
        </p>

        {/* Subheading */}
        <p
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "clamp(15px, 2.5vw, 18px)",
            color: "rgba(250,246,240,0.55)",
            maxWidth: 480,
            lineHeight: 1.7,
            marginBottom: 44,
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 550ms ease 240ms, transform 550ms ease 240ms",
          }}
        >
          Bite-sized lessons in Urdu and Sindhi — built around tracing script, listening, and real conversation.
        </p>

        {/* CTA buttons */}
        <div
          style={{
            display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center",
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 550ms ease 320ms, transform 550ms ease 320ms",
          }}
        >
          <button
            onClick={scrollToLanguages}
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 16, fontWeight: 700,
              padding: "16px 36px", borderRadius: 14, border: "none",
              backgroundColor: "#D4A853", color: "#1E2D3D", cursor: "pointer",
              boxShadow: "0 8px 32px rgba(212,168,83,0.4)",
              transition: "transform 100ms ease, box-shadow 150ms ease",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(212,168,83,0.5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(212,168,83,0.4)"; }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          >
            Start for free →
          </button>
          {!session && (
            <button
              onClick={() => navigate("/auth")}
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 15, fontWeight: 600,
                padding: "16px 28px", borderRadius: 14,
                border: "1px solid rgba(250,246,240,0.2)",
                backgroundColor: "transparent", color: "rgba(250,246,240,0.8)", cursor: "pointer",
                transition: "background 150ms ease, border-color 150ms ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(250,246,240,0.08)"; e.currentTarget.style.borderColor = "rgba(250,246,240,0.4)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(250,246,240,0.2)"; }}
            >
              Sign in
            </button>
          )}
        </div>

        {/* Bottom fade */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 48, background: "linear-gradient(to bottom, transparent, #FAF6F0)", pointerEvents: "none" }} />
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section style={{ padding: "72px 24px", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p className="gf-label" style={{ marginBottom: 10 }}>Why Guftugu</p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(26px, 5vw, 38px)", fontWeight: 700, color: "#1E2D3D", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
            A different kind of language app
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="animate-slide-up"
              style={{
                animationDelay: `${i * 120}ms`,
                backgroundColor: "#FFFFFF",
                border: "1px solid rgba(30,45,61,0.08)",
                borderRadius: 20,
                padding: "32px 28px",
                transition: "transform 180ms ease, box-shadow 180ms ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(30,45,61,0.10)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
            >
              <div style={{ fontSize: 28, color: "#D4A853", marginBottom: 16, fontWeight: 700 }}>{f.icon}</div>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: "#1E2D3D", marginBottom: 10, letterSpacing: "-0.01em" }}>
                {f.title}
              </h3>
              <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14, color: "#1E2D3D", opacity: 0.55, lineHeight: 1.7 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────────── */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
        <GeometricDivider />
      </div>

      {/* ── How it works ────────────────────────────────────── */}
      <section style={{ padding: "72px 24px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p className="gf-label" style={{ marginBottom: 10 }}>The path</p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(26px, 5vw, 38px)", fontWeight: 700, color: "#1E2D3D", letterSpacing: "-0.02em" }}>
            How it works
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {STEPS.map((step, i) => (
            <div
              key={i}
              className="animate-slide-up"
              style={{
                animationDelay: `${i * 100}ms`,
                display: "flex", alignItems: "flex-start", gap: 24,
                padding: "28px 0",
                borderBottom: i < STEPS.length - 1 ? "1px solid rgba(30,45,61,0.08)" : "none",
              }}
            >
              {/* Step number */}
              <div style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 13, fontWeight: 700, color: "#D4A853",
                letterSpacing: "0.06em", minWidth: 28, paddingTop: 3,
              }}>
                {step.n}
              </div>
              {/* Content */}
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: "#1E2D3D", marginBottom: 6, letterSpacing: "-0.01em" }}>
                  {step.title}
                </h3>
                <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14, color: "#1E2D3D", opacity: 0.5, lineHeight: 1.7 }}>
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Divider ─────────────────────────────────────────── */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
        <GeometricDivider />
      </div>

      {/* ── Language selector ───────────────────────────────── */}
      <section ref={langSectionRef} style={{ padding: "80px 24px 100px", maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        <p className="gf-label" style={{ marginBottom: 10 }}>Begin your journey</p>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 6vw, 42px)", fontWeight: 700, color: "#1E2D3D", letterSpacing: "-0.02em", marginBottom: 8, lineHeight: 1.15 }}>
          Choose your language
        </h2>
        <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14, color: "#1E2D3D", opacity: 0.45, marginBottom: 36 }}>
          Both share the same Nastaliq script — pick the one closest to you.
        </p>

        {/* Language cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
          {LANGUAGES.map((lang) => {
            const isSelected = selected === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setSelected(lang.id)}
                className={`gf-lang-card gf-focus-ring${isSelected ? " selected" : ""}`}
                style={{
                  padding: "28px 20px",
                  transition: "border-color 150ms ease, background-color 150ms ease, transform 150ms ease, box-shadow 150ms ease",
                  boxShadow: isSelected ? "0 4px 20px rgba(107,163,200,0.18)" : "0 1px 4px rgba(30,45,61,0.04)",
                }}
              >
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: "#1E2D3D" }}>
                  {lang.name}
                </span>
                <span style={{ fontFamily: "'Amiri', serif", fontSize: 40, color: isSelected ? "#6BA3C8" : "#1E2D3D", lineHeight: 1.6, direction: "rtl" }}>
                  {lang.native}
                </span>
                <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, color: "#1E2D3D", opacity: 0.5, lineHeight: 1.5 }}>
                  {lang.tagline}
                </span>
                <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: isSelected ? "#6BA3C8" : "rgba(30,45,61,0.3)" }}>
                  {lang.speakers}
                </span>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <button
          disabled={!selected}
          onClick={handleStart}
          className="gf-focus-ring"
          style={{
            width: "100%", height: 56, borderRadius: 14, border: "none",
            backgroundColor: selected ? "#1E2D3D" : "rgba(30,45,61,0.2)",
            color: selected ? "#FAF6F0" : "rgba(30,45,61,0.35)",
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em",
            cursor: selected ? "pointer" : "not-allowed",
            boxShadow: selected ? "0 6px 24px rgba(30,45,61,0.22)" : "none",
            transition: "background 200ms ease, box-shadow 200ms ease, transform 80ms ease",
          }}
          onMouseEnter={(e) => { if (selected) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 10px 32px rgba(30,45,61,0.28)"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = selected ? "0 6px 24px rgba(30,45,61,0.22)" : "none"; }}
          onMouseDown={(e) => { if (selected) e.currentTarget.style.transform = "scale(0.97)"; }}
          onMouseUp={(e) => { if (selected) e.currentTarget.style.transform = "translateY(-1px)"; }}
        >
          {selected ? `Start learning ${LANGUAGES.find(l => l.id === selected)?.name} →` : "Select a language above"}
        </button>

        <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, color: "#1E2D3D", opacity: 0.3, marginTop: 14 }}>
          Free · No account needed to explore
        </p>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(30,45,61,0.08)", padding: "28px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span className="gf-wordmark-script" style={{ fontSize: 20 }}>گفتگو</span>
          <span className="gf-wordmark-latin" style={{ fontSize: 14 }}>Guftugu</span>
        </div>
        <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, color: "#1E2D3D", opacity: 0.3 }}>
          Urdu · Sindhi · More coming soon
        </p>
      </footer>

    </div>
  );
};

export default Index;
