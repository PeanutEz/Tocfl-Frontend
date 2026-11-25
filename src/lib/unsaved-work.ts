// Ghi nhận số câu đã chọn đáp án nhưng chưa nộp, để cảnh báo trước khi đổi đề, đăng xuất hoặc rời trang.

const counts = new Map<string, number>();

export function setUnsavedAnswers(source: string, count: number) {
  if (count > 0) counts.set(source, count);
  else counts.delete(source);
}

export function getUnsavedAnswers(): number {
  let total = 0;
  counts.forEach((n) => (total += n));
  return total;
}

/** Trình duyệt tự hiện hộp hỏi khi tải lại / đóng tab nếu còn bài chưa nộp. */
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", (e) => {
    if (getUnsavedAnswers() > 0) e.preventDefault();
  });
}
