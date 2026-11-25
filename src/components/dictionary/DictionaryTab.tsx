"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, SearchX } from "lucide-react";
import type { Word } from "@/types";
import { ErrorBlock } from "@/components/ui";
import LoadingScreen, { LOADING_MIN_MS } from "@/components/ui/LoadingScreen";
import PageJump from "./PageJump";
import Pagination from "./Pagination";
import WordCard from "./WordCard";
import WordCardSkeleton from "./WordCardSkeleton";
import WordNav, { wordDomId } from "./WordNav";

const PAGE_SIZE = 10;
// Thời gian hiện màn hình chờ (kèm câu cảm hứng) mỗi lần chuyển trang
const PAGE_LOADING_MS = LOADING_MIN_MS;

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

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const start = (page - 1) * PAGE_SIZE;
  // Các từ trong trang kèm vị trí trong toàn bộ kết quả (làm id để danh sách bên phải cuộn tới)
  const pageItems = useMemo(
    () => items.slice(start, start + PAGE_SIZE).map((item, i) => ({ index: start + i, item })),
    [items, start],
  );

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
        Không tìm thấy từ phù hợp. Kiểm tra lại từ khoá, hoặc bấm nút Trung ⇄ Việt trong ô tìm kiếm để đổi chiều tra.
      </div>
    );
  }

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
        <>
          {/* Màn hình chờ toàn trang; khung xương bên dưới giữ bố cục khi màn hình chờ đóng lại */}
          <LoadingScreen label={`Đang tải trang ${pending}/${totalPages}…`} />
          <PageLoading label={`Đang tải trang ${pending}/${totalPages}…`} />
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-sm text-muted">
            <span>{items.length.toLocaleString("vi-VN")} từ</span>
            {totalPages > 1 && <PageJump page={page} totalPages={totalPages} onChange={goTo} />}
          </div>
          <div className="lg:flex lg:items-start lg:gap-4">
            <div className="page-enter min-w-0 flex-1">
              {pageItems.map(({ index, item }) => (
                <div key={`${index}-${item.word}`} id={wordDomId(index)} className="scroll-mt-20 sm:scroll-mt-32">
                  <WordCard item={item} />
                </div>
              ))}
            </div>
            <WordNav items={pageItems} page={page} totalPages={totalPages} />
          </div>
        </>
      )}
      <Pagination page={page} totalPages={totalPages} onChange={goTo} pending={pending} />
    </section>
  );
}
