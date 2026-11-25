"use client";

import { useEffect, useRef } from "react";
import { FileDown } from "lucide-react";
import { toast } from "sonner";
import { openPracticeSheet } from "@/lib/practice-sheet";

type Props = { chars: string[]; pinyin: string; hanViet: string };

/**
 * HanziWriter gắn clip-path theo URL tuyệt đối của trang (url("http://…/?page=2#mask")).
 * MainApp đổi query string bằng replaceState, URL cũ không còn khớp nên mặt nạ mất tác dụng
 * và nét vẽ hiện thành vệt bút dày. Đổi về dạng tương đối url(#mask) để luôn trỏ đúng.
 */
function fixClipPaths(el: HTMLElement | null) {
  el?.querySelectorAll<SVGElement>("[clip-path]").forEach((node) => {
    const value = node.getAttribute("clip-path") ?? "";
    const id = value.match(/#([^"')]+)["']?\)\s*$/)?.[1];
    if (id && value !== `url(#${id})`) node.setAttribute("clip-path", `url(#${id})`);
  });
}

/** Ô vẽ thứ tự nét cho từng chữ (HanziWriter) kèm nút tải mẫu luyện viết. */
export default function StrokeOrder({ chars, pinyin, hanViet }: Props) {
  const boxes = useRef<(HTMLDivElement | null)[]>([]);
  const writers = useRef<{ animateCharacter: () => void }[]>([]);

  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let ready = false;
    let visible = false;
    let played = false; // đã vẽ trong lần hiện ra này chưa

    // Vẽ khi hàng chữ cuộn vào màn hình; cuộn ra rồi vào lại thì vẽ lại.
    const play = () => {
      if (!ready || !visible || played) return;
      played = true;
      writers.current.forEach((w, i) => {
        fixClipPaths(boxes.current[i]);
        w?.animateCharacter();
      });
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) play();
        else played = false;
      },
      { threshold: 0.6 },
    );
    if (rowRef.current) observer.observe(rowRef.current);

    import("hanzi-writer").then(({ default: HanziWriter }) => {
      if (cancelled) return;
      chars.forEach((char, i) => {
        const el = boxes.current[i];
        if (!el) return;
        el.innerHTML = "";
        writers.current[i] = HanziWriter.create(el, char, {
          width: 70,
          height: 70,
          padding: 5,
          showOutline: true,
          showCharacter: false, // chỉ hiện nét mờ cho đến khi được vẽ
          strokeAnimationSpeed: 1.5,
          delayBetweenStrokes: 50,
          onLoadCharDataSuccess: () => requestAnimationFrame(() => fixClipPaths(el)),
          onLoadCharDataError: () => {
            el.innerHTML = `<span style="font-size:44px;line-height:70px">${char}</span>`;
          },
        });
      });
      ready = true;
      play();
    });

    return () => {
      cancelled = true;
      observer.disconnect();
      boxes.current.forEach((el) => el && (el.innerHTML = ""));
      writers.current = [];
    };
  }, [chars]);

  if (chars.length === 0) return null;

  return (
    <div ref={rowRef} className="my-4 flex flex-wrap gap-4">
      {chars.map((char, i) => (
        <div key={`${char}-${i}`} className="flex flex-col items-center gap-2">
          <div
            ref={(el) => {
              boxes.current[i] = el;
            }}
            onClick={() => {
              fixClipPaths(boxes.current[i]);
              writers.current[i]?.animateCharacter();
            }}
            title="Bấm để xem lại thứ tự nét"
            className="h-[70px] w-[70px] cursor-pointer rounded-md border border-dashed border-line-strong bg-surface"
          />
          <button
            type="button"
            onClick={() => {
              if (!openPracticeSheet(char, pinyin, hanViet)) {
                toast.error("Trình duyệt đang chặn cửa sổ mới", {
                  description: "Hãy cho phép pop-up với trang này để tải mẫu luyện viết.",
                });
              }
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-danger bg-surface px-3 py-1 text-xs font-medium text-danger transition hover:bg-danger hover:text-white"
          >
            <FileDown size={14} /> Mẫu luyện viết
          </button>
        </div>
      ))}
    </div>
  );
}
