import { useState } from "react";
import { OptionButton, type QuestionProps } from "./shared";

// Content schema (as saved by buildContent in QuestionFields.tsx):
//   image_url:   string  — Supabase public URL of the image
//   correct_urdu: string — the right Urdu label
//   options:     string[] — wrong Urdu labels

export function ImageMatch({ content, onAnswer, feedback }: QuestionProps) {
  const { image_url, correct_urdu, options = [] } = content;

  // Build shuffled choices (correct + up to 3 wrong), shuffle once on mount
  const [choices] = useState<string[]>(() => {
    const all: string[] = [correct_urdu, ...options.slice(0, 3)].filter(Boolean);
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
  });

  const [selected, setSelected] = useState<number | null>(null);
  // Start in "error" immediately if there is no URL — avoids a stuck "loading" state
  const [imgState, setImgState] = useState<"loading" | "loaded" | "error">(
    image_url ? "loading" : "error"
  );

  const handlePick = (idx: number) => {
    if (feedback !== "idle") return;
    setSelected(idx);
    onAnswer(choices[idx] === correct_urdu);
  };

  return (
    <div className="flex flex-col gap-5">
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "#1E2D3D", opacity: 0.45 }}
      >
        What does this show?
      </p>

      {/* Image display */}
      <div
        style={{
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid rgba(30,45,61,0.08)",
          backgroundColor: "rgba(30,45,61,0.03)",
          minHeight: 160,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Loading skeleton */}
        {imgState === "loading" && (
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 13,
              color: "#1E2D3D",
              opacity: 0.3,
            }}
          >
            Loading image…
          </span>
        )}

        {/* Error state */}
        {imgState === "error" && (
          <span
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 13,
              color: "#C17B4A",
              padding: "16px",
              textAlign: "center",
              display: "block",
            }}
          >
            🖼️ Image unavailable — try your best
          </span>
        )}

        {/* The image — always in DOM so onLoad/onError fire; hidden until loaded */}
        {image_url && (
          <img
            src={image_url}
            alt=""
            onLoad={() => setImgState("loaded")}
            onError={() => setImgState("error")}
            style={{
              width: "100%",
              maxHeight: 260,
              objectFit: "contain",
              display: imgState === "loaded" ? "block" : "none",
              borderRadius: 16,
            }}
          />
        )}
      </div>

      {/* Urdu label options — 2-column grid */}
      <div className="grid grid-cols-2 gap-3">
        {choices.map((choice, idx) => (
          <OptionButton
            key={idx}
            label={choice}
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
