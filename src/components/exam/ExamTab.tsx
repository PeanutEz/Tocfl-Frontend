"use client";

import { useState } from "react";
import { BookOpenText, FileText, Headphones } from "lucide-react";
import { loadExam, useAsync } from "@/lib/data";
import { pauseAllAudio } from "@/lib/speech";
import { ErrorBlock, LoadingBlock } from "../ui";
import ListeningTest from "./ListeningTest";
import ReadingTest from "./ReadingTest";

// Thêm đề mới: tạo public/data/exams/<id>.json rồi khai báo ở đây.
const EXAM_GROUPS: { band: string; exams: { id: string; label: string; ready: boolean }[] }[] = [
  {
    band: "TOCFL Band A",
    exams: [
      { id: "A_1", label: "Band A · Đề thi thử số 1", ready: true },
      { id: "A_2", label: "Band A · Đề thi thử số 2", ready: true },
    ],
  },
  { band: "TOCFL Band B", exams: [{ id: "B_1", label: "Band B · Đề số 1 (sắp ra mắt)", ready: false }] },
  { band: "TOCFL Band C", exams: [{ id: "C_1", label: "Band C · Đề số 1 (sắp ra mắt)", ready: false }] },
];

type Skill = "reading" | "listening";

export default function ExamTab() {
  const [examId, setExamId] = useState("A_1");
  const [skill, setSkill] = useState<Skill>("reading");
  const exam = useAsync(() => loadExam(examId), [examId]);

  const skillBtn = (active: boolean) =>
    `inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2.5 text-[15px] font-bold transition sm:px-6 sm:text-base ${
      active ? "bg-exam text-white" : "border border-sand bg-paper text-[#333] hover:bg-[#f1e6c8]"
    }`;

  return (
    <section className="mt-2.5">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label htmlFor="exam-select" className="inline-flex items-center gap-2 text-lg font-bold text-exam">
          <FileText size={20} /> Chọn đề thi
        </label>
        <select
          id="exam-select"
          value={examId}
          onChange={(e) => {
            pauseAllAudio();
            setExamId(e.target.value);
            setSkill("reading");
          }}
          className="w-full cursor-pointer rounded-md border-2 border-[#d9ceb2] bg-cream px-3 py-2 text-base font-bold sm:w-auto sm:px-4 sm:text-lg text-slate-exam outline-none focus:border-exam"
        >
          {EXAM_GROUPS.map((g) => (
            <optgroup key={g.band} label={g.band}>
              {g.exams.map((e) => (
                <option key={e.id} value={e.id} disabled={!e.ready}>
                  {e.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {exam.error && <ErrorBlock message="Không tải được đề thi. Vui lòng thử lại sau." />}
      {!exam.error && !exam.data && <LoadingBlock label="Đang tải đề thi…" />}

      {exam.data && (
        <>
          <h2 className="text-center font-serif-tc text-[21px] font-bold text-exam sm:text-[26px]">{exam.data.title}</h2>
          <p className="mb-5 text-center text-base text-[#666]">{exam.data.description}</p>

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
    </section>
  );
}
