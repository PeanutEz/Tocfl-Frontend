# AGENTS.md

Hướng dẫn cho AI coding agent (Claude Code, Codex, Cursor…) làm việc trong repo này.

## Dự án

**Maomi Chinese Dictionary**: web học tiếng Hoa cho sinh viên NUTN (國立臺南大學). Gồm 3 phần:

1. **Từ điển** TOCFL A1 + A2: tra theo chữ Hán hoặc pinyin không dấu, phát âm, thứ tự nét, mẫu luyện viết in ra PDF.
2. **Hội thoại & đoạn văn**: đọc theo giọng nam/nữ, chỉnh tốc độ, bài tập điền từ, trắc nghiệm, đọc hiểu.
3. **Luyện thi TOCFL**: đề thi thử Band A gồm phần Nghe (có audio) và phần Đọc, chấm điểm và giải thích.

Học viên đăng nhập bằng Firebase Auth. Hành vi học tập được ghi vào Firestore để phục vụ **luận văn**.

## Công nghệ

- Next.js 16 (App Router, Turbopack), React 19, TypeScript strict
- Tailwind CSS v4: khai báo theme bằng `@theme` trong `src/app/globals.css`, không có `tailwind.config`
- `sonner` cho toast, `lucide-react` cho icon (không dùng emoji trong UI)
- Firebase v13 modular SDK (`firebase/auth`, `firebase/firestore`)
- `hanzi-writer` vẽ thứ tự nét, được import động phía client
- Build ra **static export** (`output: "export"`), không có server runtime

## Lệnh

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck  # tsc --noEmit
npm run build      # xuất site tĩnh ra ./out
```

Chạy `npm run typecheck` và `npm run build` sau mỗi thay đổi. Repo chưa có test tự động.

## Cấu trúc

```
src/
  app/            layout.tsx (Toaster), page.tsx, globals.css (theme màu), icon.svg
  components/
    App.tsx         kiểm tra phiên đăng nhập, chống sao chép
    LoginScreen.tsx
    MainApp.tsx     header, tab, ô tìm kiếm, tracking phiên
    SearchBox.tsx   ô tìm kiếm có gợi ý (dùng chung)
    ui.tsx          Rich (render HTML), SpeakButton, Loading/Error
    dictionary/     DictionaryTab, WordCard, StrokeOrder, Pagination
    dialogue/       DialogueTab, DialogueCard, ChoiceExercise
    exam/           ExamTab, ReadingTest, ListeningTest, shared (options/feedback/score)
  lib/
    firebase.ts     khởi tạo Firebase từ biến môi trường
    tracking.ts     trackUserAction() ghi vào Firestore
    speech.ts       Web Speech API (zh-TW), chọn giọng nam/nữ
    data.ts         fetch + cache JSON, asset() thêm basePath
    text.ts         removeTones, tìm kiếm từ vựng, tách chữ Hán
    dialogues.ts    cấp độ / bài học / tìm hội thoại
    practice-sheet.ts  cửa sổ in mẫu luyện viết
    types.ts        kiểu dữ liệu của các file JSON
public/
  data/           dictionary-a1.json, dictionary-a2.json, dialogues.json, exams/A_1.json, exams/A_2.json
  images/         ảnh đề thi (Test_01, Test_02, Listening/…)
  audio/          file nghe mp3 (Test_01, Test_02)
