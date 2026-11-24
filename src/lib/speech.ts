// Phát âm bằng Web Speech API của trình duyệt (giọng zh-TW).

const FEMALE_VOICES = ["Yating", "Hanhan", "Ting-Ting", "Mei-Jia", "Xiaoxiao", "Google 國語（臺灣）", "female"];
const MALE_VOICES = ["Zhiwei", "Kangkang", "Yunxi", "male"];

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
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}

/** Dừng mọi file nghe (đề thi) đang phát, dùng khi chuyển tab / đổi đề. */
export function pauseAllAudio(): void {
  if (typeof document === "undefined") return;
  document.querySelectorAll("audio").forEach((a) => a.pause());
}

/** Đọc một từ / câu ví dụ, ưu tiên giọng Đài Loan chất lượng cao. */
export function speakWord(text: string): void {
  if (!text || !isSpeechSupported()) return;
  stopSpeaking();

  const utterance = new SpeechSynthesisUtterance(cleanText(text));
  utterance.lang = "zh-TW";
  utterance.rate = 0.85;
  utterance.pitch = 1;

  const voices = window.speechSynthesis.getVoices();
  const premium =
    voices.find(
      (v) =>
        v.lang.includes("TW") &&
        ["Google", "Microsoft", "Yating", "Premium"].some((name) => v.name.includes(name)),
    ) ?? voices.find((v) => v.lang.includes("TW") || v.lang.includes("zh"));
  if (premium) utterance.voice = premium;

  window.speechSynthesis.speak(utterance);
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
