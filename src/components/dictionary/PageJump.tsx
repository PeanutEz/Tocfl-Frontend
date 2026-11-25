"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type Props = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled?: boolean;
};

/** Ô gõ số trang (Enter để tới) kèm nút trang trước / trang sau, đặt ở đầu danh sách từ. */
export default function PageJump({ page, totalPages, onChange, disabled = false }: Props) {
  const [value, setValue] = useState(String(page));

  // Trang đổi từ chỗ khác (nút phân trang dưới cùng, tìm kiếm) thì cập nhật lại ô nhập
  useEffect(() => setValue(String(page)), [page]);

  function submit() {
    const n = parseInt(value, 10);
    if (!Number.isFinite(n) || n < 1 || n > totalPages) {
      toast.info(`Trang không hợp lệ. Gõ số từ 1 đến ${totalPages}.`);
      setValue(String(page));
      return;
    }
    if (n !== page) onChange(n);
  }

  const btn =
    "flex h-8 w-8 items-center justify-center rounded-md text-ink transition enabled:cursor-pointer enabled:hover:bg-contrast/10 disabled:cursor-not-allowed disabled:opacity-30";

  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onChange(page - 1)} disabled={disabled || page <= 1} aria-label="Trang trước" className={btn}>
        <ChevronLeft size={18} />
      </button>
      <label className="flex items-center gap-1.5">
        <span>Trang</span>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") setValue(String(page));
          }}
          onBlur={() => setValue(String(page))}
          onFocus={(e) => e.target.select()}
          aria-label={`Số trang, từ 1 đến ${totalPages}. Nhấn Enter để chuyển`}
          title="Gõ số trang rồi nhấn Enter"
          className="h-8 w-12 rounded-md border border-line-strong bg-surface px-1 text-center text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
        />
        <span>/ {totalPages}</span>
      </label>
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={disabled || page >= totalPages}
        aria-label="Trang sau"
        className={btn}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
