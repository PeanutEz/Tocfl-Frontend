// Nhận dạng chữ Hán viết tay qua dịch vụ Google Input Tools.
// Chỉ gửi toạ độ các nét vẽ, không gửi thông tin học viên.

const ENDPOINT = "https://inputtools.google.com/request?ime=handwriting&app=translate&dbg=0&cs=1&oe=UTF-8";
const HAN = /^\p{Script=Han}+$/u;

/** Một nét: [toạ độ x[], toạ độ y[], thời điểm ms[]]. */
export type Stroke = [number[], number[], number[]];

export async function recognizeHandwriting(
  strokes: Stroke[],
  width: number,
  height: number,
  signal?: AbortSignal,
): Promise<string[]> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      options: "enable_pre_space",
      requests: [
        {
          writing_guide: { writing_area_width: Math.round(width), writing_area_height: Math.round(height) },
          ink: strokes,
          // Phồn thể (Đài Loan) cho khớp dữ liệu TOCFL
          language: "zh_TW",
        },
      ],
    }),
    signal,
  });
  if (!res.ok) throw new Error(`handwriting ${res.status}`);
  const data = (await res.json()) as [string, [string, string[]][]];
  if (data[0] !== "SUCCESS") throw new Error("handwriting failed");
  const candidates = data[1]?.[0]?.[1] ?? [];
  return candidates.filter((c) => HAN.test(c)).slice(0, 10);
}
