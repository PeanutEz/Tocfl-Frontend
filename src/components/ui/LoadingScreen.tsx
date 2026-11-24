"use client";

import { useEffect, useState } from "react";
import { STUDY_QUOTES, type Quote } from "@/lib/quotes";

/**
 * Màn hình chờ toàn trang: nền sáng trong, vòng quay màu thương hiệu và một câu cảm hứng
 * học tiếng Trung (tiếng Việt, bên dưới là câu gốc và pinyin).
 */
export default function LoadingScreen({ label = "Đang chuẩn bị bài học…" }: { label?: string }) {
  // Chọn câu ngẫu nhiên sau khi mount để HTML tĩnh và lần render đầu trên trình duyệt giống nhau
  const [quote, setQuote] = useState<Quote | null>(null);
  useEffect(() => {
    setQuote(STUDY_QUOTES[Math.floor(Math.random() * STUDY_QUOTES.length)]);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[radial-gradient(ellipse_at_top,rgba(216,75,107,0.10),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(178,34,34,0.06),transparent_55%)] bg-page/80 px-6 backdrop-blur-sm"
    >
      <div className="flex max-w-lg flex-col items-center text-center">
        <div className="relative mb-7 h-12 w-12" aria-hidden>
          <div className="absolute inset-0 rounded-full border-[3px] border-accent/15" />
          <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-accent" />
        </div>

        <p className="mb-6 text-sm font-medium tracking-wide text-muted">{label}</p>

        {/* Giữ chỗ cố định để khi câu trích dẫn hiện ra, vòng quay không bị đẩy lên */}
        <div className="min-h-[124px]">
          {quote && (
            <figure className="fade-in">
              <blockquote className="text-lg font-medium leading-relaxed text-ink sm:text-xl">“{quote.vi}”</blockquote>
              <p lang="zh-Hant" className="mt-3 font-serif-tc text-xl tracking-wider text-brand sm:text-2xl">
                {quote.zh}
              </p>
              <p className="mt-1 text-sm italic text-muted">{quote.py}</p>
            </figure>
          )}
        </div>
      </div>
    </div>
  );
}
