import { useState } from "react";
import type { FeedbackState } from "./questions/shared";
import { TraceLetter } from "./questions/TraceLetter";
import { FindLetter } from "./questions/FindLetter";
import { AudioPlay } from "./questions/AudioPlay";
import { Conversation } from "./questions/Conversation";
import { FillBlank } from "./questions/FillBlank";
import { BuildWord } from "./questions/BuildWord";
import { ImageMatch } from "./questions/ImageMatch";
import { Dialogue } from "./questions/Dialogue";
import { Reading } from "./questions/Reading";

interface Question {
  id: string;
  type: string;
  content: Record<string, any>;
}

interface QuestionShellProps {
  questions: Question[];
  currentIdx: number;
  onCorrect: () => void;
  onWrong: () => void;
  /** Called after a correct answer — advance to next question */
  onContinue: () => void;
  onQuit: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  trace_letter: "Aghaaz",
  find_letter: "Aghaaz",
  audio_play: "Suno",
  conversation: "Samjho",
  fill_blank: "Samjho",
  build_word: "Samjho",
  image_match: "Pehchano",
  dialogue: "Guftugu",
  reading: "Guftugu",
};

function QuestionRenderer({
  question,
  onAnswer,
  feedback,
}: {
  question: Question;
  onAnswer: (correct: boolean) => void;
  feedback: FeedbackState;
}) {
  const props = { content: question.content, onAnswer, feedback };
  switch (question.type) {
    case "trace_letter":
      return <TraceLetter {...props} />;
    case "find_letter":
      return <FindLetter {...props} />;
    case "audio_play":
      return <AudioPlay {...props} />;
    case "conversation":
      return <Conversation {...props} />;
    case "fill_blank":
      return <FillBlank {...props} />;
    case "build_word":
      return <BuildWord {...props} />;
    case "image_match":
      return <ImageMatch {...props} />;
    case "dialogue":
      return <Dialogue {...props} />;
    case "reading":
      return <Reading {...props} />;
    default:
      return (
        <div className="text-center" style={{ color: "#1E2D3D", opacity: 0.5 }}>
          Unknown question type: {question.type}
        </div>
      );
  }
}

export function QuestionShell({
  questions,
  currentIdx,
  onCorrect,
  onWrong,
  onContinue,
  onQuit,
}: QuestionShellProps) {
  const [feedback, setFeedback] = useState<FeedbackState>("idle");
  const [retryCount, setRetryCount] = useState(0);

  const question = questions[currentIdx];
  const progress = (currentIdx / questions.length) * 100;
  const label = TYPE_LABELS[question?.type ?? ""] ?? "";

  const handleAnswer = (correct: boolean) => {
    setFeedback(correct ? "correct" : "wrong");
    if (correct) onCorrect();
    else onWrong();
  };

  const handleContinue = () => {
    setFeedback("idle");
    onContinue();
  };

  const handleRetry = () => {
    setFeedback("idle");
    setRetryCount((r) => r + 1);
  };

  if (!question) return null;

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: "#FAF6F0" }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          backgroundColor: "#FAF6F0",
          borderBottom: "1px solid rgba(30,45,61,0.08)",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Quit / back button */}
        <button
          onClick={onQuit}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 6,
            color: "#1E2D3D",
            opacity: 0.4,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            transition: "opacity 150ms ease, background 150ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8"; e.currentTarget.style.background = "rgba(30,45,61,0.06)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = "0.4"; e.currentTarget.style.background = "none"; }}
          aria-label="Quit"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Progress bar */}
        <div className="gf-progress-track" style={{ flex: 1 }}>
          <div
            className="gf-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Stage label + counter */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          {label && (
            <span
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#6BA3C8",
              }}
            >
              {label}
            </span>
          )}
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: "#1E2D3D",
              opacity: 0.45,
              minWidth: 36,
              textAlign: "right",
            }}
          >
            {currentIdx + 1}/{questions.length}
          </span>
        </div>
      </div>

      {/* ── Question content — remounts with key so animation re-fires each question ── */}
      <div
        key={`${question.id}-${retryCount}`}
        className="animate-question-enter gf-question-content"
      >
        <QuestionRenderer
          question={question}
          onAnswer={handleAnswer}
          feedback={feedback}
        />
      </div>

      {/* ── Feedback panel ── */}
      {feedback !== "idle" && (
        <div
          className="animate-feedback-slide"
          style={{
            position: "sticky",
            bottom: 0,
            backgroundColor: feedback === "correct" ? "#D4A853" : "#C17B4A",
            padding: "20px 24px",
            paddingBottom: "max(36px, env(safe-area-inset-bottom, 36px))",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
          }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                className={feedback === "correct" ? "animate-correct-pulse" : "animate-wrong-shake"}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.28)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {feedback === "correct" ? "✓" : "✗"}
              </div>
              <div>
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: 18,
                    color: "#FFFFFF",
                    lineHeight: 1.2,
                    fontFamily: "'Playfair Display', Georgia, serif",
                  }}
                >
                  {feedback === "correct" ? "Sahi! صحیح" : "Oops! غلط"}
                </p>
                {feedback === "wrong" && question.content.correct_letter && (
                  <p
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.85)",
                      marginTop: 3,
                      fontFamily: "'Inter', system-ui, sans-serif",
                    }}
                  >
                    Correct: {question.content.correct_letter}
                  </p>
                )}
                {feedback === "wrong" && question.content.correct_word && (
                  <p
                    style={{
                      fontSize: 15,
                      color: "rgba(255,255,255,0.9)",
                      marginTop: 3,
                      fontFamily: "'Amiri', serif",
                      direction: "rtl",
                    }}
                  >
                    Correct: {question.content.correct_word}
                  </p>
                )}
              </div>
            </div>

            {/* Continue / Try again */}
            <button
              onClick={feedback === "correct" ? handleContinue : handleRetry}
              style={{
                width: "100%",
                height: 56,
                borderRadius: 12,
                backgroundColor: "#FFFFFF",
                color: feedback === "correct" ? "#D4A853" : "#C17B4A",
                border: "none",
                fontWeight: 700,
                fontSize: 16,
                cursor: "pointer",
                fontFamily: "'Playfair Display', Georgia, serif",
                letterSpacing: "-0.01em",
                transition: "transform 80ms ease",
              }}
              onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {feedback === "correct" ? "Continue →" : "Try Again"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
