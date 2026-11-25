"use client";

import { useEffect, useId, useRef } from "react";
import { TriangleAlert } from "lucide-react";

type Props = {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Hộp thoại xác nhận trước một thao tác làm mất dữ liệu. Esc hoặc bấm ra ngoài là huỷ. */
export default function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel = "Huỷ", onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descId = useId();
  // Giữ hàm huỷ mới nhất mà không chạy lại effect (tránh giật focus mỗi lần render)
  const cancelFn = useRef(onCancel);
  useEffect(() => {
    cancelFn.current = onCancel;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelFn.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="fade-in absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="slide-down relative w-full max-w-md rounded-lg bg-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.25)] sm:p-5"
      >
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
            <TriangleAlert size={20} />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-bold text-ink">
              {title}
            </h2>
            <div id={descId} className="mt-1 text-[15px] leading-relaxed text-[#555]">
              {description}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="cursor-pointer rounded-md border border-[#ccc] bg-white px-4 py-2 text-[15px] font-semibold text-ink transition hover:bg-page"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="cursor-pointer rounded-md bg-exam px-4 py-2 text-[15px] font-semibold text-white transition hover:bg-brand-dark"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
