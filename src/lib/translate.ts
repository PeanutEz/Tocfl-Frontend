import { firebaseAuth } from "./firebase";

// Gọi API dịch của Worker (`worker/index.ts`). Key Azure nằm ở Worker, không nằm trong bundle.
// Khi chạy `next dev`, đặt NEXT_PUBLIC_TRANSLATE_API=http://127.0.0.1:8787/api/translate và chạy `npm run dev:worker`.
const API_URL = process.env.NEXT_PUBLIC_TRANSLATE_API || "/api/translate";

export const MAX_TRANSLATE_CHARS = 100;

export type SourceLang = "auto" | "zh-Hant" | "zh-Hans" | "vi";
export type TargetLang = "vi" | "zh-Hant" | "zh-Hans";

export const LANG_LABELS: Record<SourceLang, string> = {
  auto: "Phát hiện ngôn ngữ",
  "zh-Hant": "Trung (Phồn thể)",
  "zh-Hans": "Trung (Giản thể)",
  vi: "Việt",
};

export type TranslateResult = {
  text: string;
  /** Pinyin của bản dịch khi dịch sang tiếng Hoa. */
  targetPinyin?: string;
  /** Mã ngôn ngữ Azure nhận diện được khi chọn "Phát hiện ngôn ngữ". */
  detected?: string;
  /** Pinyin của câu gốc khi câu gốc là tiếng Hoa. */
  sourcePinyin?: string;
};

export class TranslateError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

export async function translateText(text: string, from: SourceLang, to: TargetLang, signal?: AbortSignal): Promise<TranslateResult> {
  const user = firebaseAuth().currentUser;
  if (!user) throw new TranslateError("unauthorized");
  const token = await user.getIdToken();

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text, from, to }),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new TranslateError("network");
  }
  const data = (await res.json().catch(() => ({}))) as Partial<TranslateResult> & { error?: string };
  if (!res.ok || typeof data.text !== "string") throw new TranslateError(data.error ?? `http_${res.status}`);
  return data as TranslateResult;
}

/** Câu báo lỗi cho học viên theo mã lỗi của API. */
export function translateErrorMessage(code: string): string {
  switch (code) {
    case "unauthorized":
      return "Phiên đăng nhập đã hết hạn. Tải lại trang rồi thử lại.";
    case "too_long":
      return `Mỗi lần chỉ dịch được tối đa ${MAX_TRANSLATE_CHARS} ký tự. Hãy rút gọn hoặc chia câu ra dịch từng phần.`;
    case "not_configured":
      return "Chức năng dịch chưa được cấu hình trên máy chủ.";
    case "network":
      return "Không kết nối được máy chủ dịch. Kiểm tra mạng rồi thử lại.";
    default:
      return "Dịch chưa thành công. Vui lòng thử lại sau ít phút.";
  }
}
