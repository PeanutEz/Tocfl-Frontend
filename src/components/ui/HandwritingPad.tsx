"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Trash2, Undo2, X } from "lucide-react";
import { recognizeHandwriting, type Stroke } from "@/lib/handwriting";

type Props = {
  /** Chọn một chữ gợi ý: chèn vào ô tìm kiếm. */
  onPick: (char: string) => void;
  onClose: () => void;
};

const RECOGNIZE_DELAY = 250;

/** Khung vẽ chữ Hán bằng chuột / ngón tay, gợi ý chữ sau mỗi nét. */
export default function HandwritingPad({ onPick, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef<Stroke | null>(null);
  const startRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [strokeCount, setStrokeCount] = useState(0);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Ô chữ mễ mờ ở giữa để dễ canh chữ
    const size = Math.min(w, h) - 16;
    const x0 = (w - size) / 2;
    const y0 = (h - size) / 2;
    ctx.save();
    ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue("--color-line").trim() || "#e5e5e5";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.strokeRect(x0, y0, size, size);
    ctx.beginPath();
    ctx.moveTo(x0, h / 2);
    ctx.lineTo(x0 + size, h / 2);
    ctx.moveTo(w / 2, y0);
    ctx.lineTo(w / 2, y0 + size);
    ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue("--color-ink").trim() || "#2c3e50";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const all = drawingRef.current ? [...strokesRef.current, drawingRef.current] : strokesRef.current;
    for (const [xs, ys] of all) {
      ctx.beginPath();
      ctx.moveTo(xs[0], ys[0]);
      for (let i = 1; i < xs.length; i++) ctx.lineTo(xs[i], ys[i]);
      if (xs.length === 1) ctx.lineTo(xs[0] + 0.1, ys[0]);
      ctx.stroke();
    }
  }, []);

  // Giữ canvas nét theo kích thước thật và mật độ điểm ảnh
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      redraw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [redraw]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const recognize = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();
    if (strokesRef.current.length === 0) {
      setCandidates([]);
      setStatus("idle");
      return;
    }
    timerRef.current = setTimeout(async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("loading");
      try {
        const list = await recognizeHandwriting(strokesRef.current, canvas.clientWidth, canvas.clientHeight, controller.signal);
        if (controller.signal.aborted) return;
        setCandidates(list);
        setStatus("idle");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setStatus("error");
      }
    }, RECOGNIZE_DELAY);
  }, []);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return [Math.round(e.clientX - rect.left), Math.round(e.clientY - rect.top), Math.round(performance.now() - startRef.current)];
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    if (strokesRef.current.length === 0) startRef.current = performance.now();
    const [x, y, t] = point(e);
    drawingRef.current = [[x], [y], [t]];
    redraw();
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    const stroke = drawingRef.current;
    if (!stroke) return;
    const [x, y, t] = point(e);
    stroke[0].push(x);
    stroke[1].push(y);
    stroke[2].push(t);
    redraw();
  }

  function onPointerUp() {
    const stroke = drawingRef.current;
    if (!stroke) return;
    drawingRef.current = null;
    strokesRef.current = [...strokesRef.current, stroke];
    setStrokeCount(strokesRef.current.length);
    redraw();
    recognize();
  }

  function undo() {
    strokesRef.current = strokesRef.current.slice(0, -1);
    setStrokeCount(strokesRef.current.length);
    redraw();
    recognize();
  }

  function clearAll() {
    strokesRef.current = [];
    setStrokeCount(0);
    redraw();
    recognize();
  }

  function pick(char: string) {
    onPick(char);
    clearAll();
  }

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-3">
        <h3 className="text-base font-bold text-ink">Nhận dạng nét vẽ</h3>
        {status === "loading" && <Loader2 size={16} className="animate-spin text-muted" aria-label="Đang nhận dạng" />}
      </div>

      {/* Dòng chữ gợi ý */}
      <div className="mx-4 mt-2 flex min-h-[52px] items-center gap-1 overflow-x-auto border-y border-contrast/10 py-1.5" aria-live="polite">
        {status === "error" ? (
          <p className="text-sm text-danger">Chưa nhận dạng được. Kiểm tra mạng rồi vẽ lại một nét.</p>
        ) : candidates.length > 0 ? (
          candidates.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => pick(c)}
              className="h-10 min-w-10 shrink-0 cursor-pointer rounded-md px-1.5 text-2xl text-ink transition hover:bg-brand/10 hover:text-brand"
            >
              {c}
            </button>
          ))
        ) : (
          <p className="text-sm text-muted">{strokeCount === 0 ? "Viết một chữ Hán vào khung bên dưới." : "Viết tiếp để có gợi ý."}</p>
        )}
      </div>

      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label="Khung viết chữ Hán"
        className="block h-[240px] w-full cursor-crosshair touch-none sm:h-[300px]"
      />

      <div className="flex items-center gap-2 px-4 pb-3 pt-1">
        <button
          type="button"
          onClick={undo}
          disabled={strokeCount === 0}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-page px-3 py-1.5 text-[15px] font-semibold text-ink transition hover:bg-contrast/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Undo2 size={17} /> Hoàn tác
        </button>
        <button
          type="button"
          onClick={clearAll}
          disabled={strokeCount === 0}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-page px-3 py-1.5 text-[15px] font-semibold text-danger transition hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={17} /> Xoá hết
        </button>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-page px-3 py-1.5 text-[15px] font-semibold text-ink transition hover:bg-contrast/10"
        >
          <X size={17} /> Đóng
        </button>
      </div>
    </div>
  );
}
