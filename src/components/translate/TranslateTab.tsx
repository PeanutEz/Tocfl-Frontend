"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Check, ChevronDown, Copy, Loader2, RotateCcw, Volume2, X } from "lucide-react";
import { toast } from "sonner";
import { speakText } from "@/lib/speech";
import {
  LANG_LABELS,
  MAX_TRANSLATE_CHARS,
  TranslateError,
  translateErrorMessage,
  translateText,
  type SourceLang,
  type TargetLang,
  type TranslateResult,
} from "@/lib/translate";

const SOURCE_OPTIONS: SourceLang[] = ["auto", "zh-Hant", "zh-Hans", "vi"];
const TARGET_OPTIONS: TargetLang[] = ["vi", "zh-Hant", "zh-Hans"];
const DEBOUNCE_MS = 700;
// Nhãn ngắn cho tab trên màn hình rộng (đã ở trang dịch Trung - Việt nên "Trung" là hiển nhiên)
const SHORT_LABELS: Record<SourceLang, string> = { auto: "Phát hiện ngôn ngữ", "zh-Hant": "Phồn thể", "zh-Hans": "Giản thể", vi: "Việt" };

type Status = "idle" | "loading" | "done" | "error";

function speechLang(lang: string | undefined): "zh-TW" | "zh-CN" | "vi-VN" | null {
  if (lang === "zh-Hant") return "zh-TW";
  if (lang === "zh-Hans") return "zh-CN";
  if (lang === "vi") return "vi-VN";
  return null;
}

function isSupported(lang: string | undefined): lang is TargetLang {
  return lang === "vi" || lang === "zh-Hant" || lang === "zh-Hans";
}

