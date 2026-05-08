import { useEffect, useRef, useState } from "react";
import type { QuestionProps } from "./shared";

// ── Constants ────────────────────────────────────────────────────────────────

const SIZE = 280;           // canvas resolution
const BRUSH_R = 9;          // brush radius in canvas pixels

// Pass thresholds
// Coverage  — what % of the letter's pixels did the user paint over?
// Precision — what % of all painted pixels actually landed ON the letter?
// Both must pass. This stops two failure modes:
//   - Low coverage:  user only traced part of the letter
//   - Low precision: user scribbled randomly / outside the letter
const COVERAGE_THRESHOLD  = 0.60; // must cover at least 60 % of the letter
const PRECISION_THRESHOLD = 0.38; // at least 38 % of drawn strokes must be ON the letter

// For connected-component spread: each component's minimum spatial coverage
const SPREAD_THRESHOLD = 0.45;

interface Point { x: number; y: number }

// ── Helpers ──────────────────────────────────────────────────────────────────

function downsample(pts: Point[], max = 80): Point[] {
  if (pts.length <= max) return pts;
  const step = pts.length / max;
  return Array.from({ length: max }, (_, i) => pts[Math.round(i * step)]);
}

// BFS: split letter pixels into connected components (body, dots, diacritics…)
function computeComponents(data: Uint8ClampedArray, size: number): number[][] {
  const visited = new Uint8Array(size * size);
  const result: number[][] = [];
  for (let start = 0; start < size * size; start++) {
    if (data[start * 4 + 3] <= 50 || visited[start]) continue;
    const pixels: number[] = [];
    const queue: number[] = [start];
    visited[start] = 1;
    let head = 0;
    while (head < queue.length) {
      const idx = queue[head++];
      pixels.push(idx);
      const x = idx % size, y = Math.floor(idx / size);
      const neighbors = [
        x > 0      ? idx - 1    : -1,
        x < size-1 ? idx + 1    : -1,
        y > 0      ? idx - size  : -1,
        y < size-1 ? idx + size  : -1,
      ];
      for (const n of neighbors) {
        if (n >= 0 && !visited[n] && data[n * 4 + 3] > 50) {
          visited[n] = 1;
          queue.push(n);
        }
      }
    }
    if (pixels.length >= 15) result.push(pixels);
  }
  return result;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TraceLetter({ content, onAnswer, feedback }: QuestionProps) {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const offDataRef     = useRef<Uint8ClampedArray | null>(null);  // letter pixel map
  const visitedRef     = useRef<Uint8Array>(new Uint8Array(SIZE * SIZE)); // covered letter px
  const totalLetterPx  = useRef(0);    // total opaque letter pixels
  const totalDrawnPx   = useRef(0);    // total brush pixel hits (on + off letter)
  const onLetterDrawnPx = useRef(0);   // brush pixel hits that landed ON the letter
  const componentsRef  = useRef<number[][]>([]);
  const isDrawing      = useRef(false);

  // Stroke history for undo/redo
  const allStrokes  = useRef<Point[][]>([]);
  const undoneStack = useRef<Point[][]>([]);
  const currStroke  = useRef<Point[]>([]);

  const [strokeCount, setStrokeCount]   = useState(0);
  const [undoneCount, setUndoneCount]   = useState(0);
  const [livePct,     setLivePct]       = useState(0);    // live coverage %
  const [livePrecision, setLivePrecision] = useState(1);  // live precision (0–1)
  const [done,        setDone]          = useState(false);
  const [failReason,  setFailReason]    = useState<"coverage" | "precision" | null>(null);

  const disabled = feedback !== "idle";

  const FONT_SIZE  = 124;
  const BASELINE_Y = Math.round(SIZE * 0.60); // generous room for descenders (ج ی etc.)

  // ── Init / reset on letter change ────────────────────────────────────────────

  useEffect(() => {
    setDone(false);
    setLivePct(0);
    setLivePrecision(1);
    setFailReason(null);
    setStrokeCount(0);
    setUndoneCount(0);
    allStrokes.current    = [];
    undoneStack.current   = [];
    currStroke.current    = [];
    visitedRef.current    = new Uint8Array(SIZE * SIZE);
    totalDrawnPx.current  = 0;
    onLetterDrawnPx.current = 0;
    componentsRef.current = [];
    initCanvas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.letter]);

  const initCanvas = async () => {
    try { await document.fonts.load(`${FONT_SIZE}px "Amiri"`); } catch { /* ok */ }
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawTemplate(canvas.getContext("2d")!);

    // Offscreen: compute exact letter pixel map
    const off = document.createElement("canvas");
    off.width = SIZE; off.height = SIZE;
    const offCtx = off.getContext("2d")!;
    offCtx.font = `${FONT_SIZE}px Amiri`;
    offCtx.textAlign = "center";
    offCtx.textBaseline = "alphabetic";
    offCtx.fillStyle = "black";
    offCtx.fillText(content.letter as string, SIZE / 2, BASELINE_Y);
    const imgData = offCtx.getImageData(0, 0, SIZE, SIZE);
    offDataRef.current = imgData.data;

    let count = 0;
    for (let i = 3; i < imgData.data.length; i += 4) {
      if (imgData.data[i] > 50) count++;
    }
    totalLetterPx.current  = count;
    componentsRef.current  = computeComponents(imgData.data, SIZE);
  };

  // ── Canvas drawing ────────────────────────────────────────────────────────────

  const drawTemplate = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.font = `${FONT_SIZE}px Amiri`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(30,45,61,0.08)";
    ctx.fillText(content.letter as string, SIZE / 2, BASELINE_Y);
  };

  const rebuildCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    drawTemplate(ctx);
    ctx.fillStyle   = "#1E2D3D";
    ctx.strokeStyle = "#1E2D3D";
    for (const stroke of allStrokes.current) {
      if (stroke.length === 0) continue;
      if (stroke.length === 1) {
        ctx.beginPath();
        ctx.arc(stroke[0].x * SIZE, stroke[0].y * SIZE, BRUSH_R * 0.75, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.save();
      ctx.lineWidth   = BRUSH_R * 2;
      ctx.lineCap     = "round";
      ctx.lineJoin    = "round";
      ctx.beginPath();
      ctx.moveTo(stroke[0].x * SIZE, stroke[0].y * SIZE);
      for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x * SIZE, stroke[i].y * SIZE);
      ctx.stroke();
      ctx.restore();
    }
  };

  const rebuildCoverage = () => {
    visitedRef.current     = new Uint8Array(SIZE * SIZE);
    totalDrawnPx.current   = 0;
    onLetterDrawnPx.current = 0;
    const offData = offDataRef.current;
    if (!offData) return;
    for (const stroke of allStrokes.current) {
      for (const pt of stroke) markPixels(pt.x * SIZE, pt.y * SIZE, offData, false);
    }
  };

  // Paint one brush stamp and update coverage counters.
  // `live` = true during active drawing, false during rebuild (avoids double-counting)
  const markPixels = (cx: number, cy: number, offData: Uint8ClampedArray, live: boolean) => {
    for (let dx = -BRUSH_R; dx <= BRUSH_R; dx++) {
      for (let dy = -BRUSH_R; dy <= BRUSH_R; dy++) {
        if (dx * dx + dy * dy > BRUSH_R * BRUSH_R) continue;
        const px = Math.round(cx) + dx;
        const py = Math.round(cy) + dy;
        if (px < 0 || px >= SIZE || py < 0 || py >= SIZE) continue;
        const pidx = py * SIZE + px;
        const onLetter = offData[pidx * 4 + 3] > 50;
        if (live) {
          totalDrawnPx.current++;
          if (onLetter) onLetterDrawnPx.current++;
        }
        if (onLetter) visitedRef.current[pidx] = 1;
      }
    }
  };

  // ── Scoring ───────────────────────────────────────────────────────────────────

  // Overall letter coverage (for live %)
  const calcCoverage = (): number => {
    if (totalLetterPx.current === 0) return 0;
    let n = 0;
    for (let i = 0; i < visitedRef.current.length; i++) if (visitedRef.current[i]) n++;
    return n / totalLetterPx.current;
  };

  // Precision: what fraction of drawn strokes landed on the letter
  const calcPrecision = (): number => {
    if (totalDrawnPx.current === 0) return 1;
    return onLetterDrawnPx.current / totalDrawnPx.current;
  };

  // Per-component coverage check — each connected part (body, dots) must be covered
  const calcComponentScore = (): number => {
    const components = componentsRef.current;
    if (components.length === 0) return calcCoverage();
    let minScore = 1;
    for (const pixels of components) {
      let covered = 0;
      for (const idx of pixels) if (visitedRef.current[idx]) covered++;
      const cov = covered / pixels.length;
      if (cov < minScore) minScore = cov;

      // Spatial spread — 3×3 grid over the component bounding box
      let minX = SIZE, maxX = 0, minY = SIZE, maxY = 0;
      for (const idx of pixels) {
        const x = idx % SIZE, y = Math.floor(idx / SIZE);
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
      const w = maxX - minX + 1, h = maxY - minY + 1;
      // Skip spread check for small dots — coverage alone is enough
      if (w <= 28 && h <= 28) continue;

      const GRID = 3;
      const cellW = w / GRID, cellH = h / GRID;
      const cellTotal = new Int32Array(GRID * GRID);
      const cellHit   = new Int32Array(GRID * GRID);
      for (const idx of pixels) {
        const x = idx % SIZE, y = Math.floor(idx / SIZE);
        const cx = Math.min(GRID - 1, Math.floor((x - minX) / cellW));
        const cy = Math.min(GRID - 1, Math.floor((y - minY) / cellH));
        const cell = cy * GRID + cx;
        cellTotal[cell]++;
        if (visitedRef.current[idx]) cellHit[cell]++;
      }
      for (let i = 0; i < GRID * GRID; i++) {
        if (cellTotal[i] < 15) continue;
        const spread = cellHit[i] / cellTotal[i];
        if (spread < minScore) minScore = spread;
      }
    }
    return minScore;
  };

  // ── Input handling ────────────────────────────────────────────────────────────

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const sx = SIZE / rect.width, sy = SIZE / rect.height;
    if ("touches" in e) {
      const t = e.touches[0] ?? (e as React.TouchEvent).changedTouches[0];
      return { x: (t.clientX - rect.left) * sx, y: (t.clientY - rect.top) * sy };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * sx,
      y: ((e as React.MouseEvent).clientY - rect.top) * sy,
    };
  };

  const paint = (x: number, y: number) => {
    if (disabled || done) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(x, y, BRUSH_R * 0.75, 0, Math.PI * 2);
    ctx.fillStyle = "#1E2D3D";
    ctx.fill();

    currStroke.current.push({ x: x / SIZE, y: y / SIZE });
    const offData = offDataRef.current;
    if (offData) markPixels(x, y, offData, true);

    // Update live feedback every few points
    if (currStroke.current.length % 4 === 0) {
      setLivePct(calcCoverage());
      setLivePrecision(calcPrecision());
    }
  };

  const finalizeStroke = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (currStroke.current.length === 0) return;
    allStrokes.current = [...allStrokes.current, [...currStroke.current]];
    currStroke.current = [];
    undoneStack.current = [];
    setStrokeCount((c) => c + 1);
    setUndoneCount(0);
    setLivePct(calcCoverage());
    setLivePrecision(calcPrecision());
  };

  // ── Undo / Redo / Clear ───────────────────────────────────────────────────────

  const handleUndo = () => {
    if (allStrokes.current.length === 0) return;
    const last = allStrokes.current[allStrokes.current.length - 1];
    undoneStack.current = [...undoneStack.current, last];
    allStrokes.current  = allStrokes.current.slice(0, -1);
    rebuildCoverage();
    rebuildCanvas();
    setStrokeCount(allStrokes.current.length);
    setUndoneCount(undoneStack.current.length);
    setLivePct(calcCoverage());
    setLivePrecision(calcPrecision());
  };

  const handleRedo = () => {
    if (undoneStack.current.length === 0) return;
    const next = undoneStack.current[undoneStack.current.length - 1];
    allStrokes.current  = [...allStrokes.current, next];
    undoneStack.current = undoneStack.current.slice(0, -1);
    rebuildCoverage();
    rebuildCanvas();
    setStrokeCount(allStrokes.current.length);
    setUndoneCount(undoneStack.current.length);
    setLivePct(calcCoverage());
    setLivePrecision(calcPrecision());
  };

  const handleClear = () => {
    allStrokes.current    = [];
    undoneStack.current   = [];
    currStroke.current    = [];
    visitedRef.current    = new Uint8Array(SIZE * SIZE);
    totalDrawnPx.current  = 0;
    onLetterDrawnPx.current = 0;
    setStrokeCount(0);
    setUndoneCount(0);
    setLivePct(0);
    setLivePrecision(1);
    setFailReason(null);
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawTemplate(canvas.getContext("2d")!);
  };

  // ── Confirm ───────────────────────────────────────────────────────────────────

  const handleConfirm = () => {
    if (done || disabled) return;
    const allPoints = allStrokes.current.flat();
    if (allPoints.length < 5) return;

    const coverage  = calcComponentScore(); // per-component coverage + spread
    const precision = calcPrecision();       // how much was drawn ON the letter

    const coverageOk  = coverage  >= COVERAGE_THRESHOLD;
    const precisionOk = precision >= PRECISION_THRESHOLD;

    if (coverageOk && precisionOk) {
      setDone(true);
      setFailReason(null);
      onAnswer(true);
    } else {
      // Tell the user specifically what went wrong
      setFailReason(!precisionOk ? "precision" : "coverage");
      setTimeout(() => setFailReason(null), 2800);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  const canDraw   = !disabled && !done;
  const coveragePct  = Math.round(livePct * 100);
  const precisionPct = Math.round(livePrecision * 100);

  // Status message
  let statusMsg  = "Trace the letter — stay on the shape";
  let statusColor = "rgba(30,45,61,0.45)";
  if (done) {
    statusMsg   = "✓ Well done!";
    statusColor = "#4CAF50";
  } else if (failReason === "precision") {
    statusMsg   = "Try to stay ON the letter — you're drawing outside it";
    statusColor = "#C17B4A";
  } else if (failReason === "coverage") {
    statusMsg   = "Trace the whole letter — don't miss any parts or dots";
    statusColor = "#C17B4A";
  } else if (strokeCount > 0 && livePct > 0) {
    statusMsg   = `${coveragePct}% covered`;
    statusColor = livePct >= COVERAGE_THRESHOLD ? "#4CAF50" : "rgba(30,45,61,0.45)";
  }

  // Precision bar colour
  const precisionColor =
    livePrecision < PRECISION_THRESHOLD ? "#C17B4A" :
    livePrecision > 0.65 ? "#4CAF50" : "#D4A853";

  return (
    <div className="flex flex-col items-center gap-4">
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "#1E2D3D", opacity: 0.45 }}
      >
        Trace the letter
      </p>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        style={{
          border: done
            ? "2px solid #4CAF50"
            : failReason
            ? "2px solid #C17B4A"
            : "2px solid #E8E0D5",
          borderRadius: 16,
          cursor: canDraw ? "crosshair" : "default",
          touchAction: "none",
          width:  Math.min(SIZE, 280),
          height: Math.min(SIZE, 280),
          backgroundColor: "white",
          transition: "border-color 200ms ease",
          display: "block",
        }}
        onMouseDown={(e) => {
          if (!canDraw) return;
          isDrawing.current = true;
          currStroke.current = [];
          const p = getPos(e); if (p) paint(p.x, p.y);
        }}
        onMouseMove={(e) => {
          if (!isDrawing.current || !canDraw) return;
          const p = getPos(e); if (p) paint(p.x, p.y);
        }}
        onMouseUp={finalizeStroke}
        onMouseLeave={finalizeStroke}
        onTouchStart={(e) => {
          e.preventDefault();
          if (!canDraw) return;
          isDrawing.current = true;
          currStroke.current = [];
          const p = getPos(e); if (p) paint(p.x, p.y);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          if (!isDrawing.current || !canDraw) return;
          const p = getPos(e); if (p) paint(p.x, p.y);
        }}
        onTouchEnd={(e) => { e.preventDefault(); finalizeStroke(); }}
      />

      {/* Live accuracy bars — only show once user starts drawing */}
      {strokeCount > 0 && !done && (
        <div style={{ width: Math.min(SIZE, 280), display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Coverage bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 10, fontWeight: 600, color: "rgba(30,45,61,0.45)", width: 60, flexShrink: 0 }}>Coverage</span>
            <div style={{ flex: 1, height: 5, backgroundColor: "rgba(30,45,61,0.08)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${coveragePct}%`,
                backgroundColor: livePct >= COVERAGE_THRESHOLD ? "#4CAF50" : "#D4A853",
                borderRadius: 99,
                transition: "width 100ms ease, background-color 200ms ease",
              }} />
            </div>
            <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 10, fontWeight: 700, color: livePct >= COVERAGE_THRESHOLD ? "#4CAF50" : "rgba(30,45,61,0.5)", width: 30, textAlign: "right" }}>{coveragePct}%</span>
          </div>
          {/* Precision bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 10, fontWeight: 600, color: "rgba(30,45,61,0.45)", width: 60, flexShrink: 0 }}>Accuracy</span>
            <div style={{ flex: 1, height: 5, backgroundColor: "rgba(30,45,61,0.08)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${precisionPct}%`,
                backgroundColor: precisionColor,
                borderRadius: 99,
                transition: "width 100ms ease, background-color 200ms ease",
              }} />
            </div>
            <span style={{ fontFamily: "'Inter', system-ui, sans-serif", fontSize: 10, fontWeight: 700, color: precisionColor, width: 30, textAlign: "right" }}>{precisionPct}%</span>
          </div>
        </div>
      )}

      {/* Status message */}
      <p
        className="text-xs"
        style={{
          color: statusColor,
          minHeight: 16,
          fontFamily: "'Inter', system-ui, sans-serif",
          textAlign: "center",
          transition: "color 200ms ease",
          maxWidth: 280,
        }}
      >
        {statusMsg}
      </p>

      {/* Controls */}
      {canDraw && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokeCount === 0}
            style={ctrlBtn(strokeCount > 0)}
          >
            ↩ Undo
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={undoneCount === 0}
            style={ctrlBtn(undoneCount > 0)}
          >
            ↪ Redo
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={strokeCount === 0}
            style={{ ...ctrlBtn(strokeCount > 0), color: strokeCount > 0 ? "#C17B4A" : "rgba(30,45,61,0.3)" }}
          >
            ✕ Clear
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={strokeCount === 0}
            style={{
              background: strokeCount > 0 ? "#1E2D3D" : "rgba(30,45,61,0.08)",
              border: "none",
              borderRadius: 8,
              padding: "6px 18px",
              fontSize: 12,
              fontWeight: 700,
              color: strokeCount > 0 ? "#FAF6F0" : "rgba(30,45,61,0.3)",
              cursor: strokeCount === 0 ? "not-allowed" : "pointer",
              fontFamily: "'Inter', system-ui, sans-serif",
              transition: "background 150ms, transform 80ms",
            }}
            onMouseDown={(e) => strokeCount > 0 && (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Check ✓
          </button>
        </div>
      )}
    </div>
  );
}

// ── Shared button style ───────────────────────────────────────────────────────

function ctrlBtn(active: boolean): React.CSSProperties {
  return {
    background: "none",
    border: "1px solid rgba(30,45,61,0.15)",
    borderRadius: 8,
    padding: "6px 12px",
    fontSize: 12,
    fontWeight: 600,
    color: active ? "#1E2D3D" : "rgba(30,45,61,0.3)",
    cursor: active ? "pointer" : "not-allowed",
    opacity: active ? 1 : 0.5,
    fontFamily: "'Inter', system-ui, sans-serif",
    transition: "opacity 150ms",
  };
}
