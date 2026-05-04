import { useEffect, useRef, useState } from "react";
import type { QuestionProps } from "./shared";

const SIZE = 260;
const BRUSH_R = 10;
const COVERAGE_THRESHOLD = 0.65;

interface Point { x: number; y: number }

// DTW distance between two normalized stroke sequences
function dtwDistance(a: Point[], b: Point[]): number {
  if (a.length === 0 || b.length === 0) return Infinity;
  const n = a.length, m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(Infinity));
  dp[0][0] = 0;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = Math.hypot(a[i - 1].x - b[j - 1].x, a[i - 1].y - b[j - 1].y);
      dp[i][j] = cost + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[n][m] / Math.max(n, m);
}

// Map tolerance 1-5 to a DTW distance threshold
function toleranceToThreshold(tolerance: number): number {
  const map: Record<number, number> = { 1: 0.06, 2: 0.11, 3: 0.18, 4: 0.26, 5: 0.38 };
  return map[Math.round(Math.max(1, Math.min(5, tolerance)))] ?? 0.18;
}

// Downsample a point array to at most maxPts points
function downsample(pts: Point[], maxPts = 60): Point[] {
  if (pts.length <= maxPts) return pts;
  const step = pts.length / maxPts;
  return Array.from({ length: maxPts }, (_, i) => pts[Math.round(i * step)]);
}

