"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Word } from "@/types";
import { stopSpeaking } from "@/lib/speech";
import WordCard from "@/components/dictionary/WordCard";

type Props = {
  items: Word[];
  index: number | null; // null = đóng
  onIndexChange: (index: number | null) => void;
};

/** Hộp thoại xem đầy đủ một từ (dùng lại WordCard). Esc / bấm nền để đóng, mũi tên trái phải để chuyển từ. */
export default function WordDialog({ items, index, onIndexChange }: Props) {
  const open = index !== null && index >= 0 && index < items.length;
  const item = open ? items[index] : null;
  const closeRef = useRef<HTMLButtonElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Giữ hàm mới nhất cho trình nghe phím mà không gắn lại mỗi lần render
  const latest = useRef({ index, total: items.length, onIndexChange });
  useEffect(() => {
    latest.current = { index, total: items.length, onIndexChange };
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      const { index: i, total, onIndexChange: change } = latest.current;
      if (i === null) return;
      if (e.key === "Escape") change(null);
      // Đang gõ trong ô nhập thì không chuyển từ
      if ((e.target as HTMLElement | null)?.closest("input, textarea")) return;
      if (e.key === "ArrowLeft" && i > 0) change(i - 1);
      if (e.key === "ArrowRight" && i < total - 1) change(i + 1);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      stopSpeaking();
      previous?.focus();
    };
  }, [open]);

  // Chuyển sang từ khác thì cuộn nội dung về đầu
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [index]);

  if (!item || index === null) return null;

  const navBtn =
    "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-ink transition hover:bg-contrast/10 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-4">
      <div className="fade-in absolute inset-0 bg-black/45" onClick={() => onIndexChange(null)} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Chi tiết từ ${item.word}`}
        className="slide-down relative flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-lg bg-page shadow-[0_20px_50px_rgba(0,0,0,0.3)] sm:rounded-lg"
      >
        <div className="flex items-center gap-1 border-b border-line bg-surface px-2 py-1.5 sm:px-3">
          <button type="button" onClick={() => onIndexChange(index - 1)} disabled={index <= 0} aria-label="Từ trước" className={navBtn}>
            <ChevronLeft size={20} />
          </button>
          <span className="min-w-0 flex-1 text-center text-sm text-muted" aria-live="polite">
            Từ {index + 1}/{items.length}
          </span>
          <button
            type="button"
            onClick={() => onIndexChange(index + 1)}
            disabled={index >= items.length - 1}
            aria-label="Từ sau"
            className={navBtn}
          >
            <ChevronRight size={20} />
          </button>
          <button ref={closeRef} type="button" onClick={() => onIndexChange(null)} aria-label="Đóng" title="Đóng (Esc)" className={`${navBtn} ml-1`}>
            <X size={20} />
          </button>
        </div>
        <div ref={bodyRef} className="overflow-y-auto overscroll-contain px-2.5 pb-3 sm:px-4">
          <WordCard key={`${index}-${item.word}`} item={item} />
        </div>
      </div>
    </div>
  );
}
