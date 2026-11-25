"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Info, SearchX } from "lucide-react";
import type { GrammarPoint } from "@/types";
import type { AsyncState } from "@/hooks/use-async";
import { stopSpeaking } from "@/lib/speech";
import { ErrorBlock, Rich, RichLines, SpeakButton } from "@/components/ui";
import { BackButton } from "@/components/topics/TopicWords";

type Props = {
  state: AsyncState<GrammarPoint[]>;
  pointId: string | null;
  onOpen: (id: string | null) => void;
};

const ALL = "all";

function ListSkeleton() {
  return (
    <div role="status" aria-label="Đang tải ngữ pháp" className="animate-pulse rounded-lg border border-line bg-surface p-3.5 sm:p-5">
      <div className="h-6 w-32 rounded bg-soft-strong" />
      <div className="mt-2 h-4 w-48 rounded bg-soft-strong" />
      <div className="mt-4 grid grid-cols-1 gap-2.5 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-[76px] rounded-lg bg-soft" />
        ))}
      </div>
    </div>
  );
}

export default function GrammarTab({ state, pointId, onOpen }: Props) {
  const [level, setLevel] = useState(ALL);
  const points = useMemo(() => state.data ?? [], [state.data]);
  const levels = useMemo(() => [...new Set(points.map((p) => p.level))], [points]);
  const shown = level === ALL ? points : points.filter((p) => p.level === level);

  if (state.error) return <ErrorBlock message="Không tải được dữ liệu ngữ pháp. Vui lòng tải lại trang." />;
  if (!state.data) return <ListSkeleton />;

  const open = (id: string | null) => {
    stopSpeaking();
    onOpen(id);
    window.scrollTo({ top: 0 });
  };

  if (pointId) {
    const index = points.findIndex((p) => p.id === pointId);
    if (index < 0) {
      return (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-base text-muted">
          <SearchX size={36} />
          Không tìm thấy bài ngữ pháp này. Có thể đường dẫn đã cũ.
          <BackButton onClick={() => open(null)} />
        </div>
      );
    }
    return <GrammarDetail key={pointId} points={points} index={index} onOpen={open} />;
  }

  return (
    <section aria-labelledby="grammar-title" className="rounded-lg border border-line bg-surface p-3.5 shadow-[0_5px_15px_rgba(0,0,0,0.05)] sm:p-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2 sm:mb-4">
        <div>
          <h2 id="grammar-title" className="text-xl font-bold text-ink sm:text-2xl">
            Ngữ pháp
          </h2>
          <p className="text-sm text-muted">{shown.length} điểm ngữ pháp</p>
        </div>
        {levels.length > 1 && (
          <div role="radiogroup" aria-label="Lọc theo cấp độ" className="flex gap-1 rounded-md bg-soft p-1">
            {[ALL, ...levels].map((l) => (
              <button
                key={l}
                type="button"
                role="radio"
                aria-checked={level === l}
                onClick={() => setLevel(l)}
                className={`cursor-pointer rounded px-3 py-1 text-sm font-semibold transition ${
                  level === l ? "bg-surface text-brand shadow-sm" : "text-subtle hover:text-ink"
                }`}
              >
                {l === ALL ? "Tất cả" : l.replace("TOCFL ", "")}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mb-3 flex items-start gap-2 rounded-md bg-soft px-3 py-2 text-sm text-subtle">
        <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
        Mục này đang được bổ sung. Hiện có một số bài mẫu, các bài khác sẽ được thêm dần.
      </div>

      {shown.length === 0 ? (
        <p className="py-8 text-center text-base text-muted">Chưa có bài nào ở cấp độ này.</p>
      ) : (
        <ol className="page-enter grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {shown.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => open(p.id)}
                className="flex h-full w-full cursor-pointer items-start gap-3 rounded-lg bg-soft p-3 text-left transition hover:bg-soft-strong active:scale-[0.99]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand/10 text-sm font-bold text-brand">
                  {points.indexOf(p) + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold leading-snug text-ink">{p.title}</span>
                  <span className="mt-0.5 block truncate text-sm text-link">{p.pattern}</span>
                </span>
                <span className="shrink-0 rounded bg-gold px-1.5 py-0.5 text-xs font-bold text-white">{p.level.replace("TOCFL ", "")}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function GrammarDetail({ points, index, onOpen }: { points: GrammarPoint[]; index: number; onOpen: (id: string | null) => void }) {
  const p = points[index];
  const prev = points[index - 1];
  const next = points[index + 1];

  useEffect(() => () => stopSpeaking(), []);

  return (
    <article aria-labelledby="grammar-point-title" className="page-enter">
      <div className="mb-3 grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:mb-4">
        <BackButton onClick={() => onOpen(null)} />
        <p className="text-center text-sm text-muted">
          Bài {index + 1}/{points.length}
        </p>
        <span className="invisible" aria-hidden>
          <BackButton onClick={() => {}} />
        </span>
      </div>

      <div className="rounded-lg border border-line bg-surface p-3.5 shadow-[0_5px_15px_rgba(0,0,0,0.05)] sm:p-5">
        <span className="inline-block rounded bg-gold px-2.5 py-1 text-sm font-bold text-white">{p.level}</span>
        <h2 id="grammar-point-title" className="mt-2 text-2xl font-bold leading-tight text-ink sm:text-3xl">
          {p.title}
        </h2>

        <section className="mt-3 rounded-md border-l-4 border-link bg-link/10 px-3 py-2.5">
          <p className="text-xs font-bold uppercase tracking-wide text-link">Cấu trúc</p>
          <p className="mt-0.5 text-[1.15em] font-semibold text-ink">{p.pattern}</p>
        </section>

        <section className="mt-3 border-l-[5px] border-brand bg-soft p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-brand">Giải thích</p>
          <RichLines html={p.explanation} className="mt-1" />
        </section>

        <section className="mt-3 rounded-md bg-soft p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-link">Ví dụ</p>
          {p.examples.map((ex, i) => (
            <div key={i} className="mt-2 border-b border-dashed border-line-strong pb-2 last:border-0 last:pb-0">
              <div className="text-[1.25em] font-medium text-ink">
                {ex.tc} <SpeakButton text={ex.tc} size={18} />
              </div>
              <div className="text-link">{ex.py}</div>
              <div className="text-subtle">{ex.vn}</div>
            </div>
          ))}
        </section>

        {p.note && (
          <section className="mt-3 flex gap-2 rounded-md border-l-4 border-gold bg-gold/10 p-3">
            <Info size={18} className="mt-0.5 shrink-0 text-gold" aria-hidden />
            <p>
              <strong>Lưu ý:</strong> <Rich html={p.note} />
            </p>
          </section>
        )}
      </div>

      <nav aria-label="Chuyển bài" className="mt-3 grid grid-cols-2 gap-2.5">
        {prev ? (
          <button
            type="button"
            onClick={() => onOpen(prev.id)}
            className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface p-3 text-left transition hover:border-line-strong"
          >
            <ChevronLeft size={18} className="shrink-0 text-muted" />
            <span className="min-w-0">
              <span className="block text-xs text-muted">Bài trước</span>
              <span className="block truncate font-semibold text-ink">{prev.title}</span>
            </span>
          </button>
        ) : (
          <span />
        )}
        {next && (
          <button
            type="button"
            onClick={() => onOpen(next.id)}
            className="col-start-2 flex min-w-0 cursor-pointer items-center justify-end gap-2 rounded-lg border border-line bg-surface p-3 text-right transition hover:border-line-strong"
          >
            <span className="min-w-0">
              <span className="block text-xs text-muted">Bài sau</span>
              <span className="block truncate font-semibold text-ink">{next.title}</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-muted" />
          </button>
        )}
      </nav>
    </article>
  );
}
