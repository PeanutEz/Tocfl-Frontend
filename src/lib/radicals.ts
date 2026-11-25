// Tra chữ theo bộ thủ, không cần file dữ liệu riêng:
// - 214 bộ thủ Khang Hy lấy từ khối Unicode U+2F00–U+2FD5, chuẩn hoá NFKC ra chữ Hán thường.
// - Khối CJK cơ bản (U+4E00–U+9FA5) vốn được xếp theo bộ thủ rồi số nét, nên bộ thủ của một chữ
//   là bộ có mã lớn nhất nhưng không vượt quá mã của chữ đó.

/** Số thứ tự (1-based) của bộ đầu tiên ứng với mỗi số nét, theo bảng Khang Hy. */
const STROKE_STARTS: [strokes: number, firstIndex: number][] = [
  [1, 1], [2, 7], [3, 30], [4, 61], [5, 95], [6, 118], [7, 147], [8, 167], [9, 176],
  [10, 187], [11, 197], [12, 201], [13, 205], [14, 209], [15, 211], [16, 212], [17, 214],
];

/** Dạng biến thể hay gặp khi bộ đứng trong chữ (vd 水 → 氵). */
const VARIANTS: Record<string, string> = {
  人: "亻", 刀: "刂", 心: "忄", 手: "扌", 水: "氵", 火: "灬", 犬: "犭", 玉: "王", 示: "礻",
  衣: "衤", 艸: "艹", 辵: "辶", 邑: "阝", 阜: "阝", 肉: "月", 网: "罒", 老: "耂", 攴: "攵", 爪: "爫", 食: "飠",
};

export type Radical = { index: number; char: string; strokes: number; variant?: string };

let radicals: Radical[] | null = null;
let codePoints: number[] = [];

export function allRadicals(): Radical[] {
  if (radicals) return radicals;
  radicals = Array.from({ length: 214 }, (_, i) => {
    const char = String.fromCodePoint(0x2f00 + i).normalize("NFKC");
    const index = i + 1;
    const strokes = [...STROKE_STARTS].reverse().find(([, first]) => index >= first)![0];
    return { index, char, strokes, variant: VARIANTS[char] };
  });
  codePoints = radicals.map((r) => r.char.codePointAt(0)!);
  return radicals;
}

/** Bộ thủ của một chữ Hán, hoặc null nếu chữ nằm ngoài khối CJK cơ bản. */
export function radicalOf(char: string): Radical | null {
  const list = allRadicals();
  const cp = char.codePointAt(0) ?? 0;
  if (cp < 0x4e00 || cp > 0x9fa5) return null;
  let lo = 0;
  let hi = list.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (codePoints[mid] <= cp) lo = mid;
    else hi = mid - 1;
  }
  return list[lo];
}

export type RadicalEntry = { radical: Radical; chars: string[] };

/** Gom các chữ Hán có trong danh sách từ theo bộ thủ (chỉ giữ bộ có ít nhất một chữ). */
export function buildRadicalIndex(words: string[]): RadicalEntry[] {
  const byIndex = new Map<number, Set<string>>();
  for (const word of words) {
    for (const ch of word) {
      const r = radicalOf(ch);
      if (!r) continue;
      if (!byIndex.has(r.index)) byIndex.set(r.index, new Set());
      byIndex.get(r.index)!.add(ch);
    }
  }
  return allRadicals()
    .filter((r) => byIndex.has(r.index))
    .map((radical) => ({
      radical,
      // Trong cùng một bộ, thứ tự mã Unicode cũng là thứ tự số nét
      chars: [...byIndex.get(radical.index)!].sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!),
    }));
}
