import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flame,
  Lock,
  Check,
  Play,
  Headphones,
  Lightbulb,
  Eye,
  RotateCcw,
  MessageCircle,
  LogOut,
  Shield,
  X,
  Copy,
  MessageSquare,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminRole } from "./admin/adminTypes";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Unit {
  id: string;
  name: string;
  order_index: number;
}

interface Stage {
  id: string;
  name: string;
  stage_type: string;
  stage_number: number;
  order_index: number;
  unit_id: string;
}

type StageState = "locked" | "available" | "completed" | "current";

// ─── Stage icon map ───────────────────────────────────────────────────────────

const STAGE_ICONS: Record<string, React.ElementType> = {
  aghaaz: Play,
  suno: Headphones,
  samjho: Lightbulb,
  pehchano: Eye,
  dohrao: RotateCcw,
  guftugu: MessageCircle,
};

// ─── Fallback hardcoded data ──────────────────────────────────────────────────

const FALLBACK_UNITS = [
  { id: "fallback-u1", name: "Haroof e Tahaji", order_index: 0 },
  { id: "fallback-u2", name: "Salaam Dua", order_index: 1 },
  { id: "fallback-u3", name: "Ginti", order_index: 2 },
];

const FALLBACK_STAGE_DEFS = [
  { name: "Aghaaz", stage_type: "aghaaz", stage_number: 1, order_index: 0 },
  { name: "Suno", stage_type: "suno", stage_number: 2, order_index: 1 },
  { name: "Samjho", stage_type: "samjho", stage_number: 3, order_index: 2 },
  { name: "Pehchano", stage_type: "pehchano", stage_number: 4, order_index: 3 },
  { name: "Dohrao", stage_type: "dohrao", stage_number: 5, order_index: 4 },
  { name: "Guftugu", stage_type: "guftugu", stage_number: 6, order_index: 5 },
];

// ─── XP coin icon ─────────────────────────────────────────────────────────────

function XpCoin({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="8" cy="8" r="7.5" fill="#D4A853" />
      <circle cx="8" cy="8" r="5.5" fill="#C49840" fillOpacity="0.35" />
      <text
        x="8"
        y="11.5"
        textAnchor="middle"
        fontSize="7"
        fontWeight="bold"
        fill="#FAF6F0"
        fontFamily="Inter, sans-serif"
      >
        XP
      </text>
    </svg>
  );
}

// ─── Avatar component ─────────────────────────────────────────────────────────

function UserAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return <div className="gf-avatar">{initials}</div>;
}

// ─── Stage circle ─────────────────────────────────────────────────────────────

function StageCircle({
  stage,
  state,
  onClick,
}: {
  stage: { name: string; stage_type: string };
  state: StageState;
  onClick: () => void;
}) {
  const Icon = STAGE_ICONS[stage.stage_type] ?? Play;
  const isCurrent = state === "current";
  const isLocked = state === "locked";
  const isCompleted = state === "completed";

  const bgColor = isCompleted
    ? "#D4A853"
    : isLocked
    ? "rgba(30,45,61,0.08)"
    : "#6BA3C8";

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        disabled={isLocked}
        className={`gf-stage-btn${isCurrent ? " current animate-stage-pulse" : ""}`}
        style={{ backgroundColor: bgColor }}
        aria-label={stage.name}
      >
        {isCompleted ? (
          <Check size={18} color="white" strokeWidth={2.5} />
        ) : isLocked ? (
          <Lock size={14} color="rgba(30,45,61,0.3)" strokeWidth={2} />
        ) : (
          <Icon size={17} color="white" strokeWidth={2} />
        )}
      </button>
      <span
        style={{
          fontSize: 11,
          fontFamily: "'Inter', system-ui, sans-serif",
          fontWeight: isCurrent ? 700 : 500,
          color: isLocked ? "rgba(30,45,61,0.3)" : "#1E2D3D",
          opacity: isLocked ? 1 : isCurrent ? 1 : 0.5,
          width: 52,
          textAlign: "center",
          lineHeight: 1.3,
          letterSpacing: "0.01em",
        }}
      >
        {stage.name}
      </span>
    </div>
  );
}

// ─── Unit card ────────────────────────────────────────────────────────────────

