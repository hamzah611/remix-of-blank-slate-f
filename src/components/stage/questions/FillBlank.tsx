import { useState } from "react";
import { OptionButton, type QuestionProps } from "./shared";

export function FillBlank({ content, onAnswer, feedback }: QuestionProps) {
  const [selected, setSelected] = useState<string | null>(null);

  // sentence: string with "___" placeholder, e.g. "میں ___ ہوں"
  // correct_answer: string
  // options: string[] — wrong words
  const { sentence, correct_answer, options = [] } = content ?? {};

  const [allOptions] = useState<string[]>(() => {
    const arr = [correct_answer, ...options.slice(0, 3)].filter(Boolean);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  });

  // Split on ALL ___ occurrences so sentences with multiple blanks render correctly
  const displayParts: string[] = (sentence ?? "").split("___");

  const handlePick = (word: string) => {
    if (feedback !== "idle") return;
    setSelected(word);
    onAnswer(word === correct_answer);
  };

  return (
    <div className="flex flex-col gap-5">
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "#1E2D3D", opacity: 0.45 }}
      >
        Fill in the blank
      </p>

      {/* Sentence display — handles any number of ___ blanks */}
      <div
        style={{
          backgroundColor: "#FAF6F0",
          border: "2px solid #E8E0D5",
          borderRadius: 16,
          padding: "16px 20px",
          textAlign: "center",
          direction: "rtl",
          fontFamily: "'Amiri', serif",
          fontSize: 24,
          color: "#1E2D3D",
          lineHeight: 2,
        }}
      >
        {displayParts.map((part, i) => (
          <span key={i}>
            {part}
            {i < displayParts.length - 1 && (
              <span
                style={{
                  display: "inline-block",
                  minWidth: 80,
                  borderBottom: selected ? "2px solid #D4A853" : "2px dashed #C8BDB0",
                  color: selected ? "#D4A853" : "transparent",
                  fontWeight: 700,
                  margin: "0 4px",
                  paddingBottom: 2,
                  verticalAlign: "bottom",
                }}
              >
                {selected || "    "}
              </span>
            )}
          </span>
        ))}
      </div>

      {/* Word options */}
      <div className="grid grid-cols-2 gap-3">
        {allOptions.map((word) => (
          <OptionButton
            key={word}
            label={word}
            isSelected={selected === word}
            feedback={selected === word ? feedback : "idle"}
            onClick={() => handlePick(word)}
            urdu
          />
        ))}
      </div>
    </div>
  );
}
