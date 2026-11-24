"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  /** Trang đang được tải (khoá các nút cho tới khi xong). */
  pending?: number | null;
};

/**
 * Danh sách nút trang: trang đầu, trang cuối và `siblings` trang mỗi bên trang hiện tại.
 * Khoảng trống chỉ thiếu đúng một trang thì hiện luôn số đó thay vì "…".
 */
function pageItems(page: number, total: number, siblings: number): (number | "gap")[] {
  const shown = new Set<number>([1, total]);
  for (let i = page - siblings; i <= page + siblings; i++) if (i >= 1 && i <= total) shown.add(i);

  const sorted = [...shown].sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  sorted.forEach((n, i) => {
    const prev = sorted[i - 1];
    if (prev !== undefined) {
      if (n - prev === 2) items.push(prev + 1);
      else if (n - prev > 2) items.push("gap");
    }
    items.push(n);
  });
  return items;
}

export default function Pagination({ page, totalPages, onChange, pending = null }: Props) {
  if (totalPages <= 1) return null;

  const busy = pending !== null;
  const active = pending ?? page;
  const base =
    "inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-md border border-accent px-2 text-[15px] font-bold transition enabled:cursor-pointer disabled:cursor-not-allowed sm:h-10 sm:min-w-10 sm:px-3 sm:text-base";
  const idle = "bg-white text-accent enabled:hover:bg-[#ffe6eb] disabled:opacity-50";

  const renderNumbers = (siblings: number) =>
    pageItems(active, totalPages, siblings).map((item, i) =>
      item === "gap" ? (
        <span key={`gap-${i}`} className="px-0.5 text-muted" aria-hidden>
          …
        </span>
      ) : (
        <button
          key={item}
          type="button"
          aria-current={item === active ? "page" : undefined}
          aria-label={`Trang ${item}`}
          disabled={busy}
          onClick={() => onChange(item)}
          className={`${base} ${item === active ? "bg-accent text-white" : idle}`}
        >
          {busy && item === pending ? <Loader2 size={16} className="animate-spin" aria-label="Đang tải" /> : item}
        </button>
      ),
    );

  return (
    <nav
      className="mb-16 mt-6 flex items-center justify-center gap-1.5 sm:my-8 sm:flex-wrap sm:gap-2"
      aria-label="Phân trang"
      aria-busy={busy}
    >
      <button
        type="button"
        aria-label="Trang trước"
        className={`${base} ${idle}`}
        disabled={busy || page === 1}
        onClick={() => onChange(page - 1)}
      >
        <ChevronLeft size={18} />
        <span className="hidden sm:inline">Trước</span>
      </button>

      {/* Điện thoại: chỉ trang đầu, trang hiện tại, trang cuối để vừa một hàng */}
      <div className="flex items-center gap-1.5 sm:hidden">{renderNumbers(0)}</div>
      {/* Màn hình lớn: thêm 2 trang mỗi bên */}
      <div className="hidden items-center gap-2 sm:flex">{renderNumbers(2)}</div>

      <button
        type="button"
        aria-label="Trang sau"
        className={`${base} ${idle}`}
        disabled={busy || page === totalPages}
        onClick={() => onChange(page + 1)}
      >
        <span className="hidden sm:inline">Sau</span>
        <ChevronRight size={18} />
      </button>
    </nav>
  );
}
