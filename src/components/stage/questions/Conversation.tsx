import { useState } from "react";
import { OptionButton, type QuestionProps } from "./shared";

export function Conversation({ content, onAnswer, feedback }: QuestionProps) {
  const { prompt, correct_answer, options = [] } = content ?? {};

  // Shuffle correct_answer in with wrong options once on mount
  const [allOptions] = useState<string[]>(() => {
    const arr: string[] = [correct_answer, ...(options as string[])].filter(Boolean);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  // Track selected by value (not index) — correct_answer is a string
  const [selected, setSelected] = useState<string | null>(null);

  const handlePick = (opt: string) => {
    if (feedback !== "idle") return;
    setSelected(opt);
    onAnswer(opt === correct_answer);
  };

  return (
    <div className="flex flex-col gap-5">
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "#1E2D3D", opacity: 0.45 }}
      >
        Choose the correct response
      </p>

      {/* Prompt bubble */}
      <div
        style={{
          backgroundColor: "#FAF6F0",
          border: "2px solid #E8E0D5",
          borderRadius: 16,
          borderTopLeftRadius: 4,
          padding: "14px 18px",
          fontFamily: "'Amiri', serif",
          fontSize: 22,
          direction: "rtl",
          color: "#1E2D3D",
          lineHeight: 1.7,
          alignSelf: "flex-start",
          maxWidth: "85%",
        }}
      >
        {prompt}
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3 mt-2">
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
