"use client";

import { useEffect, useState } from "react";
import { STUDY_QUOTES, type Quote } from "@/lib/quotes";

/** Thời gian tối thiểu hiện màn hình chờ (khớp một vòng hiệu ứng trong globals.css). */
export const LOADING_MIN_MS = 1750;

// Cùng hình chữ M với icon của web (src/app/icon.svg)
const M_PATH = "M18 46V18h6l8 14 8-14h6v28h-6V29l-8 13-8-13v17z";

/**
 * Màn hình chờ toàn trang: chữ M của web, bên trong có thanh tải chạy qua thân chữ,
 * bên dưới là một câu cảm hứng học tập bằng tiếng Trung kèm pinyin.
 * Nhãn trạng thái chỉ dành cho trình đọc màn hình.
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
      <span className="sr-only">{label}</span>

      <div className="flex max-w-lg flex-col items-center text-center">
        <svg viewBox="17 17 30 30" className="mb-6 h-20 w-20 sm:h-24 sm:w-24" aria-hidden>
          <defs>
            <clipPath id="loading-m-clip">
              <path d={M_PATH} />
            </clipPath>
          </defs>
          {/* Thân chữ nhạt làm nền, thanh tải màu thương hiệu chạy bên trong */}
          <path d={M_PATH} className="fill-brand/15" />
          <g clipPath="url(#loading-m-clip)">
            <rect x="17" y="17" width="30" height="30" className="loading-m-bar fill-brand" />
          </g>
        </svg>

        {/* Giữ chỗ cố định để khi câu trích dẫn hiện ra, chữ M không bị đẩy lên */}
        <div className="min-h-[84px]">
          {quote && (
            <figure className="fade-in">
              <blockquote lang="zh-Hant" className="font-serif-tc text-xl tracking-wider text-brand sm:text-2xl">
                {quote.zh}
              </blockquote>
              <p className="mt-2 text-sm italic text-muted">{quote.py}</p>
            </figure>
          )}
        </div>
      </div>
    </div>
  );
}
