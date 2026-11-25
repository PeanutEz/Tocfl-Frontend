"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, PanelRightClose, PanelRightOpen, X } from "lucide-react";
import type { Answers } from "./shared";

export type NavItem = { key: string; label: string; group: string; correctAnswer: string };

/** id của khung câu hỏi, dùng chung giữa bảng câu hỏi và đề thi để cuộn tới. */
export const questionDomId = (prefix: string, key: string) => `${prefix}-q-${key}`;

type Props = {
  idPrefix: string;
  items: NavItem[];
  answers: Answers;
  submitted: boolean;
};

/**
 * Bảng ô câu hỏi: bấm một ô để cuộn tới câu đó.
 * Desktop (lg): cột dính bên phải đề, thu gọn / mở rộng được.
 * Màn hình hẹp: nút nổi góc dưới phải, bấm để mở bảng.
 */
export default function QuestionNav({ idPrefix, items, answers, submitted }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);

  const answered = items.filter((it) => answers[it.key]).length;

  // Đánh dấu câu đang nằm giữa màn hình
  useEffect(() => {
    const els = items
      .map((it) => document.getElementById(questionDomId(idPrefix, it.key)))
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
  }, [idPrefix, items]);

  // Đóng bảng trên mobile bằng phím Esc
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  const jump = (key: string) => {
    const el = document.getElementById(questionDomId(idPrefix, key));
    if (!el) return;
    setSheetOpen(false);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.remove("flash");
    void el.offsetWidth; // chạy lại hiệu ứng khi bấm cùng một câu nhiều lần
    el.classList.add("flash");
  };

  const groups = items.reduce<{ name: string; items: NavItem[] }[]>((acc, it) => {
    const last = acc[acc.length - 1];
    if (last && last.name === it.group) last.items.push(it);
    else acc.push({ name: it.group, items: [it] });
    return acc;
  }, []);

  const cellTone = (it: NavItem) => {
    const answer = answers[it.key];
    if (submitted) {
      if (answer === it.correctAnswer) return "border-success bg-success text-white";
      if (answer) return "border-danger bg-danger text-white";
      return "border-danger bg-surface text-danger";
    }
    return answer ? "border-exam bg-exam text-white" : "border-sand bg-surface text-slate-exam hover:border-exam";
  };

  const summary = (
    <p className="text-xs text-muted">
      Đã làm <strong className="text-slate-exam">{answered}</strong>/{items.length} câu
    </p>
  );

  const legend = (
    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-sand-light pt-2 text-xs text-muted">
      {submitted ? (
        <>
          <span className="inline-flex items-center gap-1">
            <i className="h-3 w-3 rounded-sm bg-success" /> Đúng
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="h-3 w-3 rounded-sm bg-danger" /> Sai
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="h-3 w-3 rounded-sm border border-danger bg-surface" /> Bỏ trống
          </span>
        </>
      ) : (
        <>
          <span className="inline-flex items-center gap-1">
            <i className="h-3 w-3 rounded-sm bg-exam" /> Đã chọn
          </span>
          <span className="inline-flex items-center gap-1">
            <i className="h-3 w-3 rounded-sm border border-sand bg-surface" /> Chưa làm
          </span>
        </>
      )}
    </div>
  );

  const grid = (
    <div className="flex flex-col gap-2.5">
      {groups.map((g) => (
        <div key={g.name}>
          <p className="mb-1 text-xs font-semibold text-slate-exam">{g.name}</p>
          <div className="grid grid-cols-5 gap-1.5">
            {g.items.map((it) => {
              const isCurrent = current === questionDomId(idPrefix, it.key);
              return (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => jump(it.key)}
                  aria-label={`Đến câu ${it.label}${answers[it.key] ? `, đã chọn ${answers[it.key]}` : ", chưa làm"}`}
                  aria-current={isCurrent ? "location" : undefined}
                  className={`h-8 cursor-pointer rounded-md border text-sm font-bold tabular-nums transition ${cellTone(it)} ${
                    isCurrent ? "ring-2 ring-link ring-offset-1 ring-offset-cream" : ""
                  }`}
                >
                  {it.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Desktop: cột dính bên phải */}
      <aside
        aria-label="Danh sách câu hỏi"
        className={`sticky top-20 hidden shrink-0 self-start rounded-lg border border-sand-light bg-cream shadow-[0_2px_6px_rgba(0,0,0,0.06)] transition-[width] lg:block ${
          expanded ? "w-60" : "w-11"
        }`}
      >
        {expanded ? (
          <div className="flex max-h-[calc(100vh-6rem)] flex-col p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-exam">Danh sách câu</p>
                {summary}
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Thu gọn danh sách câu"
                title="Thu gọn"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-exam transition hover:bg-sand-light"
              >
                <PanelRightClose size={18} />
              </button>
            </div>
            <div className="-mx-1.5 min-h-0 overflow-y-auto px-1.5 py-1">{grid}</div>
            {legend}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Mở danh sách câu"
            title="Mở danh sách câu"
            className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-lg py-3 text-slate-exam transition hover:bg-sand-light"
          >
            <PanelRightOpen size={18} />
            <span className="text-xs font-bold tabular-nums [writing-mode:vertical-rl]">
              {answered}/{items.length}
            </span>
          </button>
        )}
      </aside>

      {/* Mobile: nút nổi + bảng bật lên */}
      <button
        type="button"
        onClick={() => setSheetOpen((o) => !o)}
        aria-label="Danh sách câu hỏi"
        aria-expanded={sheetOpen}
        className="fixed bottom-[72px] right-4 z-30 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-exam text-white shadow-[0_6px_16px_rgba(168,52,47,0.4)] transition active:scale-95 sm:bottom-[88px] sm:right-6 sm:h-12 sm:w-12 lg:hidden"
      >
        <LayoutGrid size={20} />
      </button>

      {sheetOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black/25" onClick={() => setSheetOpen(false)} aria-hidden />
          <div
            role="dialog"
            aria-label="Danh sách câu hỏi"
            className="fixed inset-x-3 bottom-4 z-50 flex max-h-[70vh] flex-col rounded-lg border border-sand-light bg-cream p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] sm:inset-x-auto sm:right-6 sm:w-80"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-exam">Danh sách câu</p>
                {summary}
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Đóng danh sách câu"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-exam transition hover:bg-sand-light"
              >
                <X size={18} />
              </button>
            </div>
            <div className="-mx-1.5 min-h-0 overflow-y-auto px-1.5 py-1">{grid}</div>
            {legend}
          </div>
        </div>
      )}
    </>
  );
}