// ─── Upgrade Modal ───────────────────────────────────────────────────────────

const SADAPAY = "03330600332";
const WHATSAPP = "03330600332";

function UpgradeModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copyNumber = () => {
    navigator.clipboard.writeText(SADAPAY).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        backgroundColor: "rgba(30,45,61,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#FAF6F0",
          borderRadius: 24,
          padding: "36px 28px 28px",
          maxWidth: 400,
          width: "100%",
          boxShadow: "0 32px 80px rgba(30,45,61,0.28)",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(30,45,61,0.35)", padding: 4, borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "color 150ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#1E2D3D")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(30,45,61,0.35)")}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⭐</div>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 24, fontWeight: 700, color: "#1E2D3D",
            letterSpacing: "-0.02em", marginBottom: 8,
          }}>
            Upgrade to Premium
          </h2>
          <p style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 14, color: "rgba(30,45,61,0.55)", lineHeight: 1.6,
            marginBottom: 16,
          }}>
            Unlock all units across <strong style={{ color: "#1E2D3D" }}>both subjects</strong> — Urdu &amp; Sindhi.
          </p>

          {/* Pricing cards */}
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{
              flex: 1, backgroundColor: "rgba(107,163,200,0.08)",
              border: "1.5px solid rgba(107,163,200,0.3)",
              borderRadius: 14, padding: "14px 10px",
            }}>
              <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#4A7FA5", marginBottom: 6 }}>
                Students
              </p>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: "#1E2D3D", letterSpacing: "-0.02em", lineHeight: 1 }}>
                Rs. 150
              </p>
              <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, color: "rgba(30,45,61,0.4)", marginTop: 4 }}>
                with student ID
              </p>
            </div>
            <div style={{
              flex: 1, backgroundColor: "rgba(212,168,83,0.08)",
              border: "1.5px solid rgba(212,168,83,0.35)",
              borderRadius: 14, padding: "14px 10px",
            }}>
              <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#C17B4A", marginBottom: 6 }}>
                Others
              </p>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 26, fontWeight: 700, color: "#1E2D3D", letterSpacing: "-0.02em", lineHeight: 1 }}>
                Rs. 250
              </p>
              <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 11, color: "rgba(30,45,61,0.4)", marginTop: 4 }}>
                general access
              </p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>

          {/* Step 1 — SadaPay */}
          <div style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(30,45,61,0.08)",
            borderRadius: 14, padding: "16px 18px",
          }}>
            <p style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 10, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "rgba(30,45,61,0.4)", marginBottom: 8,
            }}>
              Step 1 — Send payment via SadaPay
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div>
                <p style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 22, fontWeight: 700, color: "#1E2D3D",
                  letterSpacing: "0.04em",
                }}>
                  {SADAPAY}
                </p>
                <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, color: "rgba(30,45,61,0.4)", marginTop: 2 }}>
                  SadaPay account number
                </p>
              </div>
              <button
                onClick={copyNumber}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "8px 14px", borderRadius: 10,
                  backgroundColor: copied ? "rgba(76,175,80,0.1)" : "rgba(30,45,61,0.06)",
                  border: `1px solid ${copied ? "rgba(76,175,80,0.3)" : "rgba(30,45,61,0.1)"}`,
                  color: copied ? "#4CAF50" : "#1E2D3D",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  transition: "all 200ms ease",
                  flexShrink: 0,
                }}
              >
                <Copy size={12} />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Step 2 — WhatsApp */}
          <div style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(30,45,61,0.08)",
            borderRadius: 14, padding: "16px 18px",
          }}>
            <p style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 10, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.08em", color: "rgba(30,45,61,0.4)", marginBottom: 8,
            }}>
              Step 2 — Send screenshot to WhatsApp
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div>
                <p style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 22, fontWeight: 700, color: "#1E2D3D",
                  letterSpacing: "0.04em",
                }}>
                  {WHATSAPP}
                </p>
                <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 12, color: "rgba(30,45,61,0.4)", marginTop: 2 }}>
                  Send your payment screenshot here
                </p>
              </div>
              <a
                href={`https://wa.me/92${WHATSAPP.replace(/^0/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "8px 14px", borderRadius: 10,
                  backgroundColor: "rgba(37,211,102,0.1)",
                  border: "1px solid rgba(37,211,102,0.3)",
                  color: "#128C7E",
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: 12, fontWeight: 600, cursor: "pointer",
                  textDecoration: "none",
                  flexShrink: 0,
                  transition: "all 200ms ease",
                }}
              >
                <MessageSquare size={12} />
                Open
              </a>
            </div>
          </div>

          {/* Step 3 — Wait */}
          <div style={{
            backgroundColor: "rgba(212,168,83,0.07)",
            border: "1px solid rgba(212,168,83,0.2)",
            borderRadius: 14, padding: "14px 18px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ fontSize: 20 }}>⏳</span>
            <p style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 13, color: "rgba(30,45,61,0.65)", lineHeight: 1.5,
            }}>
              Your account will be upgraded to Premium within <strong style={{ color: "#1E2D3D" }}>24 hours</strong> of receiving your payment.
            </p>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onClose}
          style={{
            width: "100%", padding: "14px",
            borderRadius: 14, border: "none",
            backgroundColor: "#1E2D3D", color: "#FAF6F0",
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            transition: "transform 80ms ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

function UnitCard({
  unit,
  unitIdx,
  stages,
  completedStageIds,
  firstAvailableStageId,
  isUnitLocked,
  isPlanLocked,
  onStageClick,
  onUpgrade,
}: {
  unit: Unit;
  unitIdx: number;
  stages: Stage[];
  completedStageIds: Set<string>;
  firstAvailableStageId: string | null;
  isUnitLocked: boolean;
  isPlanLocked: boolean;
  onStageClick: (stageId: string, state: StageState) => void;
  onUpgrade: () => void;
}) {
  const completedCount = stages.filter((s) => completedStageIds.has(s.id)).length;

  const getStageState = (stage: Stage, stageIdx: number): StageState => {
    if (completedStageIds.has(stage.id)) return "completed";
    if (stage.id === firstAvailableStageId) return "current";
    if (stages.slice(0, stageIdx).every((s) => completedStageIds.has(s.id))) return "available";
    return "locked";
  };

  return (
    <div
      className="gf-card"
      onClick={isPlanLocked ? onUpgrade : undefined}
      style={{
        borderRadius: 16,
        opacity: isUnitLocked ? 0.65 : 1,
        transition: "opacity 200ms ease, transform 150ms ease",
        position: "relative",
        cursor: isPlanLocked ? "pointer" : "default",
      }}
      onMouseEnter={(e) => { if (isPlanLocked) e.currentTarget.style.transform = "translateY(-2px)"; }}
      onMouseLeave={(e) => { if (isPlanLocked) e.currentTarget.style.transform = "translateY(0)"; }}
    >
      <div className="gf-unit-card-inner">
      {/* Lock badge */}
      {isUnitLocked && (
        <button
          onClick={(e) => { e.stopPropagation(); if (isPlanLocked) onUpgrade(); }}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            display: "flex",
            alignItems: "center",
            gap: 4,
            backgroundColor: isPlanLocked ? "rgba(212,168,83,0.15)" : "rgba(30,45,61,0.06)",
            border: isPlanLocked ? "1px solid rgba(212,168,83,0.35)" : "none",
            borderRadius: 99,
            padding: "5px 11px",
            cursor: isPlanLocked ? "pointer" : "default",
            transition: "background 150ms ease",
          }}
          onMouseEnter={(e) => { if (isPlanLocked) e.currentTarget.style.backgroundColor = "rgba(212,168,83,0.25)"; }}
          onMouseLeave={(e) => { if (isPlanLocked) e.currentTarget.style.backgroundColor = "rgba(212,168,83,0.15)"; }}
        >
          <Lock size={10} color={isPlanLocked ? "#C17B4A" : "rgba(30,45,61,0.3)"} strokeWidth={2.5} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: isPlanLocked ? "#C17B4A" : "rgba(30,45,61,0.35)",
              fontFamily: "'Inter', system-ui, sans-serif",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {isPlanLocked ? "Upgrade ↑" : "Locked"}
          </span>
        </button>
      )}

      {/* Unit header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <div>
          <p className="gf-label" style={{ marginBottom: 6 }}>
            Unit {unitIdx + 1}
          </p>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 24,
              fontWeight: 700,
              color: "#1E2D3D",
              lineHeight: 1.2,
              letterSpacing: "-0.01em",
            }}
          >
            {unit.name}
          </h2>
        </div>
        <span
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 13,
            fontWeight: 500,
            color: "#1E2D3D",
            opacity: 0.4,
            whiteSpace: "nowrap",
            paddingTop: 4,
          }}
        >
          {completedCount} / {stages.length} stages
        </span>
      </div>

      {/* Progress bar */}
      <div className="gf-progress-track" style={{ marginBottom: 20 }}>
        <div
          className="gf-progress-fill"
          style={{
            width: stages.length > 0 ? `${(completedCount / stages.length) * 100}%` : "0%",
          }}
        />
      </div>

      {/* Stage circles */}
      <div
        style={{
          display: "flex",
          justifyContent: stages.length <= 6 ? "space-between" : "flex-start",
          gap: stages.length > 6 ? 8 : 0,
          flexWrap: "wrap",
        }}
      >
        {stages.map((stage, stageIdx) => {
          const state = getStageState(stage, stageIdx);
          return (
            <StageCircle
              key={stage.id}
              stage={stage}
              state={state}
              onClick={() => onStageClick(stage.id, state)}
            />
          );
        })}
      </div>
      </div>{/* /gf-unit-card-inner */}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const SUBJECTS = [
  { name: "Urdu",   native: "اردو"  },
  { name: "Sindhi", native: "سنڌي" },
];

const CourseMap = () => {
  const navigate = useNavigate();
  const [activeLanguage, setActiveLanguage] = useState(
    () => localStorage.getItem("guftugu_language") || "Urdu"
  );

  const [units, setUnits] = useState<Unit[]>([]);
  const [stagesByUnit, setStagesByUnit] = useState<Record<string, Stage[]>>({});
  const [completedStageIds, setCompletedStageIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userPlan, setUserPlan] = useState<"free" | "premium">("free");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!session) { navigate("/auth"); return; }
        setUserId(session.user.id);
        const name =
          (session.user.user_metadata?.display_name as string | undefined) ??
          session.user.email?.split("@")[0] ??
          "U";
        setDisplayName(name);
        setIsAdmin(!!getAdminRole(session.user as any));
      })
      .catch(() => {
        navigate("/auth");
      });
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    loadAll(userId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, activeLanguage]);

  const loadAll = async (uid: string) => {
    setLoading(true);
    setUsingFallback(false);   // reset so a successful switch clears any previous fallback
    setUnits([]);              // clear stale data from the previous language
    setStagesByUnit({});
    try {
      const { data: langData, error: langErr } = await supabase
        .from("languages")
        .select("id")
        .ilike("name", activeLanguage)
        .maybeSingle();

      if (langErr) throw langErr;
      if (!langData) {
        setUsingFallback(true);
        return;
      }

      const { data: courseData, error: courseErr } = await supabase
        .from("courses")
        .select("id")
        .eq("language_id", langData.id)
        .order("order_index")
        .limit(1);

      if (courseErr) throw courseErr;
      if (!courseData || courseData.length === 0) {
        setUsingFallback(true);
        return;
      }

      const courseId = courseData[0].id;

      const { data: unitData, error: unitErr } = await supabase
        .from("units")
        .select("id, title, order_index")
        .eq("course_id", courseId)
        .order("order_index");

      if (unitErr) throw unitErr;
      if (!unitData || unitData.length === 0) {
        setUsingFallback(true);
        return;
      }

      const normalizedUnits: Unit[] = unitData.map((u) => ({
        id: u.id,
        name: u.title,
        order_index: u.order_index,
      }));

      const unitIds = normalizedUnits.map((u) => u.id);

      const { data: stageData, error: stageErr } = await supabase
        .from("stages")
        .select("id, name, stage_type, stage_number, order_index, unit_id")
        .in("unit_id", unitIds)
        .order("order_index");

      if (stageErr) throw stageErr;

      const grouped: Record<string, Stage[]> = {};
      for (const unit of normalizedUnits) {
        grouped[unit.id] = (stageData ?? [])
          .filter((s) => s.unit_id === unit.id)
          .sort((a, b) => a.order_index - b.order_index) as Stage[];
      }

      const { data: progressData } = await supabase
        .from("user_progress")
        .select("stage_id")
        .eq("user_id", uid)
        .eq("completed", true);

      const completed = new Set((progressData ?? []).map((p) => p.stage_id));

      const { data: xpData } = await supabase
        .from("user_xp")
        .select("total_xp")
        .eq("user_id", uid)
        .maybeSingle();

      const { data: streakData } = await supabase
        .from("user_streaks")
        .select("current_streak")
        .eq("user_id", uid)
        .maybeSingle();

      const { data: profileData } = await supabase
        .from("profiles")
        .select("plan")
        .eq("user_id", uid)
        .maybeSingle();

      setUnits(normalizedUnits);
      setStagesByUnit(grouped);
      setCompletedStageIds(completed);
      setTotalXp((xpData as any)?.total_xp ?? 0);
      setStreak((streakData as any)?.current_streak ?? 0);
      setUserPlan(((profileData as any)?.plan ?? "free") as "free" | "premium");

      // Show onboarding once for new users (no completed lessons)
      const completedCount = (progressData ?? []).length;
      if (completedCount === 0 && !localStorage.getItem("guftugu_onboarded")) {
        setShowOnboarding(true);
      }
    } catch (err) {
      console.error("CourseMap loadAll failed:", err);
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  };

  const firstAvailableStageId = (() => {
    for (const unit of units) {
      const stages = stagesByUnit[unit.id] ?? [];
      for (const stage of stages) {
        if (!completedStageIds.has(stage.id)) return stage.id;
      }
    }
    return null;
  })();

  const isUnitLocked = (unitIdx: number): boolean => {
    if (unitIdx === 0) return false;
    // Free plan: all units after the first are locked
    if (userPlan === "free") return true;
    // Premium: locked until previous unit is complete
    const prevUnit = units[unitIdx - 1];
    if (!prevUnit) return true;
    const prevStages = stagesByUnit[prevUnit.id] ?? [];
    return prevStages.length > 0 && !prevStages.every((s) => completedStageIds.has(s.id));
  };

  const handleStageClick = (stageId: string, state: StageState) => {
    if (state === "locked") return;
    navigate(`/stage/${stageId}`);
  };

  const handleLanguageSwitch = (lang: string) => {
    if (lang === activeLanguage) return;
    localStorage.setItem("guftugu_language", lang);
    setActiveLanguage(lang);
    // useEffect will re-run loadAll automatically
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF6F0" }}>

      {/* ── Top navigation bar ── */}
      <nav className="gf-nav">
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span className="gf-wordmark-script">گفتگو</span>
          <span className="gf-wordmark-latin">Guftugu</span>
        </div>

        {/* Stats + avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Streak */}
          <div className="gf-nav-stat" style={{ background: "rgba(193,123,74,0.08)" }}>
            <Flame size={14} style={{ color: "#C17B4A", flexShrink: 0 }} />
            <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, fontWeight: 700, color: "#C17B4A" }}>
              {streak}
            </span>
          </div>

          {/* XP */}
          <div className="gf-nav-stat" style={{ background: "rgba(212,168,83,0.1)" }}>
            <XpCoin size={14} />
            <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 13, fontWeight: 700, color: "#C49840" }}>
              {totalXp}
            </span>
          </div>

          {/* Upgrade pill — free users only */}
          {userPlan === "free" && !loading && (
            <button
              onClick={() => setShowUpgrade(true)}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "linear-gradient(135deg, #D4A853 0%, #C17B4A 100%)",
                border: "none", borderRadius: 999, padding: "6px 12px",
                cursor: "pointer", color: "#FFFFFF",
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 12, fontWeight: 700,
                boxShadow: "0 2px 10px rgba(212,168,83,0.35)",
                transition: "transform 100ms ease, box-shadow 150ms ease",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.04)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(212,168,83,0.5)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 10px rgba(212,168,83,0.35)"; }}
            >
              ⭐ Upgrade
            </button>
          )}

          {/* Admin switch */}
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "white", border: "1.5px solid #E8E0D5",
                borderRadius: 999, padding: "6px 10px", cursor: "pointer",
                color: "#1E2D3D", fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 12, fontWeight: 600,
                transition: "background 150ms ease, box-shadow 150ms ease",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#FFF8E1"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.10)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "white"; e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)"; }}
              aria-label="Open admin panel"
            >
              <Shield size={13} style={{ color: "#C17B4A" }} />
              <span className="gf-nav-admin-text">Admin</span>
            </button>
          )}

          {/* Sign out */}
          <button
            onClick={handleLogout}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#1E2D3D", opacity: 0.35, padding: 6,
              display: "flex", alignItems: "center",
              borderRadius: 8,
              transition: "opacity 150ms ease, background 150ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.7"; e.currentTarget.style.background = "rgba(30,45,61,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.35"; e.currentTarget.style.background = "none"; }}
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>

          {/* Avatar — click to open profile */}
          {displayName && (
            <button onClick={() => navigate("/profile")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, borderRadius: "50%" }} aria-label="Profile">
              <UserAvatar name={displayName} />
            </button>
          )}
        </div>
      </nav>

      {/* ── Page content ── */}
      <div className="animate-page-entry gf-course-page-content">

        {/* Page heading */}
        <div className="animate-slide-up delay-50" style={{ marginBottom: 32 }}>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(28px, 8vw, 40px)",
              fontWeight: 700,
              color: "#1E2D3D",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              marginBottom: 16,
            }}
          >
            Your Journey
          </h1>

          {/* Language switcher */}
          <div style={{ display: "flex", gap: 8 }}>
            {SUBJECTS.map((subj) => {
              const isActive = activeLanguage.toLowerCase() === subj.name.toLowerCase();
              return (
                <button
                  key={subj.name}
                  onClick={() => handleLanguageSwitch(subj.name)}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "8px 16px", borderRadius: 999,
                    border: isActive
                      ? "1.5px solid #1E2D3D"
                      : "1.5px solid rgba(30,45,61,0.18)",
                    backgroundColor: isActive ? "#1E2D3D" : "transparent",
                    color: isActive ? "#FAF6F0" : "rgba(30,45,61,0.5)",
                    fontFamily: "'Inter', system-ui, sans-serif",
                    fontSize: 13, fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 150ms ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "rgba(30,45,61,0.4)";
                      e.currentTarget.style.color = "#1E2D3D";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "rgba(30,45,61,0.18)";
                      e.currentTarget.style.color = "rgba(30,45,61,0.5)";
                    }
                  }}
                >
                  <span style={{
                    fontFamily: "'Amiri', serif",
                    fontSize: 15,
                    lineHeight: 1,
                    color: isActive ? "#FAF6F0" : "rgba(30,45,61,0.45)",
                  }}>
                    {subj.native}
                  </span>
                  {subj.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Units */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="gf-card" style={{ borderRadius: 16, overflow: "hidden" }}>
                <div className="gf-unit-card-inner">
                  <div style={{ marginBottom: 14 }}>
                    <div className="gf-skeleton" style={{ width: 60, height: 10, borderRadius: 6, marginBottom: 10 }} />
                    <div className="gf-skeleton" style={{ width: `${50 + i * 20}%`, height: 22, borderRadius: 8 }} />
                  </div>
                  <div className="gf-skeleton" style={{ width: "100%", height: 6, borderRadius: 99, marginBottom: 20 }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    {[0,1,2,3,4,5].map((j) => (
                      <div key={j} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                        <div className="gf-skeleton" style={{ width: 44, height: 44, borderRadius: "50%" }} />
                        <div className="gf-skeleton" style={{ width: 36, height: 8, borderRadius: 6 }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : usingFallback ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {FALLBACK_UNITS.map((unit, unitIdx) => (
              <div
                key={unit.id}
                className="gf-card"
                style={{
                  borderRadius: 16,
                  padding: "24px",
                  opacity: unitIdx > 0 ? 0.6 : 1,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <p className="gf-label" style={{ marginBottom: 6 }}>
                      Unit {unitIdx + 1}
                    </p>
                    <h2
                      style={{
                        fontFamily: "'Playfair Display', Georgia, serif",
                        fontSize: 24,
                        fontWeight: 700,
                        color: "#1E2D3D",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {unit.name}
                    </h2>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontFamily: "'Inter', system-ui, sans-serif",
                      fontWeight: 500,
                      color: "#1E2D3D",
                      opacity: 0.4,
                      paddingTop: 4,
                    }}
                  >
                    0 / {FALLBACK_STAGE_DEFS.length} stages
                  </span>
                </div>
                <div className="gf-progress-track" style={{ marginBottom: 20 }}>
                  <div className="gf-progress-fill" style={{ width: "0%" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  {FALLBACK_STAGE_DEFS.map((stageDef, stageIdx) => {
                    const state: StageState =
                      unitIdx === 0 && stageIdx === 0 ? "current" : "locked";
                    return (
                      <StageCircle
                        key={stageIdx}
                        stage={stageDef}
                        state={state}
                        onClick={() => {}}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {units.map((unit, unitIdx) => {
              const stages = stagesByUnit[unit.id] ?? [];
              const locked = isUnitLocked(unitIdx);
              const planLocked = unitIdx > 0 && userPlan === "free";
              return (
                <div
                  key={unit.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${100 + unitIdx * 80}ms` }}
                >
                  <UnitCard
                    unit={unit}
                    unitIdx={unitIdx}
                    stages={stages}
                    completedStageIds={completedStageIds}
                    firstAvailableStageId={firstAvailableStageId}
                    isUnitLocked={locked}
                    isPlanLocked={planLocked}
                    onStageClick={handleStageClick}
                    onUpgrade={() => setShowUpgrade(true)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Upgrade modal ── */}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      {/* ── Onboarding overlay ── */}
      {showOnboarding && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            backgroundColor: "rgba(30,45,61,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              backgroundColor: "#FAF6F0", borderRadius: 24, padding: "40px 32px",
              maxWidth: 380, width: "100%", textAlign: "center",
              boxShadow: "0 24px 64px rgba(30,45,61,0.25)",
            }}
          >
            {/* Step indicator */}
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 28 }}>
              {[0, 1, 2].map((s) => (
                <div key={s} style={{
                  width: s === onboardStep ? 20 : 6, height: 6, borderRadius: 99,
                  backgroundColor: s === onboardStep ? "#D4A853" : "rgba(30,45,61,0.15)",
                  transition: "width 250ms ease, background 250ms ease",
                }} />
              ))}
            </div>

            {/* Content per step */}
            {onboardStep === 0 && (
              <>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🌙</div>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: "#1E2D3D", marginBottom: 12, letterSpacing: "-0.02em" }}>
                  Welcome to Guftugu
                </h2>
                <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 15, color: "rgba(30,45,61,0.6)", lineHeight: 1.65, marginBottom: 0 }}>
                  Learn Urdu through short, interactive lessons designed for complete beginners.
                </p>
              </>
            )}
            {onboardStep === 1 && (
              <>
                <div style={{ fontSize: 48, marginBottom: 16 }}>⭐</div>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: "#1E2D3D", marginBottom: 12, letterSpacing: "-0.02em" }}>
                  Earn XP as you go
                </h2>
                <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 15, color: "rgba(30,45,61,0.6)", lineHeight: 1.65, marginBottom: 0 }}>
                  Each stage you complete earns XP. Keep a daily streak going to build momentum.
                </p>
              </>
            )}
            {onboardStep === 2 && (
              <>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 24, fontWeight: 700, color: "#1E2D3D", marginBottom: 12, letterSpacing: "-0.02em" }}>
                  You're all set!
                </h2>
                <p style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 15, color: "rgba(30,45,61,0.6)", lineHeight: 1.65, marginBottom: 0 }}>
                  Start with your first stage — tap any circle to begin. Good luck!
                </p>
              </>
            )}

            {/* CTA */}
            <button
              onClick={() => {
                if (onboardStep < 2) {
                  setOnboardStep(onboardStep + 1);
                } else {
                  setShowOnboarding(false);
                  localStorage.setItem("guftugu_onboarded", "1");
                }
              }}
              style={{
                marginTop: 28, width: "100%", padding: "15px",
                borderRadius: 14, border: "none",
                backgroundColor: "#1E2D3D", color: "#FAF6F0",
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 16, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 16px rgba(30,45,61,0.2)",
                transition: "transform 80ms ease",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {onboardStep < 2 ? "Next →" : "Start learning →"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default CourseMap;
