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

function UnitCard({
  unit,
  unitIdx,
  stages,
  completedStageIds,
  firstAvailableStageId,
  isUnitLocked,
  onStageClick,
}: {
  unit: Unit;
  unitIdx: number;
  stages: Stage[];
  completedStageIds: Set<string>;
  firstAvailableStageId: string | null;
  isUnitLocked: boolean;
  onStageClick: (stageId: string, state: StageState) => void;
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
      style={{
        borderRadius: 16,
        padding: "24px",
        opacity: isUnitLocked ? 0.6 : 1,
        transition: "opacity 200ms ease",
        position: "relative",
      }}
    >
      {/* Lock badge */}
      {isUnitLocked && (
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            display: "flex",
            alignItems: "center",
            gap: 4,
            backgroundColor: "rgba(30,45,61,0.06)",
            borderRadius: 99,
            padding: "4px 10px",
          }}
        >
          <Lock size={10} color="rgba(30,45,61,0.3)" strokeWidth={2.5} />
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "rgba(30,45,61,0.35)",
              fontFamily: "'Inter', system-ui, sans-serif",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Locked
          </span>
        </div>
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
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const CourseMap = () => {
  const navigate = useNavigate();
  const language = localStorage.getItem("guftugu_language") || "Urdu";

  const [units, setUnits] = useState<Unit[]>([]);
  const [stagesByUnit, setStagesByUnit] = useState<Record<string, Stage[]>>({});
  const [completedStageIds, setCompletedStageIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

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
      })
      .catch(() => {
        navigate("/auth");
      });
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    loadAll(userId);
  }, [userId]);

  const loadAll = async (uid: string) => {
    setLoading(true);
    try {
      const { data: langData, error: langErr } = await supabase
        .from("languages")
        .select("id")
        .ilike("name", language)
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

      setUnits(normalizedUnits);
      setStagesByUnit(grouped);
      setCompletedStageIds(completed);
      setTotalXp((xpData as any)?.total_xp ?? 0);
      setStreak((streakData as any)?.current_streak ?? 0);
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
    const prevUnit = units[unitIdx - 1];
    if (!prevUnit) return true;
    const prevStages = stagesByUnit[prevUnit.id] ?? [];
    return prevStages.length > 0 && !prevStages.every((s) => completedStageIds.has(s.id));
  };

  const handleStageClick = (stageId: string, state: StageState) => {
    if (state === "locked") return;
    navigate(`/stage/${stageId}`);
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
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Streak */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Flame size={16} style={{ color: "#C17B4A" }} />
            <span
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: "#1E2D3D",
              }}
            >
              {streak}
            </span>
          </div>

          {/* XP */}
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <XpCoin size={17} />
            <span
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: "#D4A853",
              }}
            >
              {totalXp}
            </span>
          </div>

          {/* Sign out */}
          <button
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#1E2D3D",
              opacity: 0.35,
              padding: 4,
              display: "flex",
              alignItems: "center",
              transition: "opacity 150ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.35")}
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>

          {/* Avatar */}
          {displayName && <UserAvatar name={displayName} />}
        </div>
      </nav>

      {/* ── Page content ── */}
      <div
        className="animate-page-entry"
        style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}
      >

        {/* Page heading */}
        <div style={{ marginBottom: 32 }}>
          <p className="gf-label" style={{ marginBottom: 8 }}>
            {language}
          </p>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 40,
              fontWeight: 700,
              color: "#1E2D3D",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
            }}
          >
            Your Journey
          </h1>
        </div>

        {/* Units */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "64px 0" }}>
            <div
              className="animate-spin"
              style={{
                width: 36,
                height: 36,
                border: "3px solid rgba(30,45,61,0.08)",
                borderTop: "3px solid #D4A853",
                borderRadius: "50%",
              }}
            />
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
              return (
                <UnitCard
                  key={unit.id}
                  unit={unit}
                  unitIdx={unitIdx}
                  stages={stages}
                  completedStageIds={completedStageIds}
                  firstAvailableStageId={firstAvailableStageId}
                  isUnitLocked={isUnitLocked(unitIdx)}
                  onStageClick={handleStageClick}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseMap;
