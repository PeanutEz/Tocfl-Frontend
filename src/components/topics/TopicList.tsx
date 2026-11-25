"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Topic } from "@/types";
import { topicIcon } from "./topic-icons";

// Mỗi trang: 1 chủ đề nổi bật + 8 chủ đề dạng lưới (2 cột mobile, 4 cột desktop)
export const TOPICS_PER_PAGE = 9;

type Props = {
  topics: Topic[];
  counts: Map<string, number>;
  page: number;
  onPageChange: (page: number) => void;
  onOpen: (topic: Topic) => void;
};

export default function TopicList({ topics, counts, page, onPageChange, onOpen }: Props) {
  const totalPages = Math.max(1, Math.ceil(topics.length / TOPICS_PER_PAGE));
  const current = Math.min(Math.max(page, 1), totalPages);
  const pageTopics = topics.slice((current - 1) * TOPICS_PER_PAGE, current * TOPICS_PER_PAGE);
  const [featured, ...rest] = pageTopics;

  return (
    <section aria-labelledby="topic-list-title" className="rounded-lg border border-line bg-surface p-3.5 shadow-[0_5px_15px_rgba(0,0,0,0.05)] sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
        <div className="min-w-0">
          <h2 id="topic-list-title" className="text-xl font-bold text-ink sm:text-2xl">
            Từ vựng theo chủ đề
          </h2>
          <p className="text-sm text-muted">
            {topics.length} chủ đề · Trang {current}/{totalPages}
          </p>
        </div>
        <div className="flex shrink-0 overflow-hidden rounded-md bg-soft-strong">
          <button
            type="button"
            onClick={() => onPageChange(current - 1)}
            disabled={current <= 1}
            aria-label="Trang chủ đề trước"
            className="flex h-10 w-11 cursor-pointer items-center justify-center text-ink transition hover:bg-contrast/10 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronLeft size={22} />
          </button>
          <span className="w-px bg-line-strong/60" aria-hidden />
          <button
            type="button"
            onClick={() => onPageChange(current + 1)}
            disabled={current >= totalPages}
            aria-label="Trang chủ đề sau"
            className="flex h-10 w-11 cursor-pointer items-center justify-center text-ink transition hover:bg-contrast/10 disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>

      <div key={current} className="page-enter">
        {featured && <FeaturedCard topic={featured} count={counts.get(featured.id) ?? 0} onOpen={onOpen} />}
        <ul className="mt-2.5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {rest.map((topic) => (
            <li key={topic.id}>
              <TopicCard topic={topic} count={counts.get(topic.id) ?? 0} onOpen={onOpen} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FeaturedCard({ topic, count, onOpen }: { topic: Topic; count: number; onOpen: (t: Topic) => void }) {
  const Icon = topicIcon(topic.icon);
  return (
    <button
      type="button"
      onClick={() => onOpen(topic)}
      className="flex w-full cursor-pointer items-center gap-3.5 rounded-lg bg-soft p-3.5 text-left transition hover:bg-soft-strong active:scale-[0.99] sm:gap-4 sm:p-4"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-brand text-white sm:h-16 sm:w-16">
        <Icon size={30} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold leading-snug text-ink sm:text-xl">{topic.name}</span>
        <span className="block text-base text-muted">Tổng cộng: {count} từ</span>
      </span>
      <ChevronRight size={20} className="shrink-0 text-faint" aria-hidden />
    </button>
  );
}

function TopicCard({ topic, count, onOpen }: { topic: Topic; count: number; onOpen: (t: Topic) => void }) {
  const Icon = topicIcon(topic.icon);
  return (
    <button
      type="button"
      onClick={() => onOpen(topic)}
      className="flex h-full w-full cursor-pointer items-center gap-2.5 rounded-lg bg-soft p-3 text-left transition hover:bg-soft-strong active:scale-[0.98] sm:gap-3"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand/10 text-brand">
        <Icon size={20} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-snug text-ink sm:text-base">{topic.name}</span>
        <span className="block text-xs text-muted sm:text-sm">{count} từ</span>
      </span>
    </button>
  );
}
