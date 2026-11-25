import type { Word } from "@/types";

/** Bỏ dấu thanh pinyin và khoảng trắng để gõ "qingwen" vẫn tìm ra "qǐngwèn". */
export function removeTones(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ǚǜǘǖü]/g, "u")
    .replace(/\s+/g, "");
}

/**
 * Chuẩn hoá tiếng Việt để so khớp không phân biệt dấu: "Xin chào" → "xin chao", "đi" → "di".
 * Dấu câu thành khoảng trắng, các từ cách nhau đúng một khoảng trắng.
 */
export function normalizeVi(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Chữ thường + NFC, giữ dấu: dùng để thưởng điểm khi người dùng gõ đúng dấu. */
const lowerVi = (str: string) => (str || "").toLowerCase().normalize("NFC").replace(/\s+/g, " ").trim();

/** Dấu chỉ tiếng Việt mới có (hỏi, ngã, nặng, móc, trăng, mũ) hoặc chữ đ → chắc chắn không phải pinyin. */
const VI_ONLY_MARKS = /[̛̣̉̃̆̂]|đ/i;

/** Tách các nghĩa từ "Danh từ: Bạn, bạn bè (ghi chú)." → ["Bạn", "bạn bè"]. */
export function glossesOf(explanation: string): string[] {
  return (explanation || "")
    .replace(/^[^:]{1,40}:/, "")
    .split("(")[0]
    .split(/[,;/]/)
    .map((s) => s.replace(/[.。]+$/, "").trim())
    .filter(Boolean);
}

type IndexedWord = {
  item: Word;
  word: string;
  pinyin: string; // không dấu, không khoảng trắng
  hanViet: string; // normalizeVi
  hanVietRaw: string;
  glosses: string[]; // normalizeVi
  glossesRaw: string; // lowerVi, nối bằng " | "
  explanation: string; // normalizeVi
  compounds: string; // nghĩa tiếng Việt của từ ghép, normalizeVi
};

const indexCache = new WeakMap<Word[], IndexedWord[]>();

function indexOf(all: Word[]): IndexedWord[] {
  let index = indexCache.get(all);
  if (!index) {
    index = all.map((item) => {
      const glosses = glossesOf(item.explanation);
      return {
        item,
        word: (item.word || "").toLowerCase(),
        pinyin: removeTones((item.pinyin || "").toLowerCase()),
        hanViet: normalizeVi(item.hanViet),
        hanVietRaw: lowerVi(item.hanViet),
        glosses: glosses.map(normalizeVi),
        glossesRaw: glosses.map(lowerVi).join(" | "),
        explanation: normalizeVi(item.explanation),
        compounds: normalizeVi((item.compounds ?? []).map((c) => c.vn).join(" , ")),
      };
    });
    indexCache.set(all, index);
  }
  return index;
}

/** Từ nằm trọn trong chuỗi đã chuẩn hoá (không khớp "an" trong "bạn"). */
const hasWord = (field: string, q: string) => ` ${field} `.includes(` ${q} `);

export type MatchSource = "word" | "pinyin" | "vi";

/** Chiều tra: "zh-vi" gõ chữ Hán / pinyin để xem nghĩa; "vi-zh" gõ tiếng Việt để tìm từ tiếng Trung. */
export type SearchDirection = "zh-vi" | "vi-zh";
export type WordMatch = { item: Word; score: number; via: MatchSource };

function scoreWord(
  e: IndexedWord,
  hanziQuery: string,
  raw: string,
  viQuery: string,
  pinyinQuery: string | null,
): WordMatch | null {
  let best = 0;
  let via: MatchSource = "word";
  const take = (score: number, source: MatchSource) => {
    if (score > best) {
      best = score;
      via = source;
    }
  };

  // 1. Chữ Hán
  if (hanziQuery) {
    if (e.word === hanziQuery) take(100, "word");
    else if (e.word.startsWith(hanziQuery)) take(90, "word");
    else if (e.word.includes(hanziQuery)) take(70, "word");
  }

  // 2. Pinyin (gõ có dấu hoặc không dấu)
  if (pinyinQuery) {
    if (e.pinyin === pinyinQuery) take(80, "pinyin");
    else if (e.pinyin.startsWith(pinyinQuery)) take(60, "pinyin");
    else if (e.pinyin.includes(pinyinQuery)) take(40, "pinyin");
  }

  // 3. Tiếng Việt: âm Hán Việt và nghĩa
  if (viQuery) {
    const longEnough = viQuery.length >= 2;
    let vi = 0;

    if (e.hanViet === viQuery) vi = 75;
    else if (e.hanViet.startsWith(viQuery + " ")) vi = 55;
    else if (hasWord(e.hanViet, viQuery)) vi = 45;
    else if (longEnough && e.hanViet.includes(viQuery)) vi = 30;

    // Khớp đúng một nghĩa được ưu tiên hơn khớp âm Hán Việt ("bạn" → 朋友 trước 拌)
    if (e.glosses.includes(viQuery)) vi = Math.max(vi, 78);
    else if (e.glosses.some((g) => g.startsWith(viQuery + " "))) vi = Math.max(vi, 52);
    else if (e.glosses.some((g) => hasWord(g, viQuery))) vi = Math.max(vi, 48);
    else if (longEnough && e.glosses.some((g) => g.includes(viQuery))) vi = Math.max(vi, 30);

    if (!vi && hasWord(e.explanation, viQuery)) vi = 20;
    if (!vi && hasWord(e.compounds, viQuery)) vi = 12;

    // Gõ đúng dấu ("bạn") thì ưu tiên hơn các từ chỉ trùng khi bỏ dấu ("bán", "bàn")
    if (vi && (e.glossesRaw.includes(raw) || e.hanVietRaw.includes(raw))) vi += 4;
    take(vi, "vi");
  }

  return best > 0 ? { item: e.item, score: best, via } : null;
}

/**
 * Tìm theo chữ Hán, pinyin (có/không dấu), âm Hán Việt hoặc nghĩa tiếng Việt (có/không dấu).
 * Có `direction` thì chỉ tìm một chiều: "zh-vi" = chữ Hán + pinyin, "vi-zh" = nghĩa + âm Hán Việt.
 */
export function matchWords(all: Word[], input: string, limit?: number, direction?: SearchDirection): WordMatch[] {
  const raw = lowerVi(input);
  if (!raw) return [];
  const viQuery = direction === "zh-vi" ? "" : normalizeVi(raw);
  const pinyinQuery =
    direction === "vi-zh" || VI_ONLY_MARKS.test(raw.normalize("NFD")) ? null : removeTones(raw) || null;
  const hanziQuery = direction === "vi-zh" ? "" : raw;

  const results: WordMatch[] = [];
  for (const e of indexOf(all)) {
    const m = scoreWord(e, hanziQuery, raw, viQuery, pinyinQuery);
    if (m) results.push(m);
  }
  results.sort((a, b) => b.score - a.score || a.item.word.length - b.item.word.length);
  return limit ? results.slice(0, limit) : results;
}

export function suggestWords(all: Word[], raw: string, direction?: SearchDirection, limit = 6): WordMatch[] {
  return matchWords(all, raw, limit, direction);
}

/** Tìm kiếm khi nhấn Enter; ô trống thì trả về toàn bộ từ điển. */
export function searchWords(all: Word[], raw: string, direction?: SearchDirection): Word[] {
  if (!raw.trim()) return all;
  return matchWords(all, raw, undefined, direction).map((m) => m.item);
}

/** Lấy các chữ Hán của từ chính để vẽ thứ tự nét (bỏ chữ Latin, số, dấu câu). */
export function hanziOf(word: string): string[] {
  return word
    .split("/")[0]
    .replace(/[a-zA-Z0-9\s，。？！、]/g, "")
    .trim()
    .split("");
}
