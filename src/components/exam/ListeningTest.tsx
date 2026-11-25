"use client";

import { useMemo } from "react";
import { Headphones } from "lucide-react";
import { toast } from "sonner";
import { asset } from "@/lib/data";
import { trackUserAction } from "@/lib/tracking";
import type { ListeningQuestion } from "@/types";
import SmartImage from "@/components/ui/SmartImage";
import QuestionNav, { questionDomId, type NavItem } from "./QuestionNav";
import { ExamOptions, Feedback, ScoreBoard, SubmitBar, useTestSession } from "./shared";

// Hướng dẫn hiện trước câu đầu tiên của mỗi phần (theo thứ tự câu trong đề 50 câu).
const PART_INTROS: Record<number, { title: string; zh: string; vn: string }> = {
  0: {
    title: "第一部分：看圖回答 · Phần 1 (câu 1–15)",
    zh: "說明：在這個部分，每題有一張圖片，你會先聽到一個問題，接著再聽到 (A)(B)(C) 三個選項，請根據圖片提示選出正確的答案。",
    vn: "Nhìn tranh, nghe một câu hỏi và ba lựa chọn A, B, C, rồi chọn đáp án đúng nhất.",
  },
  15: {
    title: "第二部分：問答理解 · Phần 2 (câu 16–30)",
    zh: "說明：在這個部分，每題有 (A)(B)(C) 三張圖片，你會聽到一問一答的對話，請根據對話的內容，選出合適的圖片。",
    vn: "Có ba tranh A, B, C. Nghe một lượt hỏi – đáp ngắn rồi chọn tranh phù hợp.",
  },
  30: {
    title: "第三部分：對話理解 · Phần 3 (câu 31–40)",
    zh: "說明：在這個部分，每題有 (A)(B)(C) 三張圖片，你會聽到一段兩個人的對話，一共有四句話，對話結束後有一個問題，請根據問題選出合適的圖片。",
    vn: "Có ba tranh A, B, C. Nghe đoạn hội thoại bốn câu và một câu hỏi, rồi chọn tranh đúng.",
  },
  40: {
    title: "第四部分：對話 · Phần 4 (câu 41–50)",
    zh: "說明：在這個部分，你會聽到兩個人的對話，對話結束後有一個問題，每個問題都有 (A)(B)(C)(D) 四個選項，這四個選項的內容也會出現在題本上。請根據問題選出合適的答案。",
    vn: "Không có tranh. Đề in sẵn bốn đáp án A, B, C, D. Nghe hội thoại và câu hỏi, rồi chọn đáp án đúng.",
  },
};

/** Chỉ cho phát một file nghe tại một thời điểm. */
function pauseOtherAudio(e: React.SyntheticEvent<HTMLAudioElement>) {
  document.querySelectorAll("audio").forEach((a) => a !== e.currentTarget && a.pause());
}

export default function ListeningTest({ questions }: { questions: ListeningQuestion[] }) {
  const session = useTestSession("listening");
  const navItems = useMemo<NavItem[]>(() => {
    const starts = Object.keys(PART_INTROS).map(Number);
    return questions.map((q, index) => ({
      key: String(q.id),
      label: String(q.id),
      group: `Phần ${starts.filter((s) => s <= index).length || 1}`,
      correctAnswer: q.correctAnswer,
    }));
  }, [questions]);

  function submit() {
    const total = questions.length;
    const correct = questions.filter((q) => session.answers[q.id] === q.correctAnswer).length;
    const skipped = questions.filter((q) => !session.answers[q.id]).length;

    session.finish(correct, total);
    trackUserAction("SubmitTest", `Nộp phần thi Nghe, Điểm: ${correct}/${total}`);
    toast.success(`Bạn làm đúng ${correct}/${total} câu`, {
      description: skipped
        ? `Còn ${skipped} câu bỏ trống. Xem giải thích chi tiết bên dưới.`
        : "Xem giải thích chi tiết bên dưới.",
    });
  }

  if (questions.length === 0) {
    return <p className="text-base italic text-[#666]">Phần nghe của đề này đang được cập nhật.</p>;
  }

  return (
    <div className="text-left lg:flex lg:items-start lg:gap-4">
      <div className="min-w-0 flex-1">
        <ScoreBoard boardRef={session.boardRef} title="Kết quả phần thi Nghe" score={session.score} />

        <h3 className="mb-4 flex items-center gap-2 font-serif-tc text-2xl font-bold text-exam">
          <Headphones size={24} /> 聽力測驗 · Phần thi Nghe ({questions.length} câu)
        </h3>

        {questions.map((q, index) => {
          const intro = PART_INTROS[index];
          const layout = q.options.some((o) => o.image) ? "image" : q.options.some((o) => o.text) ? "text" : "label";
          return (
            <div key={q.id}>
              {intro && (
                <div
                  className={`mb-6 rounded-md border border-sand-light bg-cream px-4 py-4 sm:px-6 sm:py-5 ${index > 0 ? "mt-8" : ""}`}
                >
                  <h4 className="border-b-2 border-[#d9ceb2] pb-3 font-serif-tc text-[19px] font-bold text-slate-exam">
                    {intro.title}
                  </h4>
                  <p className="mb-2 mt-4 text-base leading-[1.8] text-[#333]">{intro.zh}</p>
                  <p className="text-base italic leading-relaxed text-[#666]">{intro.vn}</p>
                </div>
              )}

              <div
                id={questionDomId("listening", String(q.id))}
                className="mb-5 scroll-mt-24 rounded-md border border-[#ddd] bg-white p-3.5 shadow-[0_2px_5px_rgba(0,0,0,0.05)] sm:scroll-mt-32 sm:p-5"
              >
                <h4 className="mb-3 text-xl font-bold text-[#a33327]">Câu {q.id}</h4>
                <audio
                  controls
                  controlsList="nodownload"
                  preload="none"
                  onPlay={pauseOtherAudio}
                  onContextMenu={(e) => e.preventDefault()}
                  className="mb-4 h-10 w-full"
                  src={asset(q.audio)}
                >
                  Trình duyệt của bạn không phát được âm thanh.
                </audio>

                {q.part === 1 && q.question_image && (
                  <SmartImage
                    src={asset(q.question_image)}
                    alt={`Hình câu ${q.id}`}
                    className="mx-auto mb-4 w-full max-w-[350px] rounded-md border border-[#eee]"
                    imgClassName="block h-auto w-full"
                    placeholderClassName="h-[230px]"
                  />
                )}

                <ExamOptions
                  name={`Câu ${q.id}`}
                  options={q.options}
                  layout={layout}
                  value={session.answers[q.id]}
                  correctAnswer={q.correctAnswer}
                  submitted={session.submitted}
                  onSelect={(label) => session.select(String(q.id), label)}
                />

                {session.submitted && (
                  <Feedback answer={session.answers[q.id]} correctAnswer={q.correctAnswer} explanation={q.explanation} />
                )}
              </div>
            </div>
          );
        })}

        <SubmitBar submitted={session.submitted} onSubmit={submit} onReset={session.reset} />
      </div>
      <QuestionNav idPrefix="listening" items={navItems} answers={session.answers} submitted={session.submitted} />
    </div>
  );
}