function LangTabs<T extends string>({
  options,
  value,
  onChange,
  label,
  detectedNote,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  detectedNote?: string;
}) {
  const labelOf = (opt: T, short = false) => {
    const map = short ? SHORT_LABELS : LANG_LABELS;
    return opt === "auto" && detectedNote ? `Phát hiện: ${map[detectedNote as SourceLang]}` : map[opt as SourceLang];
  };
  return (
    <div className="flex min-w-0 flex-1">
      {/* Màn hình hẹp: danh sách thả xuống, không cuộn ngang */}
      <div className="relative min-w-0 flex-1 lg:hidden">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          aria-label={label}
          className="w-full cursor-pointer appearance-none truncate rounded-md bg-transparent py-2 pl-2 pr-7 text-[15px] font-semibold text-brand outline-none transition hover:bg-contrast/5 focus-visible:ring-2 focus-visible:ring-brand/30"
        >
          {options.map((opt) => (
            <option key={opt} value={opt} className="text-ink">
              {labelOf(opt)}
            </option>
          ))}
        </select>
        <ChevronDown size={16} aria-hidden className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-brand" />
      </div>

      {/* Màn hình rộng: các tab gạch chân như Google Dịch */}
      <div role="tablist" aria-label={label} className="hidden min-w-0 flex-1 lg:flex">
        {options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={opt}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt)}
              className={`-mb-px cursor-pointer whitespace-nowrap border-b-2 px-3 py-2.5 text-[15px] font-semibold transition ${
                active ? "border-brand text-brand" : "border-transparent text-ink/60 hover:bg-contrast/[0.03] hover:text-ink"
              }`}
            >
              {labelOf(opt, true)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-contrast/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

export default function TranslateTab() {
  const [source, setSource] = useState<SourceLang>("auto");
  const [target, setTarget] = useState<TargetLang>("vi");
  const [text, setText] = useState("");
  const [result, setResult] = useState<TranslateResult | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorCode, setErrorCode] = useState("");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Tránh gọi lại API khi nội dung và cặp ngôn ngữ không đổi
  const lastKeyRef = useRef("");

  const run = useCallback(
    async (force = false) => {
      const trimmed = text.trim();
      if (!trimmed) {
        abortRef.current?.abort();
        lastKeyRef.current = "";
        setResult(null);
        setStatus("idle");
        return;
      }
      if (trimmed.length > MAX_TRANSLATE_CHARS) {
        setStatus("error");
        setErrorCode("too_long");
        return;
      }
      const key = `${source}|${target}|${trimmed}`;
      if (!force && key === lastKeyRef.current) return;
      lastKeyRef.current = key;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("loading");
      try {
        const res = await translateText(trimmed, source, target, controller.signal);
        if (controller.signal.aborted) return;
        setResult(res);
        setStatus("done");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        lastKeyRef.current = "";
        setErrorCode(err instanceof TranslateError ? err.code : "unknown");
        setStatus("error");
      }
    },
    [text, source, target],
  );

  // Tự dịch sau khi ngừng gõ một lúc, giống Google Dịch
  useEffect(() => {
    const t = setTimeout(() => void run(), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [run]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Ô nhập tự giãn theo nội dung
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 160)}px`;
  }, [text]);

  const detected = source === "auto" ? result?.detected : undefined;
  const detectedNote = detected && isSupported(detected) ? detected : undefined;
  const effectiveSource = source === "auto" ? detected : source;

  function chooseSource(next: SourceLang) {
    setSource(next);
    if (next === target) setTarget(next === "vi" ? "zh-Hant" : "vi");
  }

  function chooseTarget(next: TargetLang) {
    setTarget(next);
    if (next === source) setSource("auto");
  }

  const canSwap = isSupported(effectiveSource) && effectiveSource !== target;

  function swap() {
    if (!isSupported(effectiveSource)) return;
    const newSource = target;
    const newTarget = effectiveSource;
    setSource(newSource);
    setTarget(newTarget);
    if (status === "done" && result) setText(result.text);
    setResult(null);
  }

  function clear() {
    setText("");
    textareaRef.current?.focus();
  }

  async function copy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Đã sao chép bản dịch");
    } catch {
      toast.error("Không sao chép được. Hãy bôi đen rồi sao chép thủ công.");
    }
  }

  function speak(value: string, lang: string | undefined) {
    const l = speechLang(lang);
    if (!l) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.info("Trình duyệt này không hỗ trợ đọc thành tiếng.");
      return;
    }
    speakText(value, l);
  }

  const count = text.length;
  const tooLong = count > MAX_TRANSLATE_CHARS;
  const showResult = (status === "done" || status === "loading") && result && text.trim();

  return (
    <section aria-labelledby="translate-title" className="mx-auto max-w-[1100px]">
      <h2 id="translate-title" className="sr-only">
        Dịch văn bản
      </h2>
      <div className="overflow-hidden rounded-lg border border-contrast/10 bg-surface shadow-sm">
        {/* Thanh chọn ngôn ngữ */}
        <div className="flex items-center gap-1 border-b border-contrast/10 px-1.5 py-1 sm:gap-2 sm:px-3 lg:py-0">
          <LangTabs options={SOURCE_OPTIONS} value={source} onChange={chooseSource} label="Ngôn ngữ gốc" detectedNote={detectedNote} />
          <IconButton label="Đổi chiều dịch" onClick={swap} disabled={!canSwap}>
            <ArrowLeftRight size={18} />
          </IconButton>
          <LangTabs options={TARGET_OPTIONS} value={target} onChange={chooseTarget} label="Ngôn ngữ đích" />
        </div>

        <div className="grid sm:grid-cols-2">
          {/* Văn bản gốc */}
          <div className="flex flex-col border-b border-contrast/10 sm:border-b-0 sm:border-r">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={MAX_TRANSLATE_CHARS}
                onPaste={(e) => {
                  const el = e.currentTarget;
                  const selected = el.selectionEnd - el.selectionStart;
                  if (text.length - selected + e.clipboardData.getData("text").length > MAX_TRANSLATE_CHARS) {
                    toast.info(`Chỉ giữ ${MAX_TRANSLATE_CHARS} ký tự đầu tiên`, {
                      description: `Mỗi lần dịch tối đa ${MAX_TRANSLATE_CHARS} ký tự. Phần dài hơn hãy chia ra dịch tiếp.`,
                    });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    void run(true);
                  }
                }}
                placeholder="Nhập văn bản cần dịch, vd: 我今天很忙，明天再去圖書館。"
                aria-label="Văn bản cần dịch"
                lang={source === "vi" ? "vi" : source === "zh-Hans" ? "zh-CN" : "zh-TW"}
                className="block w-full resize-none bg-transparent px-3.5 pb-2 pt-3 pr-12 text-[22px] leading-snug text-ink outline-none placeholder:text-[17px] placeholder:text-faint sm:px-5 sm:pt-4 sm:text-2xl"
              />
              {text && (
                <div className="absolute right-1.5 top-1.5">
                  <IconButton label="Xoá văn bản" onClick={clear}>
                    <X size={20} />
                  </IconButton>
                </div>
              )}
            </div>
            {result?.sourcePinyin && showResult && (
              <p className="px-3.5 pb-2 text-base text-link sm:px-5">{result.sourcePinyin}</p>
            )}
            <div className="flex items-center justify-between gap-2 px-2 pb-2 sm:px-3">
              <IconButton
                label="Nghe văn bản gốc"
                onClick={() => speak(text, effectiveSource)}
                disabled={!text.trim() || !speechLang(effectiveSource)}
              >
                <Volume2 size={19} />
              </IconButton>
              <span className={`text-sm tabular-nums ${tooLong ? "font-semibold text-danger" : "text-muted"}`}>
                {count.toLocaleString("vi-VN")} / {MAX_TRANSLATE_CHARS.toLocaleString("vi-VN")}
              </span>
            </div>
          </div>

          {/* Bản dịch */}
          <div className="flex min-h-[200px] flex-col bg-page/60" aria-live="polite" aria-busy={status === "loading"}>
            <div className="flex-1 px-3.5 pb-2 pt-3 sm:px-5 sm:pt-4">
              {status === "idle" || !text.trim() ? (
                <p className="text-[17px] text-faint">Bản dịch sẽ hiện ở đây</p>
              ) : status === "error" ? (
                <div className="flex flex-col items-start gap-2">
                  <p className="text-base text-danger">{translateErrorMessage(errorCode)}</p>
                  {errorCode !== "too_long" && errorCode !== "not_configured" && (
                    <button
                      type="button"
                      onClick={() => void run(true)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-contrast/15 bg-surface px-3 py-1.5 text-[15px] font-semibold text-ink transition hover:bg-contrast/5"
                    >
                      <RotateCcw size={16} /> Thử lại
                    </button>
                  )}
                </div>
              ) : showResult ? (
                <div className={status === "loading" ? "opacity-50" : ""}>
                  <p
                    lang={target === "vi" ? "vi" : target === "zh-Hans" ? "zh-CN" : "zh-TW"}
                    className="whitespace-pre-wrap text-[22px] leading-snug text-ink sm:text-2xl"
                  >
                    {result.text}
                  </p>
                  {result.targetPinyin && <p className="mt-2 text-base text-link">{result.targetPinyin}</p>}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-base text-muted">
                  <Loader2 size={18} className="animate-spin" /> Đang dịch…
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 px-2 pb-2 sm:px-3">
              <IconButton
                label="Nghe bản dịch"
                onClick={() => result && speak(result.text, target)}
                disabled={!showResult}
              >
                <Volume2 size={19} />
              </IconButton>
              <div className="flex items-center gap-1">
                {status === "loading" && showResult && <Loader2 size={16} className="animate-spin text-muted" aria-label="Đang dịch" />}
                <IconButton label="Sao chép bản dịch" onClick={copy} disabled={!showResult}>
                  {copied ? <Check size={18} className="text-success" /> : <Copy size={18} />}
                </IconButton>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
