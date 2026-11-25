"use client";

import { useEffect, useRef, useState } from "react";
import { PenLine, Puzzle, Search, X } from "lucide-react";
import type { RadicalEntry } from "@/lib/radicals";
import HandwritingPad from "./HandwritingPad";
import RadicalPicker from "./RadicalPicker";

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
  /** Nút đổi chiều tra cn / vi ở cuối ô tìm kiếm. */
  direction?: { active: "zh" | "vi"; label: string; onToggle: () => void };
  /** Bật nút vẽ chữ và tra bộ thủ; chữ chọn được sẽ chèn vào ô tìm kiếm. */
  charTools?: { radicals: RadicalEntry[]; onInsert: (char: string) => void };
};

type Tool = "draw" | "radical" | null;

function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition active:scale-95 ${
        active ? "bg-brand/10 text-brand" : "text-ink hover:bg-page"
      }`}
    >
      {children}
    </button>
  );
}

export default function SearchBox({ value, onChange, onSubmit, onClear, suggestions, placeholder, direction, charTools }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [tool, setTool] = useState<Tool>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setTool(null);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (!tool) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setTool(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [tool]);

  useEffect(() => setActive(-1), [suggestions]);

  // Đang mở bảng vẽ / bộ thủ thì ẩn danh sách gợi ý để không đè lên nhau
  const showList = open && !tool && value.trim() !== "" && suggestions.length > 0;

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

  function toggleTool(next: Exclude<Tool, null>) {
    setTool((t) => (t === next ? null : next));
  }

  return (
    <div ref={wrapRef} className="relative mx-auto w-full max-w-[700px]">
      <div className="flex items-center gap-0.5 rounded-full border border-contrast/5 bg-surface py-1 pl-3.5 pr-1.5 shadow-[0_4px_10px_rgba(0,0,0,0.1)] sm:gap-1 sm:pl-4">
        <Search size={20} aria-hidden className="hidden shrink-0 text-ink sm:block" />
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
          className="w-full min-w-0 bg-transparent py-1.5 text-base text-ink outline-none placeholder:text-faint sm:pl-1.5 [&::-webkit-search-cancel-button]:hidden"
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
            className="shrink-0 cursor-pointer rounded-full p-1 text-muted hover:bg-page hover:text-ink"
          >
            <X size={18} />
          </button>
        )}
        {charTools && (
          <>
            <ToolButton label="Viết tay chữ Hán" active={tool === "draw"} onClick={() => toggleTool("draw")}>
              <PenLine size={19} />
            </ToolButton>
            <ToolButton label="Tra theo bộ thủ" active={tool === "radical"} onClick={() => toggleTool("radical")}>
              <Puzzle size={19} />
            </ToolButton>
          </>
        )}
        {direction && (
          <button
            type="button"
            onClick={() => {
              direction.onToggle();
              setOpen(true);
            }}
            aria-label={`${direction.label}. Bấm để đổi chiều tra`}
            title="Đổi chiều tra"
            className="ml-0.5 flex shrink-0 cursor-pointer items-center rounded-full border border-contrast/10 p-0.5 text-sm font-semibold transition hover:border-contrast/20 active:scale-95"
          >
            {(["zh", "vi"] as const).map((lang) => (
              <span
                key={lang}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  direction.active === lang ? "bg-brand text-white" : "text-ink"
                }`}
              >
                {lang === "zh" ? "cn" : "vi"}
              </span>
            ))}
          </button>
        )}
      </div>

      {tool && charTools && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-contrast/10 bg-surface text-left shadow-[0_8px_20px_rgba(0,0,0,0.15)]">
          {tool === "draw" ? (
            <HandwritingPad onPick={charTools.onInsert} onClose={() => setTool(null)} />
          ) : (
            <RadicalPicker
              entries={charTools.radicals}
              onPick={(ch) => {
                charTools.onInsert(ch);
                setTool(null);
                setOpen(true);
              }}
              onClose={() => setTool(null)}
            />
          )}
        </div>
      )}

      {showList && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 sm:left-4 sm:right-4 max-h-[300px] overflow-y-auto rounded-lg border border-line bg-surface text-left shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
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
              className={`flex cursor-pointer items-center justify-between gap-4 border-b border-line px-4 py-2.5 text-base text-ink last:border-0 ${
                i === active ? "bg-soft text-accent" : ""
              }`}
            >
              <span className="min-w-0 truncate">{s.primary}</span>
              {s.secondary && <span className="shrink-0 text-sm text-subtle">{s.secondary}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
