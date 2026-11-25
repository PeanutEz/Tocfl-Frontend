"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import type { RadicalEntry } from "@/lib/radicals";

type Props = {
  entries: RadicalEntry[];
  onPick: (char: string) => void;
  onClose: () => void;
};

const cell =
  "flex aspect-square cursor-pointer items-center justify-center rounded-md bg-page text-xl text-ink transition hover:bg-brand/10 hover:text-brand sm:text-2xl";

/** Bảng bộ thủ xếp theo số nét; chọn bộ thì hiện các chữ trong từ điển có bộ đó. */
export default function RadicalPicker({ entries, onPick, onClose }: Props) {
  const [selected, setSelected] = useState<RadicalEntry | null>(null);

  // Chèn ô số nét trước nhóm bộ thủ đầu tiên có số nét đó
  const items = useMemo(() => {
    const out: ({ kind: "head"; strokes: number } | { kind: "rad"; entry: RadicalEntry })[] = [];
    let last = 0;
    for (const entry of entries) {
      if (entry.radical.strokes !== last) {
        last = entry.radical.strokes;
        out.push({ kind: "head", strokes: last });
      }
      out.push({ kind: "rad", entry });
    }
    return out;
  }, [entries]);

  return (
    <div>
      <div className="flex items-center gap-2 px-4 pt-3">
        {selected && (
          <button
            type="button"
            onClick={() => setSelected(null)}
            aria-label="Quay lại bảng bộ thủ"
            className="-ml-1.5 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink transition hover:bg-contrast/5"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        <h3 className="text-base font-bold text-ink">
          {selected ? (
            <>
              Bộ {selected.radical.char}
              {selected.radical.variant && ` (${selected.radical.variant})`}
              <span className="ml-2 text-sm font-normal text-muted">{selected.chars.length} chữ trong từ điển</span>
            </>
          ) : (
            "Tra cứu bộ thủ"
          )}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng bảng bộ thủ"
          className="ml-auto inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-contrast/5 hover:text-ink"
        >
          <X size={18} />
        </button>
      </div>

      <div className="max-h-[min(55vh,420px)] overflow-y-auto px-4 pb-4 pt-3">
        {selected ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1.5">
            {selected.chars.map((ch) => (
              <button key={ch} type="button" onClick={() => onPick(ch)} className={cell}>
                {ch}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1.5">
            {items.map((item) =>
              item.kind === "head" ? (
                <span
                  key={`h${item.strokes}`}
                  aria-label={`${item.strokes} nét`}
                  className="flex aspect-square items-center justify-center rounded-md bg-brand text-base font-bold text-white"
                >
                  {item.strokes}
                </span>
              ) : (
                <button
                  key={item.entry.radical.index}
                  type="button"
                  onClick={() => setSelected(item.entry)}
                  title={`Bộ ${item.entry.radical.char}: ${item.entry.chars.length} chữ`}
                  className={`${cell} relative`}
                >
                  {item.entry.radical.char}
                  {item.entry.radical.variant && (
                    <span className="absolute right-0.5 top-0 text-[11px] leading-tight text-muted">{item.entry.radical.variant}</span>
                  )}
                </button>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
