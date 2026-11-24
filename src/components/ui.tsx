"use client";

import { Loader2, Volume2 } from "lucide-react";
import { speakWord } from "@/lib/speech";

/** Hiển thị chuỗi có thẻ HTML đơn giản từ dữ liệu bài học (nguồn nội bộ, đáng tin). */
export function Rich({ html, as: Tag = "span", className = "" }: { html: string; as?: "span" | "div" | "p"; className?: string }) {
  return <Tag className={`rich ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function SpeakButton({
  text,
  onSpeak,
  size = 22,
  className = "",
  label = "Nghe phát âm",
}: {
  text: string;
  onSpeak?: () => void;
  size?: number;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (onSpeak) onSpeak();
        else speakWord(text);
      }}
      title={label}
      aria-label={label}
      className={`inline-flex cursor-pointer items-center justify-center rounded-full p-1.5 align-middle text-link transition hover:bg-link/10 active:scale-95 ${className}`}
    >
      <Volume2 size={size} strokeWidth={2.2} />
    </button>
  );
}

export function LoadingBlock({ label = "Đang tải dữ liệu…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-base text-muted">
      <Loader2 className="animate-spin" size={22} />
      {label}
    </div>
  );
}

export function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="my-6 rounded-lg border border-danger/30 bg-danger/5 px-5 py-4 text-base text-danger">
      {message}
    </div>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <span className="text-base italic text-[#999]">{children}</span>;
}
