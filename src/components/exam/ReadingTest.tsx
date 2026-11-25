"use client";

import { useMemo } from "react";
import { BookOpenText } from "lucide-react";
import { toast } from "sonner";
import { asset } from "@/lib/data";
import { trackUserAction } from "@/lib/tracking";
import type { ReadingSection } from "@/types";
import { Rich } from "@/components/ui";
import SmartImage from "@/components/ui/SmartImage";
import QuestionNav, { questionDomId, type NavItem } from "./QuestionNav";
import { ExamOptions, Feedback, ScoreBoard, SubmitBar, useTestSession } from "./shared";

export default function ReadingTest({ sections }: { sections: ReadingSection[] }) {
  const session = useTestSession("reading");
  const questions = sections.flatMap((s, si) => s.questions.map((q) => ({ q, key: `${si}-${q.id}` })));
  const navItems = useMemo<NavItem[]>(
    () =>
      sections.flatMap((s, si) =>
        s.questions.map((q) => ({
          key: `${si}-${q.id}`,
          label: String(q.id),
          group: `Phần ${si + 1}`,
          correctAnswer: q.correctAnswer,
        })),
      ),
    [sections],
  );

  function submit() {
    const total = questions.length;
    const correct = questions.filter(({ q, key }) => session.answers[key] === q.correctAnswer).length;
    const skipped = questions.filter(({ key }) => !session.answers[key]).length;

    session.finish(correct, total);
    trackUserAction("SubmitTest", `Nộp phần thi Đọc, Điểm: ${correct}/${total}`);
    toast.success(`Bạn làm đúng ${correct}/${total} câu`, {
      description: skipped
        ? `Còn ${skipped} câu bỏ trống. Xem giải thích chi tiết bên dưới.`
        : "Xem giải thích chi tiết bên dưới.",
    });
  }

  if (sections.length === 0) {
    return <p className="text-base italic text-subtle">Phần đọc đang được cập nhật.</p>;
  }

  return (
    <div className="lg:flex lg:items-start lg:gap-4">
      <div className="min-w-0 flex-1 rounded-md border border-[rgba(33,29,24,0.18)] bg-paper p-2.5 sm:p-[25px]">
        <ScoreBoard boardRef={session.boardRef} title="Kết quả phần thi Đọc" score={session.score} />

        <h3 className="flex items-center gap-2 font-serif-tc text-2xl font-bold text-exam">
          <BookOpenText size={24} /> 閱讀測驗 · Phần thi Đọc ({questions.length} câu)
        </h3>

        {sections.map((section, si) => (
          <section key={si}>
            <h4 className="mt-6 border-b-2 border-sand pb-1 font-serif-tc text-xl font-bold">{section.part_name}</h4>
            <Rich as="p" html={section.description_zh} className="mb-4 mt-2 text-sm leading-relaxed text-ink" />

            {section.questions.map((q) => {
              const key = `${si}-${q.id}`;
              return (
                <div
                  key={key}
                  id={questionDomId("reading", key)}
                  className="mb-5 scroll-mt-24 rounded-md border border-line bg-surface p-3.5 shadow-[0_2px_4px_rgba(0,0,0,0.05)] sm:scroll-mt-32 sm:p-5"
                >
                  {q.passage_zh && (
                    <Rich
                      as="div"
                      html={q.passage_zh.replace(/\n/g, "<br>")}
                      className="mb-4 border-l-4 border-sand bg-cream p-4 font-serif-tc text-lg leading-[1.8] text-ink"
                    />
                  )}
                  {q.question_image && (
                    <SmartImage
                      src={asset(q.question_image)}
                      alt={`Hình câu ${q.id}`}
                      className="mx-auto mb-4 w-full max-w-[350px] rounded-md border border-line shadow-[0_2px_5px_rgba(0,0,0,0.1)]"
                      imgClassName="block h-auto w-full"
                      placeholderClassName="h-[230px]"
                    />
                  )}
                  <Rich
                    as="div"
                    html={q.question_zh}
                    className={`font-serif-tc text-lg font-bold ${q.question_vn ? "mb-1" : "mb-5"}`}
                  />
                  {q.question_vn && <p className="mb-5 text-sm italic text-subtle">{q.question_vn}</p>}

                  <ExamOptions
                    name={`Câu ${q.id}`}
                    options={q.options}
                    layout={q.type === "text_choice" ? "text" : "image"}
                    value={session.answers[key]}
                    correctAnswer={q.correctAnswer}
                    submitted={session.submitted}
                    onSelect={(label) => session.select(key, label)}
                  />

                  {session.submitted && (
                    <Feedback answer={session.answers[key]} correctAnswer={q.correctAnswer} explanation={q.explanation} />
                  )}
                </div>
              );
            })}
          </section>
        ))}

        <SubmitBar submitted={session.submitted} onSubmit={submit} onReset={session.reset} />
      </div>
      <QuestionNav idPrefix="reading" items={navItems} answers={session.answers} submitted={session.submitted} />
    </div>
  );
}
