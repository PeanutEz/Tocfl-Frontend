// Mở cửa sổ in mẫu luyện viết chữ Hán (7 hàng x 8 ô, mờ dần) để lưu thành PDF.

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function openPracticeSheet(char: string, pinyin: string, hanViet: string): boolean {
  const win = window.open("", "_blank");
  if (!win) return false;

  const ch = escapeHtml(char);
  let grid = "";
  for (let row = 0; row < 7; row++) {
    grid += `<div class="row">`;
    for (let col = 0; col < 8; col++) {
      const opacity = col === 0 ? 1 : col < 4 ? 0.2 : 0.05;
      grid += `
        <div class="cell">
          <div class="h"></div><div class="v"></div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <line x1="0" y1="0" x2="100" y2="100" /><line x1="100" y1="0" x2="0" y2="100" />
          </svg>
          <div class="char" style="opacity:${opacity}">${ch}</div>
        </div>`;
    }
    grid += `</div>`;
  }

  win.document.write(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>${ch} – Mẫu luyện viết</title>
  <style>
    @media print {
      @page { size: A4 portrait; margin: 15mm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; color: #2c3e50; }
    .toolbar { text-align: center; margin-bottom: 20px; }
    .toolbar p { color: #555; margin: 0 0 12px; }
    .btn { padding: 10px 22px; background: #b22222; color: #fff; border: 0; border-radius: 8px; cursor: pointer; font-size: 15px; font-weight: 600; }
    .btn:hover { background: #8f1b1b; }
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 32px; }
    .header p { color: #555; font-size: 18px; margin-top: 6px; }
    .header strong.py { color: #b22222; }
    .sheet { border: 2px solid #7cb5ec; max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; }
    .row { display: flex; width: 100%; }
    .cell { flex: 1; aspect-ratio: 1 / 1; border: 1px solid #7cb5ec; position: relative; display: flex; align-items: center; justify-content: center; box-sizing: border-box; }
    .cell .h { position: absolute; width: 100%; top: 50%; border-top: 1px dashed #b3d4f4; }
    .cell .v { position: absolute; height: 100%; left: 50%; border-left: 1px dashed #b3d4f4; }
    .cell svg { position: absolute; inset: 0; width: 100%; height: 100%; }
    .cell line { stroke: #b3d4f4; stroke-width: 1; stroke-dasharray: 4 4; }
    .char { font-size: 55px; font-family: 'Kaiti TC', 'STKaiti', 'KaiTi', serif; color: #000; z-index: 1; }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <p>Mẫu luyện viết đã sẵn sàng. Chọn “Lưu dưới dạng PDF” trong hộp thoại in để tải về.</p>
    <button class="btn" onclick="window.print()">In / Lưu PDF</button>
  </div>
  <div class="header">
    <h1>Luyện viết chữ ${ch}</h1>
    <p>Pinyin: <strong class="py">${escapeHtml(pinyin)}</strong> &nbsp;·&nbsp; Hán Việt: <strong>${escapeHtml(hanViet)}</strong></p>
  </div>
  <div class="sheet">${grid}</div>
</body>
</html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
  return true;
}
