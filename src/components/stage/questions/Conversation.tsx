import { useState } from "react";
import { OptionButton, type QuestionProps } from "./shared";

export function Conversation({ content, onAnswer, feedback }: QuestionProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const { prompt, correct_index, options = [] } = content ?? {};

  const handlePick = (idx: number) => {
    if (feedback !== "idle") return;
    setSelected(idx);
    onAnswer(idx === correct_index);
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
      {(!options || options.length === 0) && (
        <p style={{ color: "rgba(30,45,61,0.4)", fontSize: 14, fontFamily: "'Inter', system-ui, sans-serif", textAlign: "center" }}>
          No options available for this question.
        </p>
      )}
      <div className="flex flex-col gap-3 mt-2">
        {(options ?? []).map((opt: { text: string }, idx: number) => (
          <OptionButton
            key={idx}
            label={opt.text}
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