export function TraceLetter({ content, onAnswer, feedback }: QuestionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offDataRef = useRef<Uint8ClampedArray | null>(null);
  const visitedRef = useRef<Uint8Array>(new Uint8Array(SIZE * SIZE));
  const totalPixels = useRef(0);
  // Each entry is the list of pixel indices belonging to one connected component (body, dots, etc.)
  const componentsRef = useRef<number[][]>([]);
  const isDrawing = useRef(false);

  // Multi-stroke management (normalized 0-1 coordinates)
  const allStrokes = useRef<Point[][]>([]);  // completed strokes
  const undoneStack = useRef<Point[][]>([]); // redo stack
  const currStroke = useRef<Point[]>([]);    // stroke in progress

  // Reactive counters so button disabled states update on re-render
  const [strokeCount, setStrokeCount] = useState(0);
  const [undoneCount, setUndoneCount] = useState(0);
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  const [notQuite, setNotQuite] = useState(false);

  const disabled = feedback !== "idle";
  // Flatten reference_points whether stored as Point[] (legacy) or Point[][] (multi-stroke)
  const refPoints: Point[] = Array.isArray(content.reference_points)
    ? (Array.isArray(content.reference_points[0])
        ? (content.reference_points as Point[][]).flat()
        : (content.reference_points as Point[]))
    : [];
  const hasReference = refPoints.length > 1;
  const tolerance = (content.tolerance as number) ?? 3;

  // ── Init / reset on letter change ───────────────────────────

  useEffect(() => {
    setDone(false);
    setPct(0);
    setNotQuite(false);
    setStrokeCount(0);
    setUndoneCount(0);
    allStrokes.current = [];
    undoneStack.current = [];
    currStroke.current = [];
    visitedRef.current = new Uint8Array(SIZE * SIZE);
    componentsRef.current = [];
    initCanvas();
  }, [content.letter]);

  // Compute font size and baseline y so any Arabic letter (incl. deep descenders like ج) fits
  const FONT_SIZE = 120;
  const BASELINE_Y = Math.round(SIZE * 0.55); // 143px — gives ~84px ascent room and ~117px descent room

  const initCanvas = async () => {
    try { await document.fonts.load(`${FONT_SIZE}px "Amiri"`); } catch { /* already loaded */ }
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawLetterTemplate(canvas.getContext("2d")!);

    // Offscreen canvas to calculate which pixels belong to the letter glyph
    const off = document.createElement("canvas");
    off.width = SIZE; off.height = SIZE;
    const offCtx = off.getContext("2d")!;
    offCtx.font = `${FONT_SIZE}px Amiri`;
    offCtx.textAlign = "center";
    offCtx.textBaseline = "alphabetic";
    offCtx.fillStyle = "black";
    offCtx.fillText(content.letter as string, SIZE / 2, BASELINE_Y);
    const imageData = offCtx.getImageData(0, 0, SIZE, SIZE);
    offDataRef.current = imageData.data;

    let count = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] > 64) count++;
    }
    totalPixels.current = count;

    // Split the letter into connected components so we can require every part
    // (body + each dot) to be traced — not just a global pixel-count threshold
    componentsRef.current = computeComponents(imageData.data);
  };

  // BFS flood-fill to find connected components of letter pixels
  const computeComponents = (data: Uint8ClampedArray): number[][] => {
    const visited = new Uint8Array(SIZE * SIZE);
    const result: number[][] = [];
    for (let start = 0; start < SIZE * SIZE; start++) {
      if (data[start * 4 + 3] <= 64 || visited[start]) continue;
      const pixels: number[] = [];
      const queue: number[] = [start];
      visited[start] = 1;
      let head = 0;
      while (head < queue.length) {
        const idx = queue[head++];
        pixels.push(idx);
        const x = idx % SIZE, y = Math.floor(idx / SIZE);
        if (x > 0       && !visited[idx - 1]    && data[(idx - 1)    * 4 + 3] > 64) { visited[idx - 1]    = 1; queue.push(idx - 1); }
        if (x < SIZE-1  && !visited[idx + 1]    && data[(idx + 1)    * 4 + 3] > 64) { visited[idx + 1]    = 1; queue.push(idx + 1); }
        if (y > 0       && !visited[idx - SIZE]  && data[(idx - SIZE)  * 4 + 3] > 64) { visited[idx - SIZE]  = 1; queue.push(idx - SIZE); }
        if (y < SIZE-1  && !visited[idx + SIZE]  && data[(idx + SIZE)  * 4 + 3] > 64) { visited[idx + SIZE]  = 1; queue.push(idx + SIZE); }
      }
      if (pixels.length >= 20) result.push(pixels); // skip tiny rendering artifacts
    }
    return result;
  };

  // ── Canvas helpers ───────────────────────────────────────────

  const drawLetterTemplate = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.font = `${FONT_SIZE}px Amiri`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "rgba(30, 45, 61, 0.08)";
    ctx.fillText(content.letter as string, SIZE / 2, BASELINE_Y);
  };

  // Redraw the full canvas from allStrokes (used after undo/redo/clear)
  const rebuildCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    drawLetterTemplate(ctx);
    ctx.fillStyle = "#1E2D3D";
    for (const stroke of allStrokes.current) {
      if (stroke.length === 0) continue;
      if (stroke.length === 1) {
        ctx.beginPath();
        ctx.arc(stroke[0].x * SIZE, stroke[0].y * SIZE, BRUSH_R * 0.7, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.save();
      ctx.lineWidth = BRUSH_R * 1.4;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#1E2D3D";
      ctx.beginPath();
      ctx.moveTo(stroke[0].x * SIZE, stroke[0].y * SIZE);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x * SIZE, stroke[i].y * SIZE);
      }
      ctx.stroke();
      ctx.restore();
    }
  };

  // Recompute which pixels have been covered by allStrokes (used after undo)
  const rebuildVisited = () => {
    visitedRef.current = new Uint8Array(SIZE * SIZE);
    const offData = offDataRef.current;
    if (!offData) return;
    for (const stroke of allStrokes.current) {
      for (const pt of stroke) {
        markPixels(pt.x * SIZE, pt.y * SIZE, offData);
      }
    }
  };

  const markPixels = (x: number, y: number, offData: Uint8ClampedArray) => {
    for (let dx = -BRUSH_R; dx <= BRUSH_R; dx++) {
      for (let dy = -BRUSH_R; dy <= BRUSH_R; dy++) {
        if (dx * dx + dy * dy > BRUSH_R * BRUSH_R) continue;
        const px = Math.round(x) + dx, py = Math.round(y) + dy;
        if (px < 0 || px >= SIZE || py < 0 || py >= SIZE) continue;
        if (offData[(py * SIZE + px) * 4 + 3] > 64) {
          visitedRef.current[py * SIZE + px] = 1;
        }
      }
    }
  };

  // Overall coverage — used for the live progress % shown to the user
  const calcDisplayCoverage = (): number => {
    if (totalPixels.current === 0) return 0;
    let n = 0;
    for (let i = 0; i < visitedRef.current.length; i++) {
      if (visitedRef.current[i]) n++;
    }
    return n / totalPixels.current;
  };

  // Per-component coverage — used for pass/fail.
  // Returns the LOWEST coverage fraction across all components (body, dots, etc.)
  // so the user must trace every part of the letter, not just the main body.
  const calcCoverage = (): number => {
    const components = componentsRef.current;
    if (components.length === 0) return calcDisplayCoverage(); // fallback for no-component case
    let minCov = 1;
    for (const pixels of components) {
      let covered = 0;
      for (const idx of pixels) {
        if (visitedRef.current[idx]) covered++;
      }
      const cov = covered / pixels.length;
      if (cov < minCov) minCov = cov;
    }
    return minCov;
  };

  // ── Pointer position ─────────────────────────────────────────

  const getPos = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const sx = SIZE / rect.width;
    const sy = SIZE / rect.height;
    if ("touches" in e) {
      const t = e.touches[0] || (e as React.TouchEvent).changedTouches[0];
      return { x: (t.clientX - rect.left) * sx, y: (t.clientY - rect.top) * sy };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * sx,
      y: ((e as React.MouseEvent).clientY - rect.top) * sy,
    };
  };

  // ── Drawing ──────────────────────────────────────────────────

  // Paint a single dot on the canvas and accumulate coverage/points
  const paint = (x: number, y: number) => {
    if (disabled || done) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(x, y, BRUSH_R * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = "#1E2D3D";
    ctx.fill();

    // Record normalized point
    currStroke.current.push({ x: x / SIZE, y: y / SIZE });

    // Track coverage pixels
    const offData = offDataRef.current;
    if (offData) markPixels(x, y, offData);
  };

  // Called when a pointer-up/leave finalizes the current stroke
  const finalizeStroke = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (currStroke.current.length === 0) return;
    allStrokes.current = [...allStrokes.current, [...currStroke.current]];
    currStroke.current = [];
    // New stroke clears the redo stack
    undoneStack.current = [];
    setStrokeCount((c) => c + 1);
    setUndoneCount(0);
    // Update live coverage preview (coverage-mode only) — show overall %, not per-component min
    if (!hasReference) setPct(calcDisplayCoverage());
  };

  // ── Stroke controls ──────────────────────────────────────────

  const handleUndo = () => {
    if (allStrokes.current.length === 0) return;
    const last = allStrokes.current[allStrokes.current.length - 1];
    undoneStack.current = [...undoneStack.current, last];
    allStrokes.current = allStrokes.current.slice(0, -1);
    rebuildVisited();
    rebuildCanvas();
    const newCount = allStrokes.current.length;
    setStrokeCount(newCount);
    setUndoneCount(undoneStack.current.length);
    setPct(hasReference ? 0 : calcDisplayCoverage());
  };

  const handleRedo = () => {
    if (undoneStack.current.length === 0) return;
    const next = undoneStack.current[undoneStack.current.length - 1];
    allStrokes.current = [...allStrokes.current, next];
    undoneStack.current = undoneStack.current.slice(0, -1);
    rebuildVisited();
    rebuildCanvas();
    setStrokeCount(allStrokes.current.length);
    setUndoneCount(undoneStack.current.length);
    setPct(hasReference ? 0 : calcDisplayCoverage());
  };

  const handleClear = () => {
    allStrokes.current = [];
    undoneStack.current = [];
    currStroke.current = [];
    visitedRef.current = new Uint8Array(SIZE * SIZE);
    setStrokeCount(0);
    setUndoneCount(0);
    setPct(0);
    setNotQuite(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawLetterTemplate(canvas.getContext("2d")!);
  };

  // ── Confirm ─────────────────────────────────────────────────

  const handleConfirm = () => {
    if (done || disabled) return;
    const allPoints = allStrokes.current.flat();
    if (allPoints.length < 3) return; // nothing meaningful drawn

    if (hasReference) {
      const ref = downsample(refPoints, 60);
      const user = downsample(allPoints, 60);
      const dist = dtwDistance(user, ref);
      const threshold = toleranceToThreshold(tolerance);
      const score = Math.max(0, 1 - dist / threshold);
      setPct(score);
      if (dist <= threshold) {
        setDone(true);
        onAnswer(true);
      } else {
        // Not good enough — show hint, let user keep drawing (no wrong penalty)
        setNotQuite(true);
        setTimeout(() => setNotQuite(false), 2000);
      }
    } else {
      // Show overall % to user but use per-component minimum to decide pass/fail
      // This forces the user to trace every part (body + all dots), not just the bulk
      const displayCov = calcDisplayCoverage();
      const passCov = calcCoverage();
      setPct(displayCov);
      if (passCov >= COVERAGE_THRESHOLD) {
        setDone(true);
        onAnswer(true);
      } else {
        setNotQuite(true);
        setTimeout(() => setNotQuite(false), 2000);
      }
    }
  };

  // ── Render ───────────────────────────────────────────────────

  const canDraw = !disabled && !done;

  return (
    <div className="flex flex-col items-center gap-4">
      <p
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "#1E2D3D", opacity: 0.45 }}
      >
        Trace the letter
      </p>

      <canvas
        ref={canvasRef}
        width={SIZE}
        height={SIZE}
        style={{
          border: done
            ? "2px solid #D4A853"
            : notQuite
            ? "2px solid #C17B4A"
            : "2px solid #E8E0D5",
          borderRadius: 16,
          cursor: canDraw ? "crosshair" : "default",
          touchAction: "none",
          width: Math.min(SIZE, 300),
          height: Math.min(SIZE, 300),
          backgroundColor: "white",
          transition: "border-color 200ms ease",
        }}
        onMouseDown={(e) => {
          if (!canDraw) return;
          isDrawing.current = true;
          currStroke.current = [];
          const p = getPos(e);
          if (p) paint(p.x, p.y);
        }}
        onMouseMove={(e) => {
          if (!isDrawing.current || !canDraw) return;
          const p = getPos(e);
          if (p) paint(p.x, p.y);
        }}
        onMouseUp={finalizeStroke}
        onMouseLeave={finalizeStroke}
        onTouchStart={(e) => {
          e.preventDefault();
          if (!canDraw) return;
          isDrawing.current = true;
          currStroke.current = [];
          const p = getPos(e);
          if (p) paint(p.x, p.y);
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          if (!isDrawing.current || !canDraw) return;
          const p = getPos(e);
          if (p) paint(p.x, p.y);
        }}
        onTouchEnd={(e) => { e.preventDefault(); finalizeStroke(); }}
      />

      {/* Status line */}
      <p
        className="text-xs"
        style={{
          color: notQuite ? "#C17B4A" : "#1E2D3D",
          opacity: notQuite ? 1 : 0.4,
          minHeight: 16,
        }}
      >
        {done
          ? "✓ Letter traced!"
          : notQuite
          ? "Not quite — keep tracing and try again"
          : pct > 0
          ? `${Math.round(pct * 100)}% — keep going!`
          : strokeCount > 0
          ? `${strokeCount} stroke${strokeCount !== 1 ? "s" : ""} — lift your finger between strokes, then tap Confirm`
          : "Trace the letter with your finger or mouse"}
      </p>

      {/* Controls row */}
      {canDraw && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {/* Undo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokeCount === 0}
            style={{
              background: "none",
              border: "1px solid rgba(30,45,61,0.15)",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              color: "#1E2D3D",
              cursor: strokeCount === 0 ? "not-allowed" : "pointer",
              opacity: strokeCount === 0 ? 0.35 : 1,
              fontFamily: "'Inter', system-ui, sans-serif",
              transition: "opacity 150ms",
            }}
          >
            ↩ Undo
          </button>

          {/* Redo */}
          <button
            type="button"
            onClick={handleRedo}
            disabled={undoneCount === 0}
            style={{
              background: "none",
              border: "1px solid rgba(30,45,61,0.15)",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              color: "#1E2D3D",
              cursor: undoneCount === 0 ? "not-allowed" : "pointer",
              opacity: undoneCount === 0 ? 0.35 : 1,
              fontFamily: "'Inter', system-ui, sans-serif",
              transition: "opacity 150ms",
            }}
          >
            ↪ Redo
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={handleClear}
            disabled={strokeCount === 0}
            style={{
              background: "none",
              border: "1px solid rgba(30,45,61,0.15)",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              color: "#C17B4A",
              cursor: strokeCount === 0 ? "not-allowed" : "pointer",
              opacity: strokeCount === 0 ? 0.35 : 1,
              fontFamily: "'Inter', system-ui, sans-serif",
              transition: "opacity 150ms",
            }}
          >
            ✕ Clear
          </button>

          {/* Confirm */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={strokeCount === 0}
            style={{
              background: strokeCount > 0 ? "#6BA3C8" : "rgba(30,45,61,0.08)",
              border: "none",
              borderRadius: 8,
              padding: "6px 18px",
              fontSize: 12,
              fontWeight: 700,
              color: strokeCount > 0 ? "#FFFFFF" : "rgba(30,45,61,0.3)",
              cursor: strokeCount === 0 ? "not-allowed" : "pointer",
              fontFamily: "'Inter', system-ui, sans-serif",
              transition: "background 150ms, transform 80ms",
            }}
            onMouseDown={(e) => strokeCount > 0 && (e.currentTarget.style.transform = "scale(0.97)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            Confirm ✓
          </button>
        </div>
      )}
    </div>
  );
}
