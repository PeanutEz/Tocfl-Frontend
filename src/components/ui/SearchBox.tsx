"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Search, X } from "lucide-react";

export type Suggestion = {
  key: string;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  onSelect: () => void;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  /** Bấm nút X: xoá kết quả nhưng không tính là một lượt tra (không ghi tracking). */
  onClear?: () => void;
  suggestions: Suggestion[];
  placeholder: string;
  /** Nút đổi chiều tra (vd Trung → Việt / Việt → Trung) ở đầu ô tìm kiếm. */
  direction?: { from: string; to: string; label: string; onToggle: () => void };
};

export default function SearchBox({ value, onChange, onSubmit, onClear, suggestions, placeholder, direction }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => setActive(-1), [suggestions]);

  const showList = open && value.trim() !== "" && suggestions.length > 0;

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" && showList) {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && showList) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      setOpen(false);
      if (showList && active >= 0) suggestions[active].onSelect();
      else onSubmit(value);
    }
  }

  return (
    <div ref={wrapRef} className="relative mx-auto w-full max-w-[700px]">
      <div className="flex items-center gap-2 rounded-md bg-white px-4 py-1.5 shadow-[0_4px_10px_rgba(0,0,0,0.1)] sm:gap-3 sm:px-4 sm:py-1.5">
        {direction && (
          <button
            type="button"
            onClick={() => {
              direction.onToggle();
              inputRef.current?.focus();
              setOpen(true);
            }}
            aria-label={`${direction.label}. Bấm để đổi chiều tra`}
            title="Đổi chiều tra"
            className="-ml-2 flex shrink-0 cursor-pointer items-center gap-1 rounded-md bg-brand/10 px-2 py-1.5 text-sm font-bold text-brand transition hover:bg-brand/15 active:scale-95 sm:-ml-1 sm:gap-1.5 sm:px-2.5"
          >
            <span className="w-[2.6em] text-center">{direction.from}</span>
            <ArrowLeftRight size={15} className="shrink-0" />
            <span className="w-[2.6em] text-center">{direction.to}</span>
          </button>
        )}
        {direction && <span aria-hidden className="h-6 w-px shrink-0 bg-[#e2e2e2]" />}
        <Search size={20} aria-hidden className="shrink-0 text-muted" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full min-w-0 bg-transparent py-1 text-base text-ink outline-none placeholder:text-[#999] [&::-webkit-search-cancel-button]:hidden"
          role="combobox"
          aria-expanded={showList}
          aria-autocomplete="list"
        />
        {value && (
          <button
            type="button"
            aria-label="Xoá từ khoá"
            onClick={() => {
              onChange("");
              onClear?.();
            }}
            className="cursor-pointer rounded-full p-1 text-muted hover:bg-page hover:text-ink"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {showList && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 sm:left-4 sm:right-4 max-h-[300px] overflow-y-auto rounded-lg border border-[#ddd] bg-white text-left shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.key}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setOpen(false);
                s.onSelect();
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between gap-4 border-b border-[#eee] px-4 py-2.5 text-base text-[#333] last:border-0 ${
                i === active ? "bg-[#f9f9f9] text-accent" : ""
              }`}
            >
              <span className="min-w-0 truncate">{s.primary}</span>
              {s.secondary && <span className="shrink-0 text-sm text-[#666]">{s.secondary}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
