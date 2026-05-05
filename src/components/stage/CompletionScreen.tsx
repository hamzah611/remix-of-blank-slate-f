interface CompletionScreenProps {
  stageName: string;
  xpEarned: number;
  accuracy: number; // 0–1
  onContinue: () => void;
}

export function CompletionScreen({
  stageName,
  xpEarned,
  accuracy,
  onContinue,
}: CompletionScreenProps) {
  const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.7 ? 2 : 1;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gf-completion-wrap"
      style={{ backgroundColor: "#FAF6F0", overflowX: "hidden" }}
    >
      {/* ── Star rating ── */}
      <div className="flex items-end gap-3 mb-8">
        {[1, 2, 3].map((s) => {
          const earned = s <= stars;
          // Middle star is biggest for the "trophy" look
          const size = s === 2 ? 68 : 52;
          const delay = s === 1 ? 80 : s === 2 ? 200 : 340;
          return (
            <span
              key={s}
              className="animate-pop-in"
              style={{
                fontSize: size,
                lineHeight: 1,
                display: "inline-block",
                filter: earned ? "none" : "grayscale(1) opacity(0.18)",
                animationDelay: `${delay}ms`,
                transformOrigin: "bottom center",
              }}
            >
              ⭐
            </span>
          );
        })}
      </div>

      {/* ── Stage complete label ── */}
      <p
        className="animate-fade-up delay-400 text-xs font-semibold uppercase tracking-widest mb-2"
        style={{ color: "#1E2D3D", opacity: 0.45 }}
      >
        Stage Complete
      </p>

      {/* ── Stage name ── */}
      <h1
        className="animate-slide-up delay-400"
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "clamp(26px, 7vw, 36px)",
          fontWeight: 700,
          color: "#1E2D3D",
          textAlign: "center",
          marginBottom: 4,
          letterSpacing: "-0.02em",
        }}
      >
        {stageName}
      </h1>

      {/* ── XP badge ── */}
      <div
        className="animate-xp-bounce delay-550"
        style={{
          backgroundColor: "#D4A853",
          color: "#FFFFFF",
          borderRadius: 99,
          padding: "12px 32px",
          fontWeight: 800,
          fontSize: 22,
          marginTop: 24,
          marginBottom: 6,
          boxShadow: "0 6px 24px rgba(212,168,83,0.45)",
          letterSpacing: "-0.01em",
          fontFamily: "'Playfair Display', Georgia, serif",
        }}
      >
        +{xpEarned} XP
      </div>

      {/* ── Accuracy ── */}
      <p
        className="animate-fade-up delay-700"
        style={{ color: "#1E2D3D", opacity: 0.45, fontSize: 14, marginBottom: 40, fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {Math.round(accuracy * 100)}% accuracy
      </p>

      {/* ── Divider ── */}
      <div
        className="animate-fade-up delay-700"
        style={{
          width: "100%",
          maxWidth: 360,
          height: 1,
          backgroundColor: "rgba(30,45,61,0.10)",
          marginBottom: 28,
        }}
      />

      {/* ── Continue button ── */}
      <button
        onClick={onContinue}
        className="animate-slide-up delay-800 gf-focus-ring"
        style={{
          width: "100%",
          maxWidth: 360,
          padding: "18px",
          borderRadius: 16,
          backgroundColor: "#1E2D3D",
          color: "#FAF6F0",
          border: "none",
          fontWeight: 700,
          fontSize: 16,
          cursor: "pointer",
          boxShadow: "0 6px 24px rgba(30,45,61,0.22)",
          fontFamily: "'Playfair Display', Georgia, serif",
          letterSpacing: "-0.01em",
          transition: "transform 80ms ease, box-shadow 150ms ease",
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = "scale(0.97)";
          e.currentTarget.style.boxShadow = "0 2px 8px rgba(30,45,61,0.15)";
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(30,45,61,0.22)";
        }}
      >
        Back to Course Map →
      </button>
    </div>
  );
}
