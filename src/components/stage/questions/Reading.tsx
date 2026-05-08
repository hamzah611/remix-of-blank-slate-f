import { useState } from "react";
import { OptionButton, type QuestionProps } from "./shared";

export function Reading({ content, onAnswer, feedback }: QuestionProps) {
  const { passage, question, correct_answer, options = [] } = content ?? {};

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
        Read and answer
      </p>

      {/* Passage */}
      <div
        style={{
          backgroundColor: "#FAF6F0",
          border: "2px solid #E8E0D5",
          borderRadius: 16,
          padding: "18px 20px",
          fontFamily: "'Amiri', serif",
          fontSize: 20,
          direction: "rtl",
          textAlign: "right",
          color: "#1E2D3D",
          lineHeight: 2,
        }}
      >
        {passage}
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
