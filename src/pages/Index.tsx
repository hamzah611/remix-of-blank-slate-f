import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// ─── Data ─────────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { id: "urdu",   name: "Urdu",   native: "اردو",  tagline: "National language of Pakistan", speakers: "70M+ speakers" },
  { id: "sindhi", name: "Sindhi", native: "سنڌي", tagline: "Language of the Indus Valley",   speakers: "30M+ speakers" },
];

const STATS = [
  { value: "2",    label: "Languages" },
  { value: "6",    label: "Lesson types" },
  { value: "100+", label: "Lessons" },
  { value: "Free", label: "To start" },
];

const FEATURES = [
  {
    color: "#D4A853",
    bg: "rgba(212,168,83,0.10)",
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
      </svg>
    ),
    title: "Trace Every Letter",
    desc: "Draw each character with your finger. The app detects your stroke coverage and gives real-time feedback — no guessing.",
  },
  {
    color: "#6BA3C8",
    bg: "rgba(107,163,200,0.10)",
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
      </svg>
    ),
    title: "Listen & Absorb",
    desc: "Every word has authentic audio. Train your ear first — speaking follows naturally from listening.",
  },
  {
    color: "#C17B4A",
    bg: "rgba(193,123,74,0.10)",
    svg: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: "Real Conversations",
    desc: "Dialogue exercises put words into context. Fill blanks, match images, build full sentences.",
  },
];

const PREVIEW_QUESTIONS = [
  { type: "Trace", icon: "✦", label: "Aghaaz", letter: "ب", hint: "Trace the letter Beh" },
  { type: "Listen", icon: "◎", label: "Suno", letter: "🔊", hint: "Tap to hear the word" },
  { type: "Match", icon: "◈", label: "Pehchano", letter: "کتاب", hint: "Match the image" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function NavBar({ session, onGetStarted }: { session: Session | null; onGetStarted: () => void }) {
  const navigate = useNavigate();
  const displayName =
    (session?.user.user_metadata?.display_name as string | undefined) ??
    session?.user.email?.split("@")[0];

  return (
    <nav className="gf-nav" style={{ paddingLeft: 28, paddingRight: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="gf-wordmark-script">گفتگو</span>
        <span className="gf-wordmark-latin">Guftugu</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {session ? (
          <>
            <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, fontWeight: 500, color: "#1E2D3D", opacity: 0.5 }}>
              {displayName}
            </span>
            <NavBtn primary onClick={() => navigate("/course-map")}>Continue →</NavBtn>
          </>
        ) : (
          <>
            <NavBtn onClick={() => navigate("/auth")}>Sign in</NavBtn>
            <NavBtn primary onClick={onGetStarted}>Get started</NavBtn>
          </>
        )}
      </div>
    </nav>
  );
}

function NavBtn({ children, onClick, primary }: { children: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, fontWeight: primary ? 700 : 600,
        padding: "9px 18px", borderRadius: 10, cursor: "pointer",
        border: primary ? "none" : "1px solid rgba(30,45,61,0.14)",
        backgroundColor: primary ? "#1E2D3D" : "transparent",
        color: primary ? "#FAF6F0" : "#1E2D3D",
        transition: "opacity 150ms ease, background 150ms ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = primary ? "0.8" : "1"; if (!primary) e.currentTarget.style.background = "rgba(30,45,61,0.05)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; if (!primary) e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </button>
  );
}

// Floating lesson preview card for hero
function LessonPreviewCard() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % PREVIEW_QUESTIONS.length), 2400);
    return () => clearInterval(t);
  }, []);
  const q = PREVIEW_QUESTIONS[active];
  return (
    <div style={{
      backgroundColor: "#FFFFFF",
      borderRadius: 24,
      padding: "28px 24px",
      width: 260,
      boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)",
      animation: "hero-float 4s ease-in-out infinite",
    }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6BA3C8" }}>
          {q.label}
        </span>
        <div style={{ display: "flex", gap: 3 }}>
          {PREVIEW_QUESTIONS.map((_, i) => (
            <div key={i} style={{ width: 18, height: 3, borderRadius: 99, backgroundColor: i === active ? "#D4A853" : "rgba(30,45,61,0.12)", transition: "background 400ms ease" }} />
          ))}
        </div>
      </div>
      {/* Letter display */}
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 20,
          backgroundColor: "rgba(30,45,61,0.04)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 12px",
          border: "1px solid rgba(30,45,61,0.08)",
        }}>
          <span style={{ fontFamily: "'Amiri', serif", fontSize: 42, color: "#1E2D3D", direction: "rtl" }}>{q.letter}</span>
        </div>
        <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, color: "rgba(30,45,61,0.45)" }}>{q.hint}</p>
      </div>
      {/* Mock answer options */}
      {["ب","پ","ت"].map((ch, i) => (
        <div key={i} style={{
          padding: "10px 14px", borderRadius: 10, marginBottom: i < 2 ? 6 : 0,
          border: `1.5px solid ${i === 0 ? "#6BA3C8" : "rgba(30,45,61,0.08)"}`,
          backgroundColor: i === 0 ? "rgba(107,163,200,0.07)" : "#FFFFFF",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontFamily: "'Amiri', serif", fontSize: 18, color: "#1E2D3D", direction: "rtl" }}>{ch}</span>
          {i === 0 && <span style={{ fontSize: 11, color: "#6BA3C8", fontWeight: 700 }}>●</span>}
        </div>
      ))}
    </div>
  );
}

