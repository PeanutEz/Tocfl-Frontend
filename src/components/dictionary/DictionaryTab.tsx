"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, SearchX } from "lucide-react";
import type { Word } from "@/lib/types";
import { ErrorBlock } from "../ui";
import Pagination from "./Pagination";
import WordCard from "./WordCard";
import WordCardSkeleton from "./WordCardSkeleton";

const PAGE_SIZE = 10;
const PAGE_LOADING_MS = 450;

type Props = {
  state: { data: Word[] | null; error: Error | null };
  items: Word[];
  page: number;
  onPageChange: (page: number) => void;
};

/** Màn hình chờ: thanh trạng thái + vài thẻ khung xương. */
function PageLoading({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite">
      <div className="relative mt-1 h-1 overflow-hidden rounded-full bg-accent/15">
        <div className="loading-bar absolute inset-y-0 w-1/3 rounded-full bg-accent" />
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-muted">
        <Loader2 size={16} className="animate-spin text-accent" />
        {label}
      </div>
      <WordCardSkeleton />
      <WordCardSkeleton />
    </div>
  );
}

export default function DictionaryTab({ state, items, page, onPageChange }: Props) {
  const [pending, setPending] = useState<number | null>(null);
  const listRef = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Kết quả tìm kiếm thay đổi thì bỏ lượt chuyển trang đang chờ
  useEffect(() => {
    clearTimeout(timer.current);
    setPending(null);
  }, [items]);

  if (state.error) return <ErrorBlock message="Không tải được dữ liệu từ vựng. Vui lòng tải lại trang." />;
  if (!state.data) return <PageLoading label="Đang tải từ vựng…" />;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-base text-muted">
        <SearchX size={36} />
        Không tìm thấy từ phù hợp. Thử gõ chữ Hán, pinyin, âm Hán Việt hoặc nghĩa tiếng Việt (có hoặc không dấu).
      </div>
    );
  }

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = items.slice(start, start + PAGE_SIZE);

  // Chuyển trang: hiện màn hình chờ ngay đầu danh sách (dưới thanh tìm kiếm) thay vì nhảy lên đầu trang
  const goTo = (p: number) => {
    if (p === page || pending !== null) return;
    setPending(p);
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    timer.current = setTimeout(() => {
      onPageChange(p);
      setPending(null);
    }, PAGE_LOADING_MS);
  };

  return (
    <section ref={listRef} className="scroll-mt-24 sm:scroll-mt-32">
      {pending !== null ? (
        <PageLoading label={`Đang tải trang ${pending}/${totalPages}…`} />
      ) : (
        <>
          <p className="text-right text-sm text-muted">
            {items.length.toLocaleString("vi-VN")} từ
            {totalPages > 1 && ` · Trang ${page}/${totalPages}`}
          </p>
          <div className="page-enter">
            {pageItems.map((item, i) => (
              <WordCard key={`${start + i}-${item.word}`} item={item} />
            ))}
          </div>
        </>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={goTo} pending={pending} />
    </section>
  );
}
