"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, FileText } from "lucide-react";

export type ExamGroup = { band: string; exams: { id: string; name: string; ready: boolean }[] };

type Props = {
  groups: ExamGroup[];
  value: string;
  onChange: (id: string) => void;
};

/** Ô chọn đề thi: nút hiện đề đang chọn, bấm mở danh sách đề chia theo Band. */
export default function ExamSelect({ groups, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(value);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const optionId = (id: string) => `${listId}-${id}`;

  const enabled = groups.flatMap((g) => g.exams.filter((e) => e.ready).map((e) => e.id));
  const currentGroup = groups.find((g) => g.exams.some((e) => e.id === value));
  const current = currentGroup?.exams.find((e) => e.id === value);

  useEffect(() => {
    if (!open) return;
    setActive(value);
    listRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, value]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const choose = (id: string) => {
    close();
    if (id !== value) onChange(id);
  };

  const onListKey = (e: React.KeyboardEvent) => {
    const i = enabled.indexOf(active);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = enabled[(i + (e.key === "ArrowDown" ? 1 : -1) + enabled.length) % enabled.length];
      setActive(next);
      document.getElementById(optionId(next))?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      setActive(e.key === "Home" ? enabled[0] : enabled[enabled.length - 1]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      close();
    }
  };

  return (
    <div ref={wrapRef} className="relative w-full sm:w-80">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`Chọn đề thi, đang chọn ${currentGroup?.band ?? ""} ${current?.name ?? ""}`}
        className={`flex w-full cursor-pointer items-center gap-3 rounded-md border bg-surface px-3 py-2 text-left shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition hover:border-exam ${
          open ? "border-exam ring-2 ring-exam/15" : "border-sand"
        }`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-exam/10 text-exam">
          <FileText size={18} />
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block text-xs font-semibold uppercase tracking-wide text-muted">{currentGroup?.band}</span>
          <span className="block truncate text-base font-bold text-slate-exam">{current?.name}</span>
        </span>
        <ChevronDown size={18} className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label="Danh sách đề thi"
          aria-activedescendant={optionId(active)}
          onKeyDown={onListKey}
          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-80 overflow-y-auto rounded-lg border border-sand-light bg-surface p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.16)] outline-none"
        >
          {groups.map((g) => (
            <li key={g.band} role="presentation">
              <p className="px-2.5 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">{g.band}</p>
              <ul role="group" aria-label={g.band}>
                {g.exams.map((e) => {
                  const selected = e.id === value;
                  const highlighted = e.id === active && e.ready;
                  return (
                    <li
                      key={e.id}
                      id={optionId(e.id)}
                      role="option"
                      aria-selected={selected}
                      aria-disabled={!e.ready}
                      onClick={() => e.ready && choose(e.id)}
                      onMouseEnter={() => e.ready && setActive(e.id)}
                      className={`flex items-center gap-2 rounded-md px-2.5 py-2 text-[15px] ${
                        e.ready ? "cursor-pointer text-slate-exam" : "cursor-not-allowed text-muted"
                      } ${highlighted ? "bg-paper" : ""} ${selected ? "font-bold text-exam" : ""}`}
                    >
                      <span className="min-w-0 flex-1 truncate">{e.name}</span>
                      {!e.ready && (
                        <span className="shrink-0 rounded bg-page px-1.5 py-0.5 text-xs font-medium text-muted">Sắp ra mắt</span>
                      )}
                      {selected && <Check size={16} className="shrink-0" />}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