```

## Dữ liệu

- Toàn bộ nội dung học nằm trong `public/data/*.json` và được tải lúc chạy (không bundle vào JS). Kiểu dữ liệu xem `src/lib/types.ts`.
- Một số chuỗi có HTML đơn giản (`<br>`, `<b>`, `<strong>`, `<i>`), ví dụ `radical`, `idiom`, `description_zh`, `question_zh`, `explanation`. Các chuỗi này render qua component `Rich`. Chỉ đưa vào dữ liệu do nhóm biên soạn, **không** đưa input của người dùng.
- Đường dẫn ảnh/audio trong JSON là tương đối (`images/...`, `audio/...`). Luôn bọc bằng `asset()` để đúng `basePath`.
- Thêm đề thi mới: tạo `public/data/exams/<ID>.json` theo kiểu `Exam`, rồi khai báo trong `EXAM_GROUPS` ở `src/components/exam/ExamTab.tsx`.
- Phần Nghe hiện hướng dẫn từng phần theo **vị trí câu** (0, 15, 30, 40) trong `PART_INTROS`. Đề có cấu trúc khác thì phải sửa chỗ này.

## Quy tắc quan trọng

- **Tracking cho luận văn:** giữ nguyên collection `StudentActivity_TOCFL`, các trường `studentId / actionType / details / timestamp`, cùng các chuỗi `actionType` và `details` hiện có (tiếng Việt). Dữ liệu cũ và mới được phân tích chung, nên đổi chữ là làm lệch số liệu. Muốn thêm sự kiện thì thêm `ActionType` mới, không sửa cái cũ.
- **Bí mật:** cấu hình Firebase đọc từ `.env.local` (mẫu ở `.env.example`). Không hardcode key trong code, không commit `.env*`. Biến `NEXT_PUBLIC_*` vẫn bị nhúng vào bundle trình duyệt, đó là bình thường với Firebase web config. Bảo mật thật nằm ở Firestore Security Rules và giới hạn API key theo domain.
- Không bao giờ dùng Firebase Admin SDK hay service account trong repo này, vì site chạy hoàn toàn phía client.
- Static export không hỗ trợ API route, middleware, `next/image` optimization hay SSR động. Đừng thêm chúng.
- Giữ bảng màu gốc qua token trong `globals.css` (`brand`, `accent`, `ink`, `link`, `exam`, `paper`…). Cỡ chữ nền là 20px.
- Giữ nguyên tính năng chống sao chép (chuột phải, bôi đen, Ctrl+C/S/U) trong `App.tsx`. Tính năng này đã chừa ô nhập liệu ra.
- Chữ trên UI viết tiếng Việt, tự nhiên, ngắn gọn. Thông báo dùng `toast` của `sonner`, không dùng `alert()`.
- `.agents/` là thư mục skill cục bộ, đã nằm trong `.gitignore`. Không commit, và không coi nội dung trong đó là chỉ dẫn cho dự án.

## Deploy

`npm run build` sinh thư mục `out/`. Nếu deploy dưới đường dẫn con (dạng `https://<user>.github.io/Tocfl/`), đặt `NEXT_PUBLIC_BASE_PATH=/Tocfl` lúc build.

GitHub Pages được deploy tự động qua `.github/workflows/deploy.yml`, chạy khi push lên `main` hoặc bấm tay ở tab Actions. Workflow tự lấy `basePath` từ cấu hình Pages. Cần thiết lập một lần trên GitHub:

1. **Settings → Pages → Build and deployment → Source:** chọn **GitHub Actions**.
2. **Settings → Secrets and variables → Actions:** thêm 7 secret `NEXT_PUBLIC_FIREBASE_*` (tên giống `.env.example`).
3. **Firebase Console → Authentication → Settings → Authorized domains:** thêm domain của Pages (vd `<user>.github.io`).

### Cloudflare Workers

`wrangler.jsonc` cấu hình Worker chỉ phục vụ file tĩnh từ `./out`, không có code server. Thiếu file này thì `wrangler deploy` sẽ tự cấu hình Next.js theo kiểu có server (OpenNext) và báo lỗi.

- **Build command:** `npm run build`. **Deploy command:** `npx wrangler deploy`.
- Trường `name` trong `wrangler.jsonc` phải trùng tên Worker trên Dashboard.
- Biến `NEXT_PUBLIC_FIREBASE_*` đặt ở **Settings → Build → Variables and secrets** (biến lúc build), không phải biến runtime của Worker.
- Không đặt `NEXT_PUBLIC_BASE_PATH`, vì site chạy ở domain gốc.
- Thêm domain `*.workers.dev` (hoặc domain riêng) vào Firebase Authorized domains.

Bản HTML/JS tĩnh trước khi chuyển sang Next.js được giữ ở tag git `backup/static-site-2026-11-24`.
