"use client";

import { useState } from "react";
import { ArrowRight, CircleCheck, CircleX, type LucideIcon } from "lucide-react";

export type ExerciseItem = {
  prompt: React.ReactNode;
  options: { zh: string; vn?: string }[];
  correct: number;
};

const VARIANTS = {
  cloze: { box: "border-2 border-gold bg-[#fffaf0]", title: "text-[#d35400]", divider: "border-dashed border-gold" },
  quiz: { box: "border-2 border-dashed border-[#3498db] bg-[#f0f7ff]", title: "text-link", divider: "border-solid border-[#d6eaf8]" },
  reading: { box: "border-2 border-success bg-[#fdfefe]", title: "text-success", divider: "border-dashed border-[#a9dfbf]" },
} as const;

type Props = {
  variant: keyof typeof VARIANTS;
  icon: LucideIcon;
  title: string;
  intro?: React.ReactNode;
  items: ExerciseItem[];
  messages: { correct: string; wrong: string };
};

/** Khối bài tập chọn đáp án: bấm là biết đúng/sai ngay, được chọn lại. */
export default function ChoiceExercise({ variant, icon: Icon, title, intro, items, messages }: Props) {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const v = VARIANTS[variant];
  const chips = variant === "cloze";

  return (
    <section className={`mt-8 rounded-lg p-3.5 sm:p-[25px] ${v.box}`}>
      <h3 className={`mb-2 flex items-center gap-2.5 text-xl font-bold sm:text-2xl ${v.title}`}>
        <Icon size={26} /> {title}
      </h3>
      {intro}

      {items.map((item, qi) => {
        const choice = picked[qi];
        const answered = choice !== undefined;
        const isRight = answered && choice === item.correct;

        return (
          <div key={qi} className={`mt-6 border-b pb-4 last:border-0 ${v.divider}`}>
            {item.prompt}
            <div className={chips ? "mt-4 flex flex-wrap gap-3" : "mt-3 grid gap-2"}>
              {item.options.map((opt, oi) => {
                const selected = choice === oi;
                const state = selected ? (isRight ? "border-success bg-[#d5f5e3]" : "border-danger bg-[#fadbd8]") : "border-[#ccc] bg-white hover:border-[#95a5a6]";
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                    className={`cursor-pointer text-left transition ${state} ${
                      chips ? "flex items-center gap-2.5 rounded-lg border-2 px-5 py-2.5" : "rounded-md border px-4 py-3 text-lg font-medium"
                    }`}
                  >
                    {chips ? (
                      <>
                        <strong className="text-[19px] text-ink">{opt.zh}</strong>
                        {opt.vn && (
                          <>
                            <ArrowRight size={16} className="text-[#bdc3c7]" />
                            <span className="text-base font-medium text-success">{opt.vn}</span>
                          </>
                        )}
                      </>
                    ) : (
                      opt.zh
                    )}
                  </button>
                );
              })}
            </div>
            {answered && (
              <p
                role="status"
                className={`mt-3 flex items-center gap-2 text-lg font-bold ${isRight ? "text-success" : "text-danger"}`}
              >
                {isRight ? <CircleCheck size={20} /> : <CircleX size={20} />}
                {isRight ? messages.correct : messages.wrong}
              </p>
            )}
          </div>
        );
      })}
    </section>
  );
}
