"use client";

import { useMemo } from "react";
import { SearchX } from "lucide-react";
import type { Topic, Word } from "@/types";
import type { AsyncState } from "@/hooks/use-async";
import { ErrorBlock } from "@/components/ui";
import TopicList, { TOPICS_PER_PAGE } from "./TopicList";
import TopicWords, { BackButton } from "./TopicWords";

type Props = {
  topics: AsyncState<Topic[]>;
  words: AsyncState<Word[]>;
  topicId: string | null;
  page: number;
  onPageChange: (page: number) => void;
  onOpenTopic: (id: string | null) => void;
};

/** Khung xương cho danh sách chủ đề lúc đang tải. */
function TopicListSkeleton() {
  return (
    <div role="status" aria-label="Đang tải chủ đề" className="animate-pulse rounded-lg border border-line bg-surface p-3.5 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 w-48 rounded bg-soft-strong" />
          <div className="mt-2 h-4 w-28 rounded bg-soft-strong" />
        </div>
        <div className="h-10 w-[90px] rounded-md bg-soft-strong" />
      </div>
      <div className="mt-4 h-[84px] rounded-lg bg-soft" />
      <div className="mt-2.5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-16 rounded-lg bg-soft" />
        ))}
      </div>
    </div>
  );
}

function WordGridSkeleton() {
  return (
    <div role="status" aria-label="Đang tải từ vựng" className="grid animate-pulse grid-cols-1 gap-2.5 md:grid-cols-2">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="rounded-lg border border-line bg-surface px-4 py-3">
          <div className="h-6 w-24 rounded bg-soft-strong" />
          <div className="mt-2 h-4 w-40 rounded bg-soft-strong" />
          <div className="mt-2 h-4 w-56 rounded bg-soft-strong" />
        </div>
      ))}
    </div>
  );
}

export default function TopicTab({ topics, words, topicId, page, onPageChange, onOpenTopic }: Props) {
  // Tra nhanh mọi mục từ điển theo `word` (một chữ có thể có nhiều mục, mỗi mục một nghĩa)
  const byWord = useMemo(() => {
    const map = new Map<string, Word[]>();
    for (const w of words.data ?? []) {
      const list = map.get(w.word);
      if (list) list.push(w);
      else map.set(w.word, [w]);
    }
    return map;
  }, [words.data]);

  const entriesOf = useMemo(() => {
    const cache = new Map<string, Word[]>();
    for (const t of topics.data ?? []) cache.set(t.id, t.words.flatMap((w) => byWord.get(w) ?? []));
    return cache;
  }, [topics.data, byWord]);

  const counts = useMemo(() => new Map([...entriesOf].map(([id, list]) => [id, list.length])), [entriesOf]);

  if (topics.error || words.error) return <ErrorBlock message="Không tải được dữ liệu chủ đề. Vui lòng tải lại trang." />;

  if (!topicId) {
    if (!topics.data || !words.data) return <TopicListSkeleton />;
    if (topics.data.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-base text-muted">
          <SearchX size={36} />
          Chưa có chủ đề nào.
        </div>
      );
    }
    return (
      <TopicList
        topics={topics.data}
        counts={counts}
        page={page}
        onPageChange={onPageChange}
        onOpen={(t) => {
          onOpenTopic(t.id);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  const back = () => {
    onOpenTopic(null);
    window.scrollTo({ top: 0 });
  };

  if (!topics.data || !words.data) {
    return (
      <>
        <div className="mb-4">
          <BackButton onClick={back} />
        </div>
        <WordGridSkeleton />
      </>
    );
  }

  const topic = topics.data.find((t) => t.id === topicId);
  if (!topic) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center text-base text-muted">
        <SearchX size={36} />
        Không tìm thấy chủ đề này. Có thể đường dẫn đã cũ.
        <BackButton onClick={back} />
      </div>
    );
  }

  return <TopicWords key={topic.id} topic={topic} items={entriesOf.get(topic.id) ?? []} onBack={back} />;
}

/** Trang (trong danh sách chủ đề) chứa chủ đề `id`, để quay về đúng chỗ. */
export function pageOfTopic(topics: Topic[] | null, id: string): number {
  const i = topics?.findIndex((t) => t.id === id) ?? -1;
  return i < 0 ? 1 : Math.floor(i / TOPICS_PER_PAGE) + 1;
}
