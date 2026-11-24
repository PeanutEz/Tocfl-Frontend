import { normalizeVi, removeTones } from "./text";
import type { Dialogue } from "./types";

export const DEFAULT_LEVEL = "TOCFL A1";

export const levelOf = (d: Dialogue) => d.level || DEFAULT_LEVEL;

export function levelsOf(data: Dialogue[]): string[] {
  return [...new Set(data.map(levelOf))];
}

/** Danh sách bài của một cấp độ, sắp theo số thứ tự ("Bài 2" trước "Bài 10"). */
export function lessonsOf(data: Dialogue[], level: string): string[] {
  const lessons = data.filter((d) => levelOf(d) === level).map((d) => d.lesson);
  const num = (s: string) => parseInt(s.replace(/\D/g, ""), 10) || 0;
  return [...new Set(lessons)].sort((a, b) => num(a) - num(b));
}

/** Tìm hội thoại theo tiêu đề, câu tiếng Trung, pinyin (không dấu) hoặc nghĩa tiếng Việt. */
export function searchDialogues(data: Dialogue[], raw: string, limit = 6): number[] {
  const keyword = raw.trim().toLowerCase();
  if (!keyword) return [];
  const toneless = removeTones(keyword);
  const vi = normalizeVi(keyword); // tiếng Việt có hoặc không dấu
  const hits: number[] = [];

  data.forEach((d, idx) => {
    if (hits.length >= limit) return;
    const inTitle = d.title.toLowerCase().includes(keyword) || (vi.length >= 2 && normalizeVi(d.title).includes(vi));
    const inLines = d.content.some(
      (l) =>
        l.zh.includes(raw.trim()) ||
        (vi.length >= 2 && normalizeVi(l.vn).includes(vi)) ||
        removeTones(l.py.toLowerCase()).includes(toneless),
    );
    if (inTitle || inLines) hits.push(idx);
  });
  return hits;
}
