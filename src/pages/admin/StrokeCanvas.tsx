import { useEffect, useRef } from "react";

const SIZE = 260;
const FONT_SIZE = 120;
const BASELINE_Y = Math.round(SIZE * 0.55); // matches TraceLetter.tsx

interface Point { x: number; y: number }

interface Props {
  value: Point[][];
  onChange: (strokes: Point[][]) => void;
  readonly?: boolean;
  letter?: string;
}

export function StrokeCanvas({ value, onChange, readonly = false, letter }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const allStrokes = useRef<Point[][]>(value);
  const currentStroke = useRef<Point[]>([]);

  // Sync allStrokes ref and redraw whenever value or letter changes
  useEffect(() => {
    allStrokes.current = value;
    redrawFromStrokes(value);
  }, [value, letter]);

  // Draw faint letter template so admin sees the letter while drawing reference strokes
  const drawTemplate = (ctx: CanvasRenderingContext2D) => {
    if (!letter) return;
    ctx.save();
    ctx.font = `${FONT_SIZE}px Amiri`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(30, 45, 61, 0.08)";
    ctx.fillText(letter, SIZE / 2, BASELINE_Y);
    ctx.restore();
  };

  const redrawFromStrokes = (strokes: Point[][]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    drawTemplate(ctx);
    ctx.strokeStyle = "#1E2D3D";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of strokes) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x * SIZE, stroke[0].y * SIZE);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x * SIZE, stroke[i].y * SIZE);
      }
      ctx.stroke();
    }
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const sx = SIZE / rect.width;
    const sy = SIZE / rect.height;
    if ("touches" in e) {
      const t = e.touches[0] || (e as React.TouchEvent).changedTouches[0];
      return {
        x: Math.max(0, Math.min(1, (t.clientX - rect.left) * sx / SIZE)),
        y: Math.max(0, Math.min(1, (t.clientY - rect.top) * sy / SIZE)),
      };
    }
    return {
      x: Math.max(0, Math.min(1, ((e as React.MouseEvent).clientX - rect.left) * sx / SIZE)),
      y: Math.max(0, Math.min(1, ((e as React.MouseEvent).clientY - rect.top) * sy / SIZE)),
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (readonly) return;
    e.preventDefault();
    isDrawing.current = true;
    currentStroke.current = [];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.strokeStyle = "#1E2D3D";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const p = getPos(e);
    if (p) {
      ctx.moveTo(p.x * SIZE, p.y * SIZE);
      currentStroke.current.push(p);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || readonly) return;
    e.preventDefault();
    const p = getPos(e);
    if (!p) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.lineTo(p.x * SIZE, p.y * SIZE);
    ctx.stroke();
    currentStroke.current.push(p);
  };

  const endDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || readonly) return;
    e.preventDefault();
    isDrawing.current = false;
    // Downsample: keep every 3rd point for efficiency
    const sampled = currentStroke.current.filter((_, i) => i % 3 === 0);
    if (sampled.length < 2) return;
    const updated = [...allStrokes.current, sampled];
    allStrokes.current = updated;
    onChange(updated);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, SIZE, SIZE);
    drawTemplate(ctx);
    currentStroke.current = [];
    allStrokes.current = [];
    onChange([]);
  };

  const strokeCount = value.length;
  const totalPoints = value.reduce((n, s) => n + s.length, 0);
  const hasStrokes = totalPoints > 0;

  return (
    <div className="flex flex-col items-start gap-2">
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        style={{
          border: "1.5px solid #E8E0D5",
          borderRadius: 12,
          cursor: readonly ? "default" : "crosshair",
          touchAction: "none",
          width: SIZE,
          height: SIZE,
          backgroundColor: "#FAFAF8",
          display: "block",
        }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div className="flex items-center gap-3">
        {!readonly && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#C17B4A",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 0",
              opacity: hasStrokes ? 1 : 0.35,
            }}
            disabled={!hasStrokes}
          >
            Clear all strokes
          </button>
        )}
        <span style={{ fontSize: 11, color: "#1E2D3D", opacity: 0.45 }}>
          {hasStrokes
            ? `${strokeCount} stroke${strokeCount !== 1 ? "s" : ""}, ${totalPoints} points recorded`
            : readonly
            ? "No reference strokes set"
            : "Draw strokes one at a time — lift between each stroke"}
        </span>
      </div>
    </div>
  );
}
