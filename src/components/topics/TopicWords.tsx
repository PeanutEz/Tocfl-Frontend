"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { Topic, Word } from "@/types";
import { glossesOf } from "@/lib/text";
import { EmptyNote } from "@/components/ui";
import WordDialog from "./WordDialog";

type Props = {
  topic: Topic;
  items: Word[];
  onBack: () => void;
};

/** Nghĩa ngắn cho thẻ: bỏ phần "Danh từ:" và ghi chú trong ngoặc. */
function shortMeaning(item: Word): string {
  const glosses = glossesOf(item.explanation);
  return glosses.length ? glosses.join(", ") : item.explanation.replace(/<[^>]+>/g, " ");
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md bg-soft-strong py-2 pl-2 pr-3 text-[15px] font-semibold text-ink transition hover:bg-contrast/10"
    >
      <ChevronLeft size={18} />
      Trở về
    </button>
  );
}

export default function TopicWords({ topic, items, onBack }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section aria-labelledby="topic-words-title">
      <div className="mb-3 grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:mb-4">
        <BackButton onClick={onBack} />
        <div className="min-w-0 text-center">
          <h2 id="topic-words-title" className="truncate text-xl font-bold text-ink sm:text-2xl">
            {topic.name}
          </h2>
          <p className="text-sm text-muted">{items.length} từ</p>
        </div>
        {/* Cân đối với nút Trở về để tiêu đề nằm giữa */}
        <span className="invisible" aria-hidden>
          <BackButton onClick={() => {}} />
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface p-5 text-center">
          <EmptyNote>Chủ đề này chưa có từ nào trong từ điển.</EmptyNote>
        </div>
      ) : (
        <ul className="page-enter grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {items.map((item, i) => (
            <li key={`${i}-${item.word}`}>
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                aria-haspopup="dialog"
                className="block h-full w-full cursor-pointer rounded-lg border border-line bg-surface px-3.5 py-2.5 text-left shadow-[0_2px_6px_rgba(0,0,0,0.04)] transition hover:border-line-strong hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] active:scale-[0.99] sm:px-4 sm:py-3"
              >
                <span className="block text-[1.25em] font-semibold leading-snug text-ink">{item.word}</span>
                <span className="block text-[0.85em] text-muted">
                  {item.pinyin}
                  {item.hanViet && <span className="ml-2">[{item.hanViet}]</span>}
                </span>
                <span className="mt-0.5 block text-[0.95em] text-ink">{shortMeaning(item)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <WordDialog items={items} index={openIndex} onIndexChange={setOpenIndex} />
    </section>
  );
}
