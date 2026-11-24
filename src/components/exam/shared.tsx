"use client";

import { useRef, useState } from "react";
import { CircleAlert, CircleCheck, CircleX, RotateCcw, Send, Trophy } from "lucide-react";
import { asset } from "@/lib/data";
import type { ExamOption } from "@/lib/types";
import { Rich } from "../ui";
import SmartImage from "../SmartImage";

export type Answers = Record<string, string>;

/** Trạng thái một lượt làm bài: chọn đáp án → nộp → xem kết quả → làm lại. */
export function useTestSession() {
  const [answers, setAnswers] = useState<Answers>({});
  const [score, setScore] = useState<{ correct: number; total: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  return {
    answers,
    submitted: score !== null,
    score,
    boardRef,
    select: (key: string, label: string) => {
      if (score === null) setAnswers((a) => ({ ...a, [key]: label }));
    },
    finish: (correct: number, total: number) => {
      setScore({ correct, total });
      setTimeout(() => boardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    },
    reset: () => {
      setAnswers({});
      setScore(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
  };
}

type OptionLayout = "text" | "image" | "label";

type OptionsProps = {
  name: string;
  options: ExamOption[];
  layout: OptionLayout;
  value?: string;
  correctAnswer: string;
  submitted: boolean;
  onSelect: (label: string) => void;
};

export function ExamOptions({ name, options, layout, value, correctAnswer, submitted, onSelect }: OptionsProps) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={
        layout === "text"
          ? "flex flex-col gap-2.5"
          : layout === "image"
            ? // Màn hình hẹp: mỗi đáp án một hàng dọc; đủ rộng (lg) mới xếp A B C ngang nhau
              "flex flex-col gap-2.5 lg:flex-row lg:flex-wrap lg:justify-center lg:gap-4"
            : "grid grid-cols-3 gap-2.5 sm:flex sm:flex-wrap sm:justify-center sm:gap-4"
      }
    >
      {options.map((opt) => {
        const selected = value === opt.label;
        const isCorrect = opt.label === correctAnswer;

        let tone = "border-[#ddd] bg-white hover:border-[#90caf9]";
        if (submitted) {
          if (isCorrect) tone = "border-success bg-[#e8f5e9]";
          else if (selected) tone = "border-danger bg-[#ffebee]";
          else tone = "border-[#ddd] bg-white opacity-60";
        } else if (selected) {
          tone = "border-[#2196F3] bg-[#e3f2fd]";
        } else if (value) {
          tone += " opacity-60";
        }

        return (
          <button
            key={opt.label}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={submitted}
            onClick={() => onSelect(opt.label)}
            className={`rounded-md border-2 transition disabled:cursor-default ${submitted ? "" : "cursor-pointer"} ${tone} ${
              layout === "text"
                ? "flex items-center gap-2.5 px-4 py-3 text-left"
                : layout === "image"
                  ? "flex items-center gap-3 px-3 py-2.5 text-left sm:gap-4 sm:px-4 lg:w-[250px] lg:flex-col lg:gap-1 lg:p-2.5 lg:text-center"
                  : "flex items-center justify-center px-4 py-3 text-center sm:min-w-24 sm:px-6 sm:py-4"
            }`}
          >
            <strong
              className={`text-exam ${
                layout === "label" ? "text-2xl" : layout === "image" ? "w-7 shrink-0 text-center text-lg lg:w-auto lg:text-base" : "text-base"
              }`}
            >
              {opt.label}
              {layout !== "label" && "."}
            </strong>
            {opt.text && <span className={`font-serif-tc text-base text-[#333] ${layout === "image" ? "block" : ""}`}>{opt.text}</span>}
            {opt.image && (
              <SmartImage
                src={asset(opt.image)}
                alt={`Đáp án ${opt.label}`}
                className="mx-auto aspect-square w-full max-w-[240px] rounded bg-white lg:max-w-[220px]"
                imgClassName="h-full w-full object-contain"
                placeholderClassName="h-full"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Feedback({ answer, correctAnswer, explanation }: { answer?: string; correctAnswer: string; explanation?: string }) {
  const status = !answer ? "skipped" : answer === correctAnswer ? "correct" : "wrong";
  const styles = {
    correct: { box: "border-success bg-[#e8f5e9] text-[#155724]", icon: CircleCheck, text: `Chính xác! Đáp án đúng: ${correctAnswer}` },
    wrong: { box: "border-danger bg-[#ffebee] text-exam", icon: CircleX, text: `Chưa đúng. Đáp án đúng là ${correctAnswer}` },
    skipped: { box: "border-danger bg-[#ffebee] text-exam", icon: CircleAlert, text: `Bạn bỏ trống câu này. Đáp án đúng: ${correctAnswer}` },
  }[status];
  const Icon = styles.icon;

  return (
    <div className={`mt-4 rounded-md border-l-[5px] p-4 text-[15px] leading-relaxed ${styles.box}`}>
      <strong className="mb-1 flex items-center gap-2 text-base">
        <Icon size={18} /> {styles.text}
      </strong>
      {explanation && <Rich as="div" html={explanation} className="text-[#333]" />}
    </div>
  );
}

export function SubmitBar({ submitted, onSubmit, onReset }: { submitted: boolean; onSubmit: () => void; onReset: () => void }) {
  return (
    <div className="mb-5 mt-10 text-center">
      {submitted ? (
        <button
          type="button"
          onClick={onReset}
          className="inline-flex cursor-pointer items-center gap-2.5 rounded-md border-2 border-exam bg-white px-6 py-3 text-base sm:px-8 sm:text-lg font-bold text-exam shadow-sm transition hover:bg-exam hover:text-white"
        >
          <RotateCcw size={20} /> Làm lại từ đầu
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex cursor-pointer items-center gap-2.5 rounded-md bg-[#d32f2f] px-6 py-3 text-base sm:px-9 sm:text-lg font-bold text-white shadow-[0_4px_6px_rgba(0,0,0,0.1)] transition hover:bg-[#b71c1c]"
        >
          <Send size={20} /> Nộp bài & xem kết quả
        </button>
      )}
    </div>
  );
}

export function ScoreBoard({
  boardRef,
  title,
  score,
}: {
  boardRef: React.RefObject<HTMLDivElement | null>;
  title: string;
  score: { correct: number; total: number } | null;
}) {
  return (
    <div ref={boardRef} className="scroll-mt-24 sm:scroll-mt-32">
      {score && (
        <div className="mb-8 rounded-md border-2 border-sand-light bg-cream p-6 text-center shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
          <h3 className="flex items-center justify-center gap-2 font-serif-tc text-[21px] font-bold text-[#856404] sm:text-[26px]">
            <Trophy size={26} /> {title}
          </h3>
          <div className="my-3 text-[42px] font-bold text-exam">
            {score.correct} / {score.total}
          </div>
          <p className="text-base text-[#666]">Kéo xuống để xem lại từng câu: đáp án đúng tô xanh, câu chọn sai tô đỏ.</p>
        </div>
      )}
    </div>
  );
}
