"use client";

import { useEffect, useState } from "react";
import { List, PanelRightClose, PanelRightOpen, X } from "lucide-react";
import { glossesOf } from "@/lib/text";
import type { Word } from "@/types";

/** id của thẻ từ, dùng chung giữa danh sách và thẻ để cuộn tới. */
export const wordDomId = (index: number) => `dict-word-${index}`;

type Props = {
  /** Các từ trong trang hiện tại, kèm vị trí trong toàn bộ kết quả (để tạo id). */
  items: { index: number; item: Word }[];
  page: number;
  totalPages: number;
};

/**
 * Danh sách từ trong trang: bấm một từ để cuộn tới thẻ của từ đó.
 * Desktop (lg): cột dính bên phải, thu gọn / mở rộng được.
 * Màn hình hẹp: nút nổi góc dưới phải, bấm để mở danh sách.
 */
export default function WordNav({ items, page, totalPages }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);

  // Đánh dấu từ đang nằm giữa màn hình
  useEffect(() => {
    const els = items
      .map(({ index }) => document.getElementById(wordDomId(index)))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setCurrent(hit.target.id);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  const jump = (index: number) => {
    const el = document.getElementById(wordDomId(index));
    if (!el) return;
    setSheetOpen(false);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const heading = (
    <div>
      <p className="text-sm font-bold text-brand">Từ trong trang</p>
      <p className="text-xs text-muted">
        {items.length} từ{totalPages > 1 && ` · Trang ${page}/${totalPages}`}
      </p>
    </div>
  );

  const list = (
    <ol className="flex flex-col gap-0.5">
      {items.map(({ index, item }) => {
        const isCurrent = current === wordDomId(index);
        const meaning = glossesOf(item.explanation).slice(0, 2).join(", ") || item.hanViet;
        return (
          <li key={index}>
            <button
              type="button"
              onClick={() => jump(index)}
              aria-current={isCurrent ? "location" : undefined}
              className={`flex w-full cursor-pointer items-baseline gap-2 rounded-md px-2 py-1.5 text-left transition ${
                isCurrent ? "bg-accent/10" : "hover:bg-page"
              }`}
            >
              <span
                className={`shrink-0 font-serif-tc text-base font-bold ${isCurrent ? "text-accent" : "text-ink"}`}
                lang="zh-Hant"
              >
                {item.word.split("/")[0].trim()}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-muted">
                <span className="text-link">{item.pinyin}</span>
                {meaning && ` · ${meaning}`}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );

  return (
    <>
      {/* Desktop: cột dính bên phải */}
      <aside
        aria-label="Danh sách từ trong trang"
        className={`sticky top-36 hidden shrink-0 self-start rounded-lg border border-[#e5e5e5] bg-white shadow-[0_2px_6px_rgba(0,0,0,0.06)] transition-[width] lg:block ${
          expanded ? "w-64" : "w-11"
        }`}
      >
        {expanded ? (
          <div className="flex max-h-[calc(100vh-10rem)] flex-col p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              {heading}
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Thu gọn danh sách từ"
                title="Thu gọn"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition hover:bg-page hover:text-ink"
              >
                <PanelRightClose size={18} />
              </button>
            </div>
            <div className="-mx-1 min-h-0 overflow-y-auto px-1">{list}</div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Mở danh sách từ trong trang"
            title="Mở danh sách từ"
            className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg py-3 text-muted transition hover:bg-page hover:text-ink"
          >
            <PanelRightOpen size={18} />
            <span className="text-xs font-bold [writing-mode:vertical-rl]">{items.length} từ</span>
          </button>
        )}
      </aside>

      {/* Mobile: nút nổi + danh sách bật lên */}
      <button
        type="button"
        onClick={() => setSheetOpen((o) => !o)}
        aria-label="Danh sách từ trong trang"
        aria-expanded={sheetOpen}
        className="fixed bottom-[72px] right-4 z-30 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-accent text-white shadow-[0_6px_16px_rgba(216,75,107,0.4)] transition active:scale-95 sm:bottom-[88px] sm:right-6 sm:h-12 sm:w-12 lg:hidden"
      >
        <List size={20} />
      </button>

      {sheetOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black/25" onClick={() => setSheetOpen(false)} aria-hidden />
          <div
            role="dialog"
            aria-label="Danh sách từ trong trang"
            className="fixed inset-x-3 bottom-4 z-50 flex max-h-[70vh] flex-col rounded-lg border border-[#e5e5e5] bg-white p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] sm:inset-x-auto sm:right-6 sm:w-80"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              {heading}
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Đóng danh sách từ"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition hover:bg-page hover:text-ink"
              >
                <X size={18} />
              </button>
            </div>
            <div className="-mx-1 min-h-0 overflow-y-auto px-1">{list}</div>
          </div>
        </div>
      )}
    </>
  );
}
