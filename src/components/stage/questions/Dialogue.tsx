import { useState } from "react";
import { OptionButton, type QuestionProps } from "./shared";

interface DialogueLine {
  speaker: string;
  text: string;
}

export function Dialogue({ content, onAnswer, feedback }: QuestionProps) {
  const [selected, setSelected] = useState<number | null>(null);

  // lines: DialogueLine[] — the conversation transcript
  // question: string — what to answer about the dialogue
  // correct_index: number
  // options: string[]
  const { lines = [], question, correct_index, options = [] } = content ?? {};

  const handlePick = (idx: number) => {
    if (feedback !== "idle") return;
    setSelected(idx);
    onAnswer(idx === correct_index);
  };

  return (
    <div className="flex flex-col gap-4">
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "#1E2D3D", opacity: 0.45 }}
      >
        Read the conversation
      </p>

      {/* Dialogue transcript */}
      <div
        style={{
          backgroundColor: "#FAF6F0",
          border: "2px solid #E8E0D5",
          borderRadius: 16,
          padding: "14px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {lines.map((line: DialogueLine, i: number) => {
          const isLeft = i % 2 === 0;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isLeft ? "flex-end" : "flex-start",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#1E2D3D",
                  opacity: 0.45,
                  marginBottom: 3,
                }}
              >
                {line.speaker}
              </span>
              <div
                style={{
                  backgroundColor: isLeft ? "#1E2D3D" : "#FFFFFF",
                  color: isLeft ? "#FAF6F0" : "#1E2D3D",
                  border: isLeft ? "none" : "2px solid #E8E0D5",
                  borderRadius: 14,
                  borderTopRightRadius: isLeft ? 4 : 14,
                  borderTopLeftRadius: isLeft ? 14 : 4,
                  padding: "10px 14px",
                  fontFamily: "'Amiri', serif",
                  fontSize: 20,
                  direction: "rtl",
                  lineHeight: 1.6,
                  maxWidth: "80%",
                }}
              >
                {line.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Question */}
      <p
        style={{
          fontFamily: "'Amiri', serif",
          fontSize: 20,
          color: "#1E2D3D",
          direction: "rtl",
          textAlign: "right",
          lineHeight: 1.6,
        }}
      >
        {question}
      </p>

      {/* Options */}
      {(!options || options.length === 0) && (
        <p style={{ color: "rgba(30,45,61,0.4)", fontSize: 14, fontFamily: "'Inter', system-ui, sans-serif", textAlign: "center" }}>
          No options available for this question.
        </p>
      )}
      <div className="flex flex-col gap-3">
        {(options ?? []).map((opt: string, idx: number) => (
          <OptionButton
            key={idx}
            label={opt}
            isSelected={selected === idx}
            feedback={selected === idx ? feedback : "idle"}
            onClick={() => handlePick(idx)}
            urdu
          />
        ))}
      </div>
    </div>
  );
}
