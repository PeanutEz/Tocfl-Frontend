"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { lessonsOf, levelOf, levelsOf, DEFAULT_LEVEL } from "@/lib/dialogues";
import { SPEEDS, speakLine, stopSpeaking } from "@/lib/speech";
import type { Dialogue } from "@/lib/types";
import { EmptyNote, ErrorBlock, LoadingBlock } from "../ui";
import DialogueCard from "./DialogueCard";

export type DialogueFocus = { level: string; lesson: string; index: number; nonce: number };

type Props = {
  state: { data: Dialogue[] | null; error: Error | null };
  focus: DialogueFocus | null;
};

export default function DialogueTab({ state, focus }: Props) {
  const data = state.data;
  const [level, setLevel] = useState<string | null>(null);
  const [lesson, setLesson] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState<number | null>(null);
  const [flashIdx, setFlashIdx] = useState<number | null>(null);
  const playToken = useRef(0);

  const levels = useMemo(() => (data ? levelsOf(data) : []), [data]);
  const currentLevel = level ?? levels[0] ?? DEFAULT_LEVEL;
  const lessons = useMemo(() => (data ? lessonsOf(data, currentLevel) : []), [data, currentLevel]);
  const currentLesson = lesson && lessons.includes(lesson) ? lesson : lessons[0];

  // Nhảy tới hội thoại được chọn từ ô tìm kiếm
  useEffect(() => {
    if (!focus) return;
    setLevel(focus.level);
    setLesson(focus.lesson);
    setFlashIdx(focus.index);
    const t = setTimeout(() => {
      document.getElementById(`dialogue-${focus.index}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    const clear = setTimeout(() => setFlashIdx(null), 1800);
    return () => {
      clearTimeout(t);
      clearTimeout(clear);
    };
  }, [focus]);

  // Dừng đọc khi rời tab / đổi bài
  useEffect(() => () => stopPlayback(), []);
  useEffect(() => stopPlayback(), [currentLevel, currentLesson]);

  function stopPlayback() {
    playToken.current++;
    stopSpeaking();
    setPlaying(null);
  }

  function playAll(idx: number) {
    if (!data) return;
    if (playing === idx) return stopPlayback();
    stopPlayback();
    const token = playToken.current;
    const queue = [...data[idx].content];
    setPlaying(idx);

    const next = () => {
      if (playToken.current !== token) return;
      const line = queue.shift();
      if (!line) return setPlaying(null);
      speakLine(line.zh, line.gender, {
        rate: speed,
        interrupt: false,
        onEnd: () => setTimeout(next, 300),
        onError: next,
      });
    };
    next();
  }

  function playOne(text: string, gender: string) {
    stopPlayback();
    speakLine(text, gender, { rate: speed });
  }

  function changeSpeed(rate: number) {
    setSpeed(rate);
    const label = SPEEDS.find((s) => s.rate === rate)?.label ?? `${rate}x`;
    toast.success(`Tốc độ đọc: ${label}`, { description: "Áp dụng cho các câu đọc tiếp theo." });
  }

  if (state.error) return <ErrorBlock message="Không tải được dữ liệu hội thoại. Vui lòng tải lại trang." />;
  if (!data) return <LoadingBlock label="Đang tải hội thoại…" />;

  const visible = data
    .map((d, idx) => ({ d, idx }))
    .filter(({ d }) => levelOf(d) === currentLevel && d.lesson === currentLesson);

  const pill = "cursor-pointer border-2 font-bold transition";

  return (
    <section>
      <div className="mb-6 rounded-lg bg-white p-3.5 text-base sm:p-5 shadow-[0_5px_15px_rgba(0,0,0,0.05)] ring-1 ring-[#eee]">
        <div className="mb-4 flex flex-wrap items-center gap-2.5 border-b border-dashed border-[#ddd] pb-4">
          <span className="mr-2 font-bold text-[#555]">Cấp độ</span>
          {levels.map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => {
                setLevel(lvl);
                setLesson(null);
              }}
              className={`${pill} rounded-md px-4 py-1.5 ${
                lvl === currentLevel ? "border-accent bg-accent text-white" : "border-accent bg-white text-accent hover:bg-accent/5"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="mr-2 font-bold text-[#555]">Bài học</span>
          {lessons.length === 0 && <EmptyNote>Cấp độ này chưa có bài học.</EmptyNote>}
          {lessons.map((lsn) => (
            <button
              key={lsn}
              type="button"
              onClick={() => setLesson(lsn)}
              className={`cursor-pointer rounded-md border px-3 py-1 font-medium transition ${
                lsn === currentLesson ? "border-link bg-link text-white" : "border-link bg-white text-link hover:bg-link/5"
              }`}
            >
              {lsn}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 && lessons.length > 0 && (
        <p className="mt-5 text-center text-lg text-muted">Nội dung bài này đang được biên soạn.</p>
      )}

      {visible.map(({ d, idx }) => (
        <DialogueCard
          key={idx}
          id={`dialogue-${idx}`}
          dialogue={d}
          flash={flashIdx === idx}
          isPlaying={playing === idx}
          speed={speed}
          onPlayAll={() => playAll(idx)}
          onPlayLine={playOne}
          onSpeedChange={changeSpeed}
        />
      ))}
    </section>
  );
}
