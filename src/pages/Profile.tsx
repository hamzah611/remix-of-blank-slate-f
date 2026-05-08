import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function XpCoin({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7.5" fill="#D4A853" />
      <circle cx="8" cy="8" r="5.5" fill="#C49840" fillOpacity="0.35" />
      <text x="8" y="11.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#FAF6F0" fontFamily="Inter, sans-serif">XP</text>
    </svg>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(30,45,61,0.08)", borderRadius: 16, padding: "20px 18px", textAlign: "center" }}>
      <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 30, fontWeight: 700, color: color ?? "#1E2D3D", letterSpacing: "-0.02em", marginBottom: 4 }}>{value}</p>
      <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "rgba(30,45,61,0.4)" }}>{label}</p>
      {sub && <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, color: "rgba(30,45,61,0.3)", marginTop: 3 }}>{sub}</p>}
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [draftName, setDraftName] = useState("");
  const [plan, setPlan] = useState<"free" | "premium">("free");
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [lessonsCompleted, setLessonsCompleted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);
    });
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    loadData();
  }, [userId]);

  const loadData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [profileRes, xpRes, streakRes, progressRes] = await Promise.all([
        supabase.from("profiles").select("display_name, plan").eq("user_id", userId).maybeSingle(),
        supabase.from("user_xp").select("total_xp").eq("user_id", userId).maybeSingle(),
        supabase.from("user_streaks").select("current_streak, longest_streak").eq("user_id", userId).maybeSingle(),
        supabase.from("user_progress").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("completed", true),
      ]);

      const name = (profileRes.data as any)?.display_name ?? "";
      setDisplayName(name);
      setDraftName(name);
      setPlan(((profileRes.data as any)?.plan ?? "free") as "free" | "premium");
      setTotalXp((xpRes.data as any)?.total_xp ?? 0);
      setStreak((streakRes.data as any)?.current_streak ?? 0);
      setLongestStreak((streakRes.data as any)?.longest_streak ?? 0);
      setLessonsCompleted(progressRes.count ?? 0);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!userId || !draftName.trim() || draftName === displayName) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: draftName.trim() })
        .eq("user_id", userId);
      if (error) throw error;

      // Update auth metadata + refresh session so nav picks up new name immediately
      await supabase.auth.updateUser({ data: { display_name: draftName.trim() } });
      await supabase.auth.refreshSession();

      setDisplayName(draftName.trim());
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
      toast.success("Name updated!");
    } catch {
      toast.error("Failed to update name.");
    } finally {
      setSaving(false);
    }
  };

  const initials = displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "U";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "#FAF6F0" }}>
        <div style={{ width: 36, height: 36, border: "3px solid rgba(30,45,61,0.08)", borderTop: "3px solid #D4A853", borderRadius: "50%" }} className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#FAF6F0", minHeight: "100vh" }}>

      {/* ── Nav ── */}
      <nav className="gf-nav">
        <button
          onClick={() => navigate("/course-map")}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: "#1E2D3D", fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14, fontWeight: 600, opacity: 0.6, padding: 0, transition: "opacity 150ms ease" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
        >
          <ArrowLeft size={16} /> Course Map
        </button>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span className="gf-wordmark-script">گفتگو</span>
          <span className="gf-wordmark-latin">Guftugu</span>
        </div>
      </nav>

      <div className="animate-page-entry" style={{ maxWidth: 560, margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* ── Avatar + name ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 40 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", backgroundColor: "#6BA3C8", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontFamily: "'Inter', system-ui, sans-serif", fontSize: 28, fontWeight: 700, marginBottom: 16, boxShadow: "0 4px 20px rgba(107,163,200,0.3)" }}>
            {initials}
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: plan === "premium" ? "rgba(212,168,83,0.12)" : "rgba(30,45,61,0.05)", border: `1px solid ${plan === "premium" ? "rgba(212,168,83,0.3)" : "rgba(30,45,61,0.12)"}`, borderRadius: 99, padding: "4px 12px" }}>
            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif", color: plan === "premium" ? "#C17B4A" : "rgba(30,45,61,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {plan === "premium" ? "⭐ Premium" : "Free"}
            </span>
          </div>
        </div>

        {/* ── Stats grid ── */}
        <p className="gf-label" style={{ marginBottom: 12 }}>Your stats</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 36 }}>
          <StatCard label="Total XP" value={totalXp} color="#C49840" />
          <StatCard label="Current Streak" value={streak} sub={longestStreak > streak ? `Best: ${longestStreak}` : undefined} color="#C17B4A" />
          <StatCard label="Lessons Done" value={lessonsCompleted} />
          <StatCard label="Plan" value={plan === "premium" ? "Premium" : "Free"} color={plan === "premium" ? "#C17B4A" : undefined} />
        </div>

        {/* ── Streak visual ── */}
        {streak > 0 && (
          <div style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(30,45,61,0.08)", borderRadius: 16, padding: "18px 20px", marginBottom: 28, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(193,123,74,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Flame size={22} style={{ color: "#C17B4A" }} />
            </div>
            <div>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: "#1E2D3D", marginBottom: 2 }}>
                {streak} day{streak !== 1 ? "s" : ""} in a row
              </p>
              <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, color: "rgba(30,45,61,0.45)" }}>
                Keep it up — come back tomorrow!
              </p>
            </div>
          </div>
        )}

        {/* ── Edit display name ── */}
        <p className="gf-label" style={{ marginBottom: 12 }}>Display name</p>
        <div style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(30,45,61,0.08)", borderRadius: 16, padding: "20px", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              value={draftName}
              onChange={(e) => { setDraftName(e.target.value); setNameSaved(false); }}
              className="gf-input"
              style={{ flex: 1, height: 48, borderRadius: 10, fontSize: 15 }}
              placeholder="Your display name"
              maxLength={32}
            />
            <button
              onClick={handleSaveName}
              disabled={saving || !draftName.trim() || draftName === displayName}
              style={{
                height: 48, padding: "0 20px", borderRadius: 10, border: "none",
                backgroundColor: nameSaved ? "#4CAF50" : "#1E2D3D",
                color: "#FAF6F0", fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                opacity: (!draftName.trim() || draftName === displayName) ? 0.35 : 1,
                transition: "background 200ms ease, opacity 150ms ease",
                display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
              }}
            >
              {nameSaved ? <><Check size={14} /> Saved</> : saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {/* ── Sign out ── */}
        <button
          onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }}
          style={{ width: "100%", padding: "14px", borderRadius: 12, border: "1.5px solid rgba(30,45,61,0.12)", backgroundColor: "transparent", color: "rgba(30,45,61,0.55)", fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "background 150ms ease" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(30,45,61,0.04)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          Sign out
        </button>

      </div>
    </div>
  );
}
