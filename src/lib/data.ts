import type { Dialogue, Exam, Word } from "@/types";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Đổi đường dẫn tương đối trong dữ liệu (vd: "images/Test_01/q1_A.png") thành URL có basePath. */
export function asset(path?: string): string {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return `${basePath}/${path.replace(/^\.?\//, "")}`;
}

const cache = new Map<string, Promise<unknown>>();

function loadJson<T>(file: string): Promise<T> {
  if (!cache.has(file)) {
    const request = fetch(asset(`data/${file}`)).then((res) => {
      if (!res.ok) throw new Error(`Không tải được ${file} (${res.status})`);
      return res.json();
    });
    request.catch(() => cache.delete(file)); // cho phép thử lại
    cache.set(file, request);
  }
  return cache.get(file) as Promise<T>;
}

export const loadDictionary = () =>
  Promise.all([loadJson<Word[]>("dictionary-a1.json"), loadJson<Word[]>("dictionary-a2.json")]).then(
    ([a1, a2]) => [...a1, ...a2],
  );

export const loadDialogues = () => loadJson<Dialogue[]>("dialogues.json");

export const loadExam = (id: string) => loadJson<Exam>(`exams/${id}.json`);

const CACHE_CLEARED_FLAG = "cache-cleared";

/**
 * Xoá bộ nhớ đệm dữ liệu bài học rồi tải lại trang:
 * - bộ nhớ tạm trong trang (JSON đã tải), Cache Storage, sessionStorage;
 * - tải lại các file JSON với `cache: "reload"` để bản trong bộ nhớ đệm HTTP của trình duyệt được thay bằng bản mới.
 * Không đụng tới localStorage (lựa chọn giao diện) và IndexedDB (phiên đăng nhập Firebase).
 */
export async function clearAppCache(): Promise<void> {
  const files = new Set(["dictionary-a1.json", "dictionary-a2.json", "dialogues.json", ...cache.keys()]);
  cache.clear();

  if (typeof caches !== "undefined") {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }

  await Promise.allSettled([...files].map((file) => fetch(asset(`data/${file}`), { cache: "reload" })));

  try {
    sessionStorage.clear();
    sessionStorage.setItem(CACHE_CLEARED_FLAG, "1");
  } catch {
    // sessionStorage bị chặn: bỏ qua thông báo sau khi tải lại
  }
  window.location.reload();
}

/** Trả true một lần duy nhất ngay sau khi trang được tải lại bởi clearAppCache(). */
export function consumeCacheClearedFlag(): boolean {
  try {
    if (sessionStorage.getItem(CACHE_CLEARED_FLAG) !== "1") return false;
    sessionStorage.removeItem(CACHE_CLEARED_FLAG);
    return true;
  } catch {
    return false;
  }
}
