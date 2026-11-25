"use client";

import { useState } from "react";
import { BookOpenText, Headphones } from "lucide-react";
import { loadExam } from "@/lib/data";
import { useAsync } from "@/hooks/use-async";
import { pauseAllAudio } from "@/lib/speech";
import { getUnsavedAnswers } from "@/lib/unsaved-work";
import { ErrorBlock, LoadingBlock } from "@/components/ui";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ExamSelect, { type ExamGroup } from "./ExamSelect";
import ListeningTest from "./ListeningTest";
import ReadingTest from "./ReadingTest";

// Thêm đề mới: tạo public/data/exams/<id>.json rồi khai báo ở đây.
const EXAM_GROUPS: ExamGroup[] = [
  {
    band: "TOCFL Band A",
    exams: [
      { id: "A_1", name: "Đề thi thử số 1", ready: true },
      { id: "A_2", name: "Đề thi thử số 2", ready: true },
    ],
  },
  { band: "TOCFL Band B", exams: [{ id: "B_1", name: "Đề số 1", ready: false }] },
  { band: "TOCFL Band C", exams: [{ id: "C_1", name: "Đề số 1", ready: false }] },
];

type Skill = "reading" | "listening";

export default function ExamTab() {
  const [examId, setExamId] = useState("A_1");
  const [skill, setSkill] = useState<Skill>("reading");
  const exam = useAsync(() => loadExam(examId), [examId]);
  // Đề đang chờ xác nhận chuyển sang (khi đề hiện tại còn câu chọn mà chưa nộp)
  const [pendingExam, setPendingExam] = useState<{ id: string; unsaved: number } | null>(null);

  const switchExam = (id: string) => {
    pauseAllAudio();
    setExamId(id);
    setSkill("reading");
  };

  const requestExam = (id: string) => {
    const unsaved = getUnsavedAnswers();
    if (unsaved > 0) setPendingExam({ id, unsaved });
    else switchExam(id);
  };

  const skillBtn = (active: boolean) =>
    `inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2.5 text-[15px] font-bold transition sm:px-6 sm:text-base ${
      active ? "bg-exam text-white" : "border border-sand bg-paper text-ink hover:bg-[#f1e6c8]"
    }`;

  return (
    <section className="mt-2.5">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <span className="text-lg font-bold text-exam">
          Chọn đề thi
        </span>
        <ExamSelect groups={EXAM_GROUPS} value={examId} onChange={requestExam} />
      </div>

      {exam.error && <ErrorBlock message="Không tải được đề thi. Vui lòng thử lại sau." />}
      {!exam.error && !exam.data && <LoadingBlock label="Đang tải đề thi…" />}

      {exam.data && (
        <>
          <h2 className="text-center font-serif-tc text-[21px] font-bold text-exam sm:text-[26px]">{exam.data.title}</h2>
          <p className="mb-5 text-center text-base text-subtle">{exam.data.description}</p>

          <div className="mb-6 grid grid-cols-2 gap-2 sm:mb-8 sm:flex sm:flex-wrap sm:justify-center sm:gap-4">
            <button
              type="button"
              className={skillBtn(skill === "listening")}
              onClick={() => setSkill("listening")}
            >
              <Headphones size={18} /> Nghe hiểu (聽力)
            </button>
            <button
              type="button"
              className={skillBtn(skill === "reading")}
              onClick={() => {
                pauseAllAudio();
                setSkill("reading");
              }}
            >
              <BookOpenText size={18} /> Đọc hiểu (閱讀)
            </button>
          </div>

          {/* key theo đề để đổi đề là bắt đầu bài làm mới */}
          <div hidden={skill !== "reading"}>
            <ReadingTest key={`r-${examId}`} sections={exam.data.reading} />
          </div>
          <div hidden={skill !== "listening"}>
            <ListeningTest key={`l-${examId}`} questions={exam.data.listening} />
          </div>
        </>
      )}
      <ConfirmDialog
        open={pendingExam !== null}
        title="Đổi sang đề khác?"
        description={
          <>
            Bạn đã chọn đáp án cho <strong>{pendingExam?.unsaved} câu</strong> nhưng chưa nộp bài. Đổi đề thì các đáp án này sẽ bị
            xoá.
          </>
        }
        cancelLabel="Ở lại làm tiếp"
        confirmLabel="Đổi đề"
        onCancel={() => setPendingExam(null)}
        onConfirm={() => {
          if (pendingExam) switchExam(pendingExam.id);
          setPendingExam(null);
        }}
      />
    </section>
  );
}
