import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { QuestionShell } from "@/components/stage/QuestionShell";
import { CompletionScreen } from "@/components/stage/CompletionScreen";

interface StageInfo {
  id: string;
  name: string;
  stage_type: string;
  stage_number: number;
}

interface Question {
  id: string;
  type: string;
  content: Record<string, any>;
  order_index: number;
}

const XP_PER_STAGE = 20;

function DohraoBanner({ stageName, onContinue }: { stageName: string; onContinue: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen"
      style={{ backgroundColor: "#FAF6F0", padding: "40px 24px", textAlign: "center" }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-4"
        style={{ color: "#1E2D3D", opacity: 0.45 }}
      >
        Dohrao — دوہراؤ
      </p>
      <h1
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 30,
          fontWeight: 700,
          color: "#1E2D3D",
          marginBottom: 16,
        }}
      >
        {stageName}
      </h1>
      <p style={{ color: "#1E2D3D", opacity: 0.6, fontSize: 15, lineHeight: 1.7, maxWidth: 320, marginBottom: 40 }}>
        This is your review stage. Go back and revisit what you've learned in this unit before continuing.
      </p>
      <button
        onClick={onContinue}
        style={{
          width: "100%",
          maxWidth: 320,
          padding: "16px",
          borderRadius: 16,
          backgroundColor: "#6BA3C8",
          color: "#FFFFFF",
          border: "none",
          fontWeight: 700,
          fontSize: 16,
          cursor: "pointer",
        }}
      >
        Got it →
      </button>
    </div>
  );
}

export default function Stage() {
  const { stageId } = useParams<{ stageId: string }>();
  const navigate = useNavigate();

  const [stage, setStage] = useState<StageInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [progressSaved, setProgressSaved] = useState(false);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);
    });
  }, [navigate]);

  useEffect(() => {
    if (!userId || !stageId) return;
    let cancelled = false;
    supabase
      .from("user_sessions" as never)
      .insert({ user_id: userId, stage_id: stageId } as never)
      .select("id")
      .single()
      .then(({ data }) => {
        if (!cancelled && data) sessionIdRef.current = (data as { id: string }).id;
      });
    return () => {
      cancelled = true;
      const sid = sessionIdRef.current;
      if (sid) {
        supabase
          .from("user_sessions" as never)
          .update({ ended_at: new Date().toISOString() } as never)
          .eq("id", sid)
          .then(() => {});
      }
    };
  }, [userId, stageId]);

  useEffect(() => {
    if (!stageId) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      const { data: stageData, error: stageErr } = await supabase
        .from("stages")
        .select("id, name, stage_type, stage_number")
        .eq("id", stageId)
        .single();

      if (stageErr || !stageData) {
        setError("Stage not found.");
        setLoading(false);
        return;
      }

      setStage(stageData as StageInfo);

      if (stageData.stage_type === "dohrao") {
        setLoading(false);
        return;
      }

      const { data: qData, error: qErr } = await supabase
        .from("questions")
        .select("id, type, content, order_index")
        // .eq("status", "published")  // Uncomment after running the SQL migration
        .eq("stage_id", stageId)
        .order("order_index");

      if (qErr) {
        setError("Failed to load questions.");
        setLoading(false);
        return;
      }

      setQuestions((qData ?? []) as Question[]);
      setLoading(false);
    };

    load();
  }, [stageId]);

  const saveProgress = async (finalCorrect: number, finalWrong: number) => {
    if (progressSaved || !userId || !stageId) return;
    setProgressSaved(true);

    const total = finalCorrect + finalWrong;
    const accuracy = total > 0 ? finalCorrect / total : 1;
    const xp = Math.round(XP_PER_STAGE * Math.max(0.5, accuracy));

    try {
      await supabase.from("user_progress").upsert(
        {
          user_id: userId,
          stage_id: stageId,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,stage_id" }
      );

      const { data: xpRow } = await supabase
        .from("user_xp")
        .select("total_xp")
        .eq("user_id", userId)
        .single();

      const currentXp = (xpRow as any)?.total_xp ?? 0;

      await supabase.from("user_xp").upsert(
        { user_id: userId, total_xp: currentXp + xp },
        { onConflict: "user_id" }
      );
    } catch {
      // Non-blocking
    }
  };

  const handleCorrect = () => setCorrectCount((c) => c + 1);
  const handleWrong = () => setWrongCount((w) => w + 1);

  const handleContinue = () => {
    const next = currentIdx + 1;
    if (next >= questions.length) {
      // correctCount / wrongCount are up-to-date here because the component
      // re-rendered after the answer (feedback state changed), so the closure
      // captures the latest values.
      saveProgress(correctCount, wrongCount);
      setCompleted(true);
    } else {
      setCurrentIdx(next);
    }
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: "#FAF6F0" }}
      >
        <div style={{ textAlign: "center", color: "#1E2D3D", opacity: 0.5 }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid #E8E0D5",
              borderTop: "3px solid #D4A853",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ fontSize: 14 }}>Loading stage…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-4"
        style={{ backgroundColor: "#FAF6F0", padding: 24 }}
      >
        <p style={{ color: "#C17B4A", fontSize: 16 }}>{error}</p>
        <button
          onClick={() => navigate("/course-map")}
          style={{
            padding: "12px 24px",
            borderRadius: 12,
            backgroundColor: "#1E2D3D",
            color: "#FAF6F0",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Back to Course Map
        </button>
      </div>
    );
  }

  if (!stage) return null;

  if (stage.stage_type === "dohrao") {
    return (
      <DohraoBanner
        stageName={stage.name}
        onContinue={() => navigate("/course-map")}
      />
    );
  }

  if (questions.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-4"
        style={{ backgroundColor: "#FAF6F0", padding: 24, textAlign: "center" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "#1E2D3D", opacity: 0.45 }}
        >
          {stage.name}
        </p>
        <p style={{ color: "#1E2D3D", opacity: 0.6, fontSize: 15 }}>
          No questions yet — check back soon!
        </p>
        <button
          onClick={() => navigate("/course-map")}
          style={{
            padding: "12px 24px",
            borderRadius: 12,
            backgroundColor: "#1E2D3D",
            color: "#FAF6F0",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Back to Course Map
        </button>
      </div>
    );
  }

  if (completed) {
    const total = correctCount + wrongCount;
    const accuracy = total > 0 ? correctCount / total : 1;
    const xp = Math.round(XP_PER_STAGE * Math.max(0.5, accuracy));
    return (
      <CompletionScreen
        stageName={stage.name}
        xpEarned={xp}
        accuracy={accuracy}
        onContinue={() => navigate("/course-map")}
      />
    );
  }

  return (
    <QuestionShell
      questions={questions}
      currentIdx={currentIdx}
      onCorrect={handleCorrect}
      onWrong={handleWrong}
      onContinue={handleContinue}
      onQuit={() => navigate("/course-map")}
    />
  );
}