// Geometric divider
function Divider() {
  return (
    <svg width="100%" height="20" aria-hidden="true" style={{ display: "block", opacity: 0.12 }}>
      <defs>
        <pattern id="gd" x="0" y="0" width="40" height="20" patternUnits="userSpaceOnUse">
          <line x1="0" y1="10" x2="40" y2="10" stroke="#1E2D3D" strokeWidth="0.8" />
          <path d="M 20 6 L 24 10 L 20 14 L 16 10 Z" stroke="#1E2D3D" strokeWidth="0.8" fill="none" />
          <circle cx="0" cy="10" r="1.2" fill="#1E2D3D" /><circle cx="40" cy="10" r="1.2" fill="#1E2D3D" />
        </pattern>
      </defs>
      <rect width="100%" height="20" fill="url(#gd)" />
    </svg>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const Index = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [visible, setVisible] = useState(false);
  const langRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const scrollToLang = () => langRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  const handleStart = () => {
    if (!selected) { scrollToLang(); return; }
    const lang = LANGUAGES.find((l) => l.id === selected);
    if (lang) localStorage.setItem("guftugu_language", lang.name);
    navigate(session ? "/course-map" : "/auth");
  };

  return (
    <div style={{ backgroundColor: "#FAF6F0", minHeight: "100vh" }}>
      <style>{`
        @keyframes hero-float {
          0%, 100% { transform: translateY(0px) rotate(1.5deg); }
          50%       { transform: translateY(-10px) rotate(1.5deg); }
        }
        @keyframes hero-float-slow {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-7px); }
        }
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 0.75; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <NavBar session={session} onGetStarted={scrollToLang} />

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section style={{ position: "relative", backgroundColor: "#111820", overflow: "hidden", minHeight: "92vh", display: "flex", alignItems: "center" }}>

        {/* Background glow blobs */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "-10%", left: "50%", transform: "translateX(-50%)", width: 800, height: 600, background: "radial-gradient(ellipse, rgba(212,168,83,0.12) 0%, transparent 65%)", animation: "glow-pulse 5s ease-in-out infinite" }} />
          <div style={{ position: "absolute", bottom: "0%", right: "-5%", width: 500, height: 400, background: "radial-gradient(ellipse, rgba(107,163,200,0.08) 0%, transparent 65%)" }} />
          {/* Large faint Arabic letters */}
          {["ا","ب","ج","د","ر","س","ع","ق"].map((ch, i) => (
            <span key={i} aria-hidden="true" style={{
              position: "absolute", fontFamily: "'Amiri', serif",
              fontSize: `${56 + (i % 3) * 40}px`,
              color: "#FFFFFF", opacity: 0.025 + (i % 3) * 0.01,
              top: `${6 + ((i * 131) % 82)}%`,
              left: `${4 + ((i * 89) % 88)}%`,
              transform: `rotate(${-15 + (i % 5) * 8}deg)`,
              userSelect: "none", direction: "rtl",
            }}>{ch}</span>
          ))}
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 48, flexWrap: "wrap" }}>

          {/* Left — text */}
          <div style={{ flex: "1 1 420px", maxWidth: 560 }}>
            {/* Eyebrow */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28,
              background: "rgba(212,168,83,0.12)", border: "1px solid rgba(212,168,83,0.25)",
              borderRadius: 99, padding: "6px 16px",
              opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)",
              transition: "opacity 500ms ease, transform 500ms ease",
            }}>
              <span style={{ fontFamily: "'Amiri', serif", fontSize: 15, color: "#D4A853" }}>زبان</span>
              <span style={{ width: 1, height: 12, background: "rgba(212,168,83,0.35)" }} />
              <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D4A853" }}>
                Language Learning
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(38px, 6.5vw, 68px)",
              fontWeight: 700, color: "#FAF6F0",
              lineHeight: 1.08, letterSpacing: "-0.03em",
              marginBottom: 10,
              opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(18px)",
              transition: "opacity 560ms ease 80ms, transform 560ms ease 80ms",
            }}>
              Learn the language<br />
              <span style={{ color: "#D4A853", fontStyle: "italic" }}>of your roots.</span>
            </h1>

            {/* Arabic echo */}
            <p style={{
              fontFamily: "'Amiri', serif", fontSize: "clamp(22px, 3.5vw, 36px)",
              color: "rgba(250,246,240,0.22)", direction: "rtl", lineHeight: 1.7, marginBottom: 24,
              opacity: visible ? 1 : 0, transition: "opacity 560ms ease 160ms",
            }}>
              اپنی زبان سیکھیں
            </p>

            {/* Subtext */}
            <p style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "clamp(15px, 2vw, 17px)", color: "rgba(250,246,240,0.50)",
              lineHeight: 1.75, maxWidth: 440, marginBottom: 40,
              opacity: visible ? 1 : 0, transition: "opacity 560ms ease 240ms",
            }}>
              Daily lessons in Urdu and Sindhi — built around tracing script, native audio, and real conversation practice.
            </p>

            {/* CTAs */}
            <div style={{
              display: "flex", gap: 12, flexWrap: "wrap",
              opacity: visible ? 1 : 0, transition: "opacity 560ms ease 320ms",
            }}>
              <button
                onClick={scrollToLang}
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em",
                  padding: "16px 36px", borderRadius: 14, border: "none",
                  backgroundColor: "#D4A853", color: "#1E2D3D", cursor: "pointer",
                  boxShadow: "0 8px 32px rgba(212,168,83,0.35)",
                  transition: "transform 100ms ease, box-shadow 150ms ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 14px 40px rgba(212,168,83,0.45)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(212,168,83,0.35)"; }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
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
                    border: "1px solid rgba(250,246,240,0.18)",
                    backgroundColor: "transparent", color: "rgba(250,246,240,0.72)", cursor: "pointer",
                    transition: "background 150ms ease, border-color 150ms ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(250,246,240,0.07)"; e.currentTarget.style.borderColor = "rgba(250,246,240,0.35)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(250,246,240,0.18)"; }}
                >
                  Sign in
                </button>
              )}
            </div>
          </div>

          {/* Right — floating lesson card */}
          <div style={{
            flex: "0 0 auto", display: "flex", justifyContent: "center",
            opacity: visible ? 1 : 0, transition: "opacity 700ms ease 400ms",
          }}>
            <LessonPreviewCard />
          </div>
        </div>

        {/* Bottom fade into cream */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to bottom, transparent, #FAF6F0)", pointerEvents: "none" }} />
      </section>

      {/* ── Stats strip ──────────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid rgba(30,45,61,0.07)", padding: "0 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 0 }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ padding: "28px 20px", textAlign: "center", flex: "1 1 120px" }}>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 700, color: "#1E2D3D", letterSpacing: "-0.02em", marginBottom: 4 }}>{s.value}</p>
              <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#1E2D3D", opacity: 0.35 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section style={{ padding: "88px 24px", maxWidth: 1060, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p className="gf-label" style={{ marginBottom: 10 }}>Why Guftugu</p>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 700, color: "#1E2D3D", letterSpacing: "-0.025em", lineHeight: 1.15 }}>
            Built different, by design
          </h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="animate-slide-up"
              style={{
                animationDelay: `${i * 110}ms`,
                backgroundColor: "#FFFFFF",
                border: "1px solid rgba(30,45,61,0.07)",
                borderRadius: 22,
                padding: "36px 30px",
                position: "relative",
                overflow: "hidden",
                transition: "transform 200ms ease, box-shadow 200ms ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-5px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 16px 48px rgba(30,45,61,0.10)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
            >
              {/* Top accent line */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, borderRadius: "22px 22px 0 0", backgroundColor: f.color }} />
              {/* Icon */}
              <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: f.bg, display: "flex", alignItems: "center", justifyContent: "center", color: f.color, marginBottom: 20 }}>
                {f.svg}
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 21, fontWeight: 700, color: "#1E2D3D", marginBottom: 10, letterSpacing: "-0.01em" }}>
                {f.title}
              </h3>
              <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14, color: "#1E2D3D", opacity: 0.52, lineHeight: 1.75 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── The path / steps ─────────────────────────────────── */}
      <section style={{ backgroundColor: "#1E2D3D", padding: "88px 24px", position: "relative", overflow: "hidden" }}>
        {/* Subtle pattern */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.03 }}>
          {["ا","ب","ت","ث","ج","ح"].map((ch, i) => (
            <span key={i} style={{ position: "absolute", fontFamily: "'Amiri', serif", fontSize: `${60 + (i % 2) * 30}px`, color: "#FAF6F0", top: `${10 + ((i * 111) % 70)}%`, left: `${5 + ((i * 83) % 88)}%`, userSelect: "none", direction: "rtl" }}>{ch}</span>
          ))}
        </div>
        <div style={{ maxWidth: 760, margin: "0 auto", position: "relative" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(212,168,83,0.7)", marginBottom: 10 }}>The path</p>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 700, color: "#FAF6F0", letterSpacing: "-0.025em" }}>
              How it works
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { n: "01", title: "Pick your language", body: "Urdu or Sindhi — both rooted in the same beautiful Nastaliq script." },
              { n: "02", title: "Follow the path", body: "Six lesson types per unit. Each one unlocks the next. No skipping." },
              { n: "03", title: "Show up daily", body: "Five focused minutes a day compounds into real fluency. Your streak tracks it." },
            ].map((step, i) => (
              <div key={i} style={{
                display: "flex", gap: 28, padding: "32px 0",
                borderBottom: i < 2 ? "1px solid rgba(250,246,240,0.08)" : "none",
              }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 13, fontWeight: 700, color: "#D4A853", letterSpacing: "0.06em", minWidth: 28, paddingTop: 4, opacity: 0.8 }}>
                  {step.n}
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 21, fontWeight: 700, color: "#FAF6F0", marginBottom: 8, letterSpacing: "-0.01em" }}>
                    {step.title}
                  </h3>
                  <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14, color: "rgba(250,246,240,0.45)", lineHeight: 1.75 }}>
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Language selector ────────────────────────────────── */}
      <section ref={langRef} style={{ padding: "88px 24px 100px", maxWidth: 600, margin: "0 auto", textAlign: "center", scrollMarginTop: 80 }}>
        <p className="gf-label" style={{ marginBottom: 10 }}>Begin today</p>
        <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(28px, 6vw, 44px)", fontWeight: 700, color: "#1E2D3D", letterSpacing: "-0.025em", marginBottom: 10, lineHeight: 1.1 }}>
          Choose your language
        </h2>
        <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 15, color: "rgba(30,45,61,0.45)", marginBottom: 40, lineHeight: 1.6 }}>
          Both share the same Nastaliq script — pick the one closest to you.
        </p>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          {LANGUAGES.map((lang) => {
            const sel = selected === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => setSelected(lang.id)}
                style={{
                  backgroundColor: sel ? "rgba(107,163,200,0.06)" : "#FFFFFF",
                  border: sel ? "2px solid #6BA3C8" : "1.5px solid rgba(30,45,61,0.09)",
                  borderRadius: 20, padding: "28px 20px",
                  cursor: "pointer", textAlign: "center",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  boxShadow: sel ? "0 6px 24px rgba(107,163,200,0.18)" : "0 1px 6px rgba(30,45,61,0.05)",
                  transition: "all 160ms ease",
                }}
                onMouseEnter={(e) => { if (!sel) { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 28px rgba(30,45,61,0.10)"; } }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; (e.currentTarget as HTMLButtonElement).style.boxShadow = sel ? "0 6px 24px rgba(107,163,200,0.18)" : "0 1px 6px rgba(30,45,61,0.05)"; }}
              >
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: "#1E2D3D" }}>{lang.name}</span>
                <span style={{ fontFamily: "'Amiri', serif", fontSize: 42, color: sel ? "#6BA3C8" : "#1E2D3D", lineHeight: 1.5, direction: "rtl" }}>{lang.native}</span>
                <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, color: "rgba(30,45,61,0.45)", lineHeight: 1.5 }}>{lang.tagline}</span>
                <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", color: sel ? "#6BA3C8" : "rgba(30,45,61,0.28)" }}>{lang.speakers}</span>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <button
          disabled={!selected}
          onClick={handleStart}
          style={{
            width: "100%", height: 58, borderRadius: 16, border: "none",
            backgroundColor: selected ? "#1E2D3D" : "rgba(30,45,61,0.12)",
            color: selected ? "#FAF6F0" : "rgba(30,45,61,0.3)",
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em",
            cursor: selected ? "pointer" : "not-allowed",
            boxShadow: selected ? "0 6px 28px rgba(30,45,61,0.24)" : "none",
            transition: "all 200ms ease",
          }}
          onMouseEnter={(e) => { if (selected) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 36px rgba(30,45,61,0.30)"; } }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = selected ? "0 6px 28px rgba(30,45,61,0.24)" : "none"; }}
          onMouseDown={(e) => { if (selected) e.currentTarget.style.transform = "scale(0.97)"; }}
          onMouseUp={(e) => { if (selected) e.currentTarget.style.transform = "translateY(-2px)"; }}
        >
          {selected ? `Start learning ${LANGUAGES.find(l => l.id === selected)?.name} →` : "Select a language above"}
        </button>

        <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, color: "rgba(30,45,61,0.28)", marginTop: 14 }}>
          Free · No credit card required
        </p>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(30,45,61,0.08)", padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
