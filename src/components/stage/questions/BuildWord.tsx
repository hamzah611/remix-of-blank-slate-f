import { useState } from "react";
import type { QuestionProps } from "./shared";

export function BuildWord({ content, onAnswer, feedback }: QuestionProps) {
  const { scrambled_letters = [], word: targetWord, hint } = content;

  // Store SOURCE INDEX in each slot (not the letter value) so duplicate
  // letters are tracked correctly — e.g. ببا has two ب, each is a distinct slot.
  const [slotSrcIdxs, setSlotSrcIdxs] = useState<(number | null)[]>(
    Array(targetWord?.length ?? scrambled_letters.length).fill(null)
  );
  const [available, setAvailable] = useState<boolean[]>(
    scrambled_letters.map(() => true)
  );

  const disabled = feedback !== "idle";

  const handleLetterClick = (srcIdx: number) => {
    if (disabled || !available[srcIdx]) return;
    const firstEmpty = slotSrcIdxs.findIndex((s) => s === null);
    if (firstEmpty === -1) return;
    const newSlots = [...slotSrcIdxs];
    newSlots[firstEmpty] = srcIdx;
    setSlotSrcIdxs(newSlots);
    const newAvail = [...available];
    newAvail[srcIdx] = false;
    setAvailable(newAvail);
  };

  const handleSlotClick = (slotIdx: number) => {
    if (disabled || slotSrcIdxs[slotIdx] === null) return;
    const srcIdx = slotSrcIdxs[slotIdx]!;
    const newSlots = [...slotSrcIdxs];
    newSlots[slotIdx] = null;
    setSlotSrcIdxs(newSlots);
    const newAvail = [...available];
    newAvail[srcIdx] = true;
    setAvailable(newAvail);
  };

  const handleClear = () => {
    setSlotSrcIdxs(Array(slotSrcIdxs.length).fill(null));
    setAvailable(scrambled_letters.map(() => true));
  };

  const handleCheck = () => {
    if (disabled) return;
    if (slotSrcIdxs.some((s) => s === null)) return;
    const assembled = slotSrcIdxs.map((i) => scrambled_letters[i!]).join("");
    onAnswer(assembled === targetWord);
  };

  const allFilled = slotSrcIdxs.every((s) => s !== null);
  const anyFilled = slotSrcIdxs.some((s) => s !== null);

  return (
    <div className="flex flex-col items-center gap-6">
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "#1E2D3D", opacity: 0.45 }}
      >
        Build the word
      </p>

      {hint && (
        <p style={{ color: "#1E2D3D", opacity: 0.6, fontSize: 14 }}>{hint}</p>
      )}

      {/* Answer slots */}
      <div className="flex gap-2 flex-row-reverse flex-wrap justify-center">
        {slotSrcIdxs.map((srcIdx, i) => {
          const letter = srcIdx !== null ? scrambled_letters[srcIdx] : null;
          return (
            <button
              key={i}
              onClick={() => handleSlotClick(i)}
              disabled={disabled}
              style={{
                width: 48,
                height: 56,
                borderRadius: 12,
                border: letter
                  ? `2px solid ${feedback === "correct" ? "#D4A853" : feedback === "wrong" ? "#C17B4A" : "#D4A853"}`
                  : "2px dashed #C8BDB0",
                backgroundColor: letter
                  ? feedback === "correct"
                    ? "#D4A853"
                    : feedback === "wrong"
                    ? "#C17B4A"
                    : "#FFF8EC"
                  : "transparent",
                color: feedback !== "idle" && letter ? "#FFFFFF" : "#1E2D3D",
                fontFamily: "'Amiri', serif",
                fontSize: 22,
                cursor: letter && !disabled ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s",
              }}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Available letters */}
      <div className="flex gap-2 flex-row-reverse flex-wrap justify-center">
        {scrambled_letters.map((letter: string, i: number) => (
          <button
            key={i}
            onClick={() => handleLetterClick(i)}
            disabled={disabled || !available[i]}
            style={{
              width: 48,
              height: 56,
              borderRadius: 12,
              border: "2px solid #E8E0D5",
              backgroundColor: available[i] ? "#FFFFFF" : "#F0EBE3",
              color: available[i] ? "#1E2D3D" : "transparent",
              fontFamily: "'Amiri', serif",
              fontSize: 22,
              cursor: available[i] && !disabled ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            {letter}
          </button>
        ))}
      </div>

      {/* Action row */}
      <div style={{ display: "flex", gap: 10, width: "100%" }}>
        {/* Clear button — only shown when slots have letters */}
        {anyFilled && !disabled && (
          <button
            onClick={handleClear}
            style={{
              padding: "14px 20px",
              borderRadius: 16,
              backgroundColor: "transparent",
              color: "#C17B4A",
              border: "1.5px solid rgba(193,123,74,0.3)",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              flexShrink: 0,
              transition: "background 150ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(193,123,74,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Clear
          </button>
        )}

        {/* Check button */}
        <button
          onClick={handleCheck}
          disabled={!allFilled || disabled}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: 16,
            backgroundColor: allFilled && !disabled ? "#1E2D3D" : "#E8E0D5",
            color: allFilled && !disabled ? "#FAF6F0" : "#1E2D3D",
            border: "none",
            fontWeight: 600,
            fontSize: 15,
            cursor: allFilled && !disabled ? "pointer" : "default",
            transition: "background-color 0.15s",
            opacity: allFilled ? 1 : 0.5,
          }}
        >
          Check
        </button>
      </div>
    </div>
  );
}
