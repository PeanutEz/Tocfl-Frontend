// Ưu tiên file giọng đọc dựng sẵn; dùng Web Speech API làm phương án dự phòng.

import { asset } from "@/lib/data";
import { sha1 } from "js-sha1";

const FEMALE_VOICES = ["Yating", "Hanhan", "Ting-Ting", "Mei-Jia", "Xiaoxiao", "Google 國語（臺灣）", "female"];
const MALE_VOICES = ["Zhiwei", "Kangkang", "Yunxi", "male"];
let wordAudio: HTMLAudioElement | null = null;
let wordRequestId = 0;

/** Các mức tốc độ cho phần hội thoại. */
export const SPEEDS = [
  { rate: 0.5, label: "Chậm" },
  { rate: 0.75, label: "Vừa" },
  { rate: 1, label: "Bình thường" },
  { rate: 1.5, label: "Nhanh" },
];

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

if (isSpeechSupported()) {
  // Một số trình duyệt chỉ trả danh sách giọng sau sự kiện này.
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

function cleanText(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/[【】（）()：:]/g, " ")
    .trim();
}

export function stopSpeaking(): void {
  wordRequestId += 1;
  if (wordAudio) {
    wordAudio.onended = null;
    wordAudio.onerror = null;
    wordAudio.pause();
    wordAudio.currentTime = 0;
    wordAudio = null;
  }
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}

/** Dừng mọi file nghe (đề thi) đang phát, dùng khi chuyển tab / đổi đề. */
export function pauseAllAudio(): void {
  if (typeof document === "undefined") return;
  document.querySelectorAll("audio").forEach((a) => a.pause());
}

function speakWordWithBrowser(text: string): void {
  if (!isSpeechSupported()) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-TW";
  utterance.rate = 0.85;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const taiwanVoices = voices.filter((v) => /(^|[-_])tw($|[-_])/i.test(v.lang));
  const premium =
    taiwanVoices.find(
      (v) =>
        ["Google", "Microsoft", "Yating", "Premium"].some((name) => v.name.includes(name)),
    ) ??
    taiwanVoices[0] ??
    voices.find((v) => v.lang.toLowerCase().startsWith("zh"));
  if (premium) utterance.voice = premium;

  window.speechSynthesis.speak(utterance);
}

/** Đọc một từ / câu ví dụ bằng file dựng sẵn nếu có, nếu không dùng Web Speech. */
export function speakWord(text: string): void {
  if (!text || typeof window === "undefined") return;
  stopSpeaking();

  const cleanedText = cleanText(text);
  if (!cleanedText) return;

  const requestId = wordRequestId;
  const audioUrl = asset(`audio/words/word-${sha1(cleanedText)}.mp3`);
  const audio = new Audio(audioUrl);
  wordAudio = audio;
  const fallbackToBrowser = () => {
    if (wordRequestId !== requestId || wordAudio !== audio) return;
    wordAudio = null;
    audio.onerror = null;
    speakWordWithBrowser(cleanedText);
  };
  audio.onended = () => {
    if (wordAudio === audio) wordAudio = null;
  };
  audio.onerror = fallbackToBrowser;
  audio.play().catch(fallbackToBrowser);
}

function applyGenderVoice(utterance: SpeechSynthesisUtterance, gender: string): void {
  const zhVoices = window.speechSynthesis.getVoices().filter((v) => v.lang.includes("zh"));
  if (zhVoices.length === 0) return;

  const isMale = gender === "male";
  const preferred = zhVoices.find((v) =>
    isMale
      ? MALE_VOICES.some((n) => v.name.includes(n))
      : FEMALE_VOICES.some((n) => v.name.includes(n)) || v.name.includes("Google"),
  );

  if (preferred) {
    utterance.voice = preferred;
    utterance.pitch = 1;
  } else {
    // Máy không có giọng phù hợp: dùng giọng mặc định và chỉnh cao độ cho dễ phân biệt.
    utterance.voice = zhVoices[0];
    utterance.pitch = isMale ? 0.5 : 1.2;
  }
}

type LineOptions = {
  rate: number;
  onEnd?: () => void;
  onError?: () => void;
  /** Mặc định huỷ câu đang đọc trước khi đọc câu mới. */
  interrupt?: boolean;
};

/** Đọc một câu hội thoại với giọng nam / nữ theo nhân vật. */
export function speakLine(text: string, gender: string, { rate, onEnd, onError, interrupt = true }: LineOptions): void {
  if (!isSpeechSupported()) return;
  if (interrupt) stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(cleanText(text));
  utterance.lang = "zh-TW";
  utterance.rate = rate;
  applyGenderVoice(utterance, gender);
  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = onError;

  window.speechSynthesis.speak(utterance);
}

/** Đọc một đoạn bất kỳ bằng Web Speech theo ngôn ngữ (dùng cho tab Dịch). */
export function speakText(text: string, lang: "zh-TW" | "zh-CN" | "vi-VN"): void {
  if (!isSpeechSupported()) return;
  stopSpeaking();
  const cleaned = text.trim();
  if (!cleaned) return;

  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.lang = lang;
  utterance.rate = lang === "vi-VN" ? 1 : 0.9;
  const voices = window.speechSynthesis.getVoices();
  const [base, region] = lang.toLowerCase().split("-");
  const voice =
    voices.find((v) => v.lang.toLowerCase().replace("_", "-") === `${base}-${region}`) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(base));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}
