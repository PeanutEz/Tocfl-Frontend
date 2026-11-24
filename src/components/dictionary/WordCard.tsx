"use client";

import { Fragment, useMemo } from "react";
import { ScrollText, Sparkles } from "lucide-react";
import { asset } from "@/lib/data";
import { hanziOf } from "@/lib/text";
import { speakWord } from "@/lib/speech";
import type { Word } from "@/types";
import { EmptyNote, Rich, RichLines, SpeakButton } from "@/components/ui";
import StrokeOrder from "./StrokeOrder";
import SmartImage from "@/components/ui/SmartImage";

function parseIdiom(raw = "") {
  // Định dạng dữ liệu: "成語 (chéngyǔ) - nghĩa tiếng Việt<br>Ví dụ: …"
  // (A1 có vài mục dạng "Tục ngữ: … - …")
  let text = raw.trim();
  const proverb = /^Tục ngữ\s*[:：]/.test(text);
  if (proverb) text = text.replace(/^Tục ngữ\s*[:：]\s*/, "");

  // Chỉ tách ở dấu gạch đầu tiên: phần nghĩa / ví dụ phía sau cũng có thể chứa dấu "-"
  const cut = text.indexOf(" - ") >= 0 ? text.indexOf(" - ") : text.indexOf("-");
  const zhAndPy = (cut >= 0 ? text.slice(0, cut) : text).trim();
  const vn = (cut >= 0 ? text.slice(cut + (text.startsWith(" - ", cut) ? 3 : 1)) : "").trim();

  // Câu để phát âm: đoạn chữ Hán dài nhất ở dòng đầu (không đọc phần ví dụ)
  const firstLine = text.split(/<br\s*\/?>/i)[0];
  const runs = firstLine.match(/[㐀-鿿豈-﫿]+/g) ?? [];
  const zhOnly = runs.reduce((a, b) => (b.length > a.length ? b : a), "") || zhAndPy.split("(")[0].trim();

  return { zhAndPy, vn, zhOnly, proverb };
}

const Label = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`block text-[1.1em] font-bold ${className}`}>{children}</span>
);

export default function WordCard({ item }: { item: Word }) {
  const chars = useMemo(() => hanziOf(item.word), [item.word]);
  const idiom = parseIdiom(item.idiom);
  const variants = item.word.split("/").map((w) => w.trim());

  return (
    <article className="relative my-4 rounded-lg border border-[#ddd] bg-white p-3.5 shadow-[0_5px_15px_rgba(0,0,0,0.05)] sm:p-[25px]">
      <div className="mb-5 flex flex-col-reverse items-center gap-6 md:flex-row md:items-start md:justify-between md:gap-[30px]">
        <div className="w-full flex-1 text-center md:text-left">
          <span className="inline-block rounded bg-gold px-3 py-1.5 text-sm font-bold text-white">
            {item.level || "TOCFL"}
          </span>
          <h2 className="mb-[15px] mt-2 text-[42px] font-bold leading-tight text-ink sm:text-[48px] md:text-[64px]">
            {variants.map((w, i) => (
              <Fragment key={`${w}-${i}`}>
                {i > 0 && <span className="mx-2 text-[#ccc]">/</span>}
                {w}
                <SpeakButton text={w} size={30} className="ml-1" />
              </Fragment>
            ))}
          </h2>
          <div>
            <span className="text-[1.5em] text-link">{item.pinyin}</span>
            {item.ipa && <span className="ml-3 text-[1.2em] italic text-muted">/ {item.ipa} /</span>}
          </div>
          <p className="mt-2.5 text-[1.1em]">
            <strong>Hán Việt:</strong> {item.hanViet}
          </p>
        </div>

        {item.image && (
          <div className="h-[300px] w-full max-w-[300px] shrink-0 overflow-hidden rounded-lg border-[5px] border-white bg-[#f9f9f9] shadow-[0_8px_20px_rgba(0,0,0,0.15)] md:h-[250px] md:w-[250px]">
            <SmartImage src={asset(item.image)} alt={`Minh hoạ cho từ ${item.word}`} className="h-full w-full" imgClassName="h-full w-full object-contain" placeholderClassName="h-full" />
          </div>
        )}
      </div>

      <section className="mt-[15px] rounded-md border-l-4 border-[#1abc9c] bg-[#e8f6f3] p-3">
        <Label className="text-[#16a085]">BỘ THỦ & CẤU TẠO (部首)</Label>
        <RichLines html={item.radical} className="text-[1.1em] text-ink" />
      </section>

      <StrokeOrder chars={chars} pinyin={item.pinyin} hanViet={item.hanViet} />

      <section className="mt-2.5 rounded-md border-l-4 border-danger bg-[#fff8f8] p-[15px]">
        <Label className="text-[#c0392b]">TỪ GHÉP (合成詞)</Label>
        {item.compounds?.length ? (
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] sm:gap-2.5">
            {item.compounds.map((c, i) => (
              <div key={i} className="rounded-md border border-[#ffcccc] bg-white p-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                <div className="flex items-center justify-between">
                  <span
                    onClick={() => speakWord(c.tc)}
                    title="Nghe phát âm"
                    className="min-w-0 cursor-pointer break-words text-[1.2em] font-bold text-[#d35400]"
                  >
                    {c.tc}
                  </span>
                  <SpeakButton text={c.tc} size={18} />
                </div>
                <div className="my-0.5 text-[0.9em] text-link">{c.py}</div>
                <div className="text-[0.95em] text-[#666]">{c.vn}</div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyNote>Chưa có từ ghép cho mục này.</EmptyNote>
        )}
      </section>

      <section className="mt-[15px] border-l-[5px] border-brand bg-[#f9f9f9] p-2.5">
        <Label>GIẢI THÍCH</Label>
        <Rich as="p" html={item.explanation} className="mt-1 text-[1.1em]" />
      </section>

      <section className="mt-[15px] rounded-md bg-[#f0f7ff] p-2.5">
        <Label className="text-link">VÍ DỤ (例子)</Label>
        {item.examples?.length ? (
          item.examples.map((ex, i) => (
            <div key={i} className="mt-2.5 border-b border-dashed border-[#ccc] pb-2.5 last:border-0">
              <div className="text-[1.3em] font-medium">
                {ex.tc} <SpeakButton text={ex.tc} size={18} />
              </div>
              <div className="my-1 text-[1.1em] font-medium text-link">{ex.py}</div>
              <div className="text-[#555]">{ex.vn}</div>
            </div>
          ))
        ) : (
          <EmptyNote>Chưa có câu ví dụ cho mục này.</EmptyNote>
        )}
      </section>

      {idiom.zhAndPy && (
        <section className="mt-[15px] rounded-md border-l-4 border-gold bg-[#fffbe6] p-3">
          <div className="flex flex-wrap items-center gap-x-2">
            {idiom.proverb ? <ScrollText size={20} className="text-gold" /> : <Sparkles size={20} className="text-gold" />}
            <strong>{idiom.proverb ? "Tục ngữ:" : "Thành ngữ / cụm từ hay:"}</strong>
            <Rich html={idiom.zhAndPy} className="font-bold text-[#d35400]" />
            <SpeakButton text={idiom.zhOnly} size={18} />
          </div>
          {idiom.vn && <RichLines html={`Nghĩa: ${idiom.vn}`} className="mt-1 text-[0.9em] text-[#555]" />}
        </section>
      )}
    </article>
  );
}
