"use client";

import { BookOpenText, Gauge, ListChecks, PencilLine, Play, Square } from "lucide-react";
import type { ChoiceOption, Dialogue } from "@/lib/types";
import { SpeakButton } from "../ui";
import { SPEEDS } from "@/lib/speech";
import ChoiceExercise, { type ExerciseItem } from "./ChoiceExercise";

type Props = {
  id: string;
  dialogue: Dialogue;
  flash: boolean;
  isPlaying: boolean;
  speed: number;
  onPlayAll: () => void;
  onPlayLine: (text: string, gender: string) => void;
  onSpeedChange: (rate: number) => void;
};

const textOf = (v: unknown, key: "zh" | "py" | "vn"): string =>
  v && typeof v === "object" ? ((v as Record<string, string>)[key] ?? "") : key === "zh" ? String(v ?? "") : "";

const optionLabel = (opt: ChoiceOption) => (typeof opt === "object" && opt ? `${opt.zh ?? ""} (${opt.vn ?? ""})` : String(opt ?? ""));

export default function DialogueCard({ id, dialogue: g, flash, isPlaying, speed, onPlayAll, onPlayLine, onSpeedChange }: Props) {
  const clozes: ExerciseItem[] = (g.clozes ?? []).map((c, i) => ({
    prompt: (
      <>
        <div className="text-[22px] font-bold text-ink">
          Câu {i + 1}: {textOf(c.sentence, "zh")}
        </div>
        <div className="my-1 text-lg text-link">{textOf(c.sentence, "py")}</div>
        <div className="text-base italic text-muted">{textOf(c.sentence, "vn")}</div>
      </>
    ),
    options: c.options.map((o) => ({ zh: textOf(o, "zh"), vn: textOf(o, "vn") })),
    correct: c.correct,
  }));

  const quizzes: ExerciseItem[] = (g.quizzes ?? []).map((q) => ({
    prompt: <div className="text-[22px] font-bold text-ink">{textOf(q.question, "zh")}</div>,
    options: q.options.map((o) => ({ zh: optionLabel(o) })),
    correct: q.correct,
  }));

  const reading: ExerciseItem[] = (g.reading?.questions ?? []).map((q, i) => ({
    prompt: (
      <>
        <div className="text-xl font-bold text-ink">
          {i + 1}. {textOf(q.question, "zh")}
        </div>
        {textOf(q.question, "vn") && <div className="mb-2 text-base italic text-muted">{textOf(q.question, "vn")}</div>}
      </>
    ),
    options: q.options.map((o) => ({ zh: optionLabel(o) })),
    correct: q.correct,
  }));

  return (
    <article
      id={id}
      className={`mb-8 scroll-mt-28 rounded-lg bg-white p-3.5 text-left sm:mb-10 sm:scroll-mt-48 shadow-[0_10px_30px_rgba(0,0,0,0.05)] ring-1 ring-[#f0f0f0] sm:p-[30px] ${flash ? "flash" : ""}`}
    >
      <div className="mb-2.5 flex justify-end gap-2">
        {g.level && <span className="rounded bg-danger px-2.5 py-1 text-[13px] font-bold text-white">{g.level}</span>}
        <span className="rounded bg-link px-2.5 py-1 text-[13px] font-bold text-white">{g.lesson}</span>
      </div>

      <h2 className="mb-5 border-b-2 border-[#eee] pb-2.5 text-[22px] font-bold leading-snug text-brand sm:text-[28px]">{g.title}</h2>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-[#e0e0e0] bg-[#f8f9fa] p-3 text-base sm:gap-4 sm:p-4">
        <button
          type="button"
          onClick={onPlayAll}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-md px-5 py-2 font-bold text-white transition ${
            isPlaying ? "bg-[#c0392b] hover:bg-[#a93226]" : "bg-success hover:bg-[#229954]"
          }`}
        >
          {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          {isPlaying ? "Dừng đọc" : "Nghe cả bài"}
        </button>

        <div className="flex w-full flex-wrap items-center gap-2 border-t border-[#ddd] pt-3 sm:w-auto sm:border-l-2 sm:border-t-0 sm:pl-4 sm:pt-0">
          <span className="inline-flex items-center gap-1.5 font-bold text-[#555]">
            <Gauge size={18} /> Tốc độ
          </span>
          {SPEEDS.map((s) => (
            <button
              key={s.rate}
              type="button"
              onClick={() => onSpeedChange(s.rate)}
              aria-pressed={speed === s.rate}
              className={`cursor-pointer rounded-md border px-3 py-1 text-sm transition ${
                speed === s.rate ? "border-ink bg-ink text-white" : "border-[#bdc3c7] bg-white hover:border-ink"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8 space-y-5">
        {g.content.map((line, i) => {
          const male = line.gender === "male";
          // Bài đọc (đoạn văn) không có tên người nói: hiện icon sách, màu trung tính
          const narrator = !line.sp.trim();
          const color = narrator ? "#7f8c8d" : male ? "#3498db" : "#e74c3c";
          return (
            <div key={i} className="flex gap-2.5 sm:gap-4">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold text-white sm:h-10 sm:w-10"
                style={{ background: color }}
                aria-hidden
                title={narrator ? "Bài đọc" : line.sp}
              >
                {narrator ? <BookOpenText size={18} /> : line.sp.charAt(0)}
              </div>
              <div className="min-w-0 grow rounded-lg border-l-4 bg-[#f8f9fa] px-3 py-2.5 sm:px-5 sm:py-3" style={{ borderLeftColor: color }}>
                <div className="text-[19px] font-bold sm:text-[22px]">
                  {narrator ? line.zh : `${line.sp}: ${line.zh}`}
                  <SpeakButton text={line.zh} onSpeak={() => onPlayLine(line.zh, line.gender)} className="ml-1" />
                </div>
                <div className="my-1 text-[17px] text-link">{line.py}</div>
                <div className="text-base italic text-muted">{line.vn}</div>
              </div>
            </div>
          );
        })}
      </div>

      {clozes.length > 0 && (
        <ChoiceExercise
          variant="cloze"
          icon={PencilLine}
          title="Bài tập điền từ"
          items={clozes}
          messages={{ correct: "Chính xác! Bạn đã chọn đúng từ.", wrong: "Chưa đúng, thử phương án khác nhé." }}
        />
      )}

      {quizzes.length > 0 && (
        <ChoiceExercise
          variant="quiz"
          icon={ListChecks}
          title="Trắc nghiệm nội dung bài"
          items={quizzes}
          messages={{ correct: "Đúng rồi! (答對了)", wrong: "Chưa đúng, thử lại nhé! (再試一次)" }}
        />
      )}

      {g.reading?.paragraph && (
        <ChoiceExercise
          variant="reading"
          icon={BookOpenText}
          title="Đọc hiểu (閱讀測驗)"
          intro={
            <div className="mb-6 rounded-lg border-l-[5px] border-[#2ecc71] bg-[#e9f7ef] p-5">
              <p className="mb-3 text-[22px] font-medium leading-relaxed text-ink">{g.reading.paragraph.zh}</p>
              <p className="mb-2 text-lg text-link">{g.reading.paragraph.py}</p>
              <p className="text-base italic text-muted">{g.reading.paragraph.vn}</p>
            </div>
          }
          items={reading}
          messages={{ correct: "Chính xác!", wrong: "Chưa đúng, đọc lại đoạn văn rồi chọn lại nhé." }}
        />
      )}
    </article>
  );
}
