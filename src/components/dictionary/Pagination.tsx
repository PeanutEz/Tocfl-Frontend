"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  /** Trang đang được tải (khoá các nút cho tới khi xong). */
  pending?: number | null;
};

/** Hiện trang đầu, trang cuối và 2 trang mỗi bên trang hiện tại; phần còn lại thay bằng "…". */
function pageItems(page: number, total: number): (number | "gap")[] {
  const items: (number | "gap")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= page - 2 && i <= page + 2)) items.push(i);
    else if (i === page - 3 || i === page + 3) items.push("gap");
  }
  return items;
}

export default function Pagination({ page, totalPages, onChange, pending = null }: Props) {
  if (totalPages <= 1) return null;

  const busy = pending !== null;
  const active = pending ?? page;
  const base =
    "inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-md border border-accent px-3 text-base font-bold transition enabled:cursor-pointer disabled:cursor-not-allowed";
  const idle = "bg-white text-accent enabled:hover:bg-[#ffe6eb] disabled:opacity-50";

  return (
    <nav className="my-8 flex flex-wrap items-center justify-center gap-2" aria-label="Phân trang" aria-busy={busy}>
      <button type="button" className={`${base} ${idle}`} disabled={busy || page === 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft size={18} /> Trước
      </button>
      {pageItems(active, totalPages).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-current={item === active ? "page" : undefined}
            disabled={busy}
            onClick={() => onChange(item)}
            className={`${base} ${item === active ? "bg-accent text-white" : idle}`}
          >
            {busy && item === pending ? <Loader2 size={16} className="animate-spin" aria-label="Đang tải" /> : item}
          </button>
        ),
      )}
      <button
        type="button"
        className={`${base} ${idle}`}
        disabled={busy || page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        Sau <ChevronRight size={18} />
      </button>
    </nav>
  );
}
