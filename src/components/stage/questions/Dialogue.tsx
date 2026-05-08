import { useState } from "react";
import { OptionButton, type QuestionProps } from "./shared";

interface DialogueLine {
  speaker: string;
  line: string; // admin saves as "line", not "text"
}

export function Dialogue({ content, onAnswer, feedback }: QuestionProps) {
  // Admin saves field as "dialogue" (not "lines"), each entry has {speaker, line}
  const { dialogue: lines = [], question, correct_answer, options = [] } = content ?? {};

  // Shuffle correct_answer in with wrong options once on mount
  const [allOptions] = useState<string[]>(() => {
    const arr: string[] = [correct_answer, ...(options as string[])].filter(Boolean);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  const [selected, setSelected] = useState<string | null>(null);

  const handlePick = (opt: string) => {
    if (feedback !== "idle") return;
    setSelected(opt);
    onAnswer(opt === correct_answer);
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
        {(lines as DialogueLine[]).map((entry, i) => {
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
                {entry.speaker}
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
                {entry.line}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comprehension question */}
      <p
        style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 15,
          fontWeight: 600,
          color: "#1E2D3D",
          lineHeight: 1.5,
        }}
      >
        {question}
      </p>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {allOptions.map((opt) => (
          <OptionButton
            key={opt}
            label={opt}
            isSelected={selected === opt}
            feedback={selected === opt ? feedback : "idle"}
            onClick={() => handlePick(opt)}
            urdu
          />
        ))}
      </div>
    </div>
  );
}
