"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DatabaseZap, Loader2, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { clearAppCache } from "@/lib/data";
import { getUnsavedAnswers } from "@/lib/unsaved-work";

type Props = {
  open: boolean;
  onClose: () => void;
};

/** Hộp thoại Cài đặt mở từ menu tài khoản. */
export default function SettingsDialog({ open, onClose }: Props) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [clearing, setClearing] = useState(false);
  const [unsaved, setUnsaved] = useState(0);

  useEffect(() => {
    if (!open) return;
    setUnsaved(getUnsavedAnswers());
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open]);

  async function handleClear() {
    setClearing(true);
    try {
      await clearAppCache(); // thành công thì trang tự tải lại
    } catch {
      setClearing(false);
      toast.error("Chưa xoá được bộ nhớ đệm. Vui lòng thử lại.");
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 sm:items-center">
      <div className="fade-in absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="slide-down relative mt-10 w-full max-w-md overflow-hidden rounded-lg bg-surface shadow-[0_20px_50px_rgba(0,0,0,0.25)] sm:mt-0"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5">
          <h2 id={titleId} className="text-lg font-bold text-ink">
            Cài đặt
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng cài đặt"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-contrast/5 hover:text-ink"
          >
            <X size={20} />
          </button>
        </div>

        <section className="p-4 sm:p-5" aria-labelledby={`${titleId}-cache`}>
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand/10 text-brand">
              <DatabaseZap size={20} />
            </span>
            <div className="min-w-0">
              <h3 id={`${titleId}-cache`} className="text-base font-bold text-ink">
                Bộ nhớ đệm
              </h3>
              <p className="mt-0.5 text-[15px] leading-relaxed text-subtle">
                Xoá dữ liệu bài học đã lưu tạm (từ điển, hội thoại, đề thi) và tải lại bản mới nhất. Dùng khi nội dung vừa được cập
                nhật mà trang vẫn hiện bản cũ. Bạn vẫn giữ đăng nhập và lựa chọn giao diện.
              </p>
            </div>
          </div>

          {unsaved > 0 && (
            <p className="mt-3 flex gap-2 rounded-md bg-gold/10 px-3 py-2 text-sm text-ink">
              <TriangleAlert size={17} className="mt-0.5 shrink-0 text-gold" />
              Bạn còn {unsaved} câu đã chọn đáp án nhưng chưa nộp. Trang sẽ tải lại nên các đáp án này sẽ bị xoá.
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleClear}
              disabled={clearing}
              className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-brand px-4 py-2 text-[15px] font-semibold text-white transition hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70"
            >
              {clearing ? <Loader2 size={17} className="animate-spin" /> : <DatabaseZap size={17} />}
              {clearing ? "Đang xoá…" : "Xoá bộ nhớ đệm"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
