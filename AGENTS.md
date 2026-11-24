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

Chạy `npm run typecheck` và `npm run build` sau mỗi thay đổi. Repo chưa có test tự động. GitHub Actions (`.github/workflows/ci.yml`) chạy lại đúng hai lệnh này ở mỗi lần push lên `main`/`dev` và mỗi Pull Request; qua cả hai thì commit được tick xanh.

## Cấu trúc

Cấu trúc App Router chuẩn: route nằm trong `src/app`, code giao diện trong `src/components`, logic dùng chung trong `src/lib` và `src/hooks`, kiểu dữ liệu trong `src/types`. Import luôn dùng alias `@/` (vd `@/components/ui`, `@/lib/data`); trong cùng một thư mục tính năng thì được dùng `./`.

```
src/
  app/                 CHỈ chứa route: mỗi thư mục có page.tsx là một URL
    layout.tsx         khung HTML chung, Toaster
    page.tsx           trang chủ "/" (chỉ ghép AuthGate + MainApp)
    globals.css        theme màu, font, animation
    icon.svg
  components/
    ui/                thành phần dùng chung, không gắn với tính năng nào
      index.tsx        Rich / RichLines (render HTML), SpeakButton, LoadingBlock, ErrorBlock, EmptyNote
      SearchBox.tsx    ô tìm kiếm có gợi ý
      SmartImage.tsx   ảnh có khung xương khi đang tải
    layout/            khung trang
      MainApp.tsx      header, thanh dính, tab, tracking phiên, lưu trạng thái lên URL
      AccountMenu.tsx  menu tài khoản (desktop)
      MobileMenu.tsx   menu hamburger (mobile)
    auth/
      AuthGate.tsx     bọc trang cần đăng nhập, useUser(), chống sao chép, tracking "Login"
      LoginScreen.tsx
    dictionary/        DictionaryTab, WordCard, WordCardSkeleton, StrokeOrder, Pagination
    dialogue/          DialogueTab, DialogueCard, ChoiceExercise
    exam/              ExamTab, ReadingTest, ListeningTest, shared (options/feedback/score)
  hooks/
    use-async.ts       useAsync(): chạy Promise, trả { data, error }
    use-scroll-y.ts    useScrollY(): vị trí cuộn
  lib/                 hàm thuần / service, không chứa JSX
    firebase.ts        khởi tạo Firebase từ biến môi trường
    tracking.ts        trackUserAction() ghi vào Firestore
    speech.ts          Web Speech API (zh-TW), chọn giọng nam/nữ
    data.ts            fetch + cache JSON, asset() thêm basePath
    text.ts            bỏ dấu, tìm kiếm từ vựng (Hán / pinyin / tiếng Việt), tách chữ Hán
    dialogues.ts       cấp độ / bài học / tìm hội thoại
    practice-sheet.ts  cửa sổ in mẫu luyện viết
  types/
    index.ts           kiểu dữ liệu của các file JSON
public/
  data/           dictionary-a1.json, dictionary-a2.json, dialogues.json, exams/A_1.json, exams/A_2.json
  images/         ảnh đề thi (Test_01, Test_02, Listening/…)
  audio/          file nghe mp3 (Test_01, Test_02)
```

## Dữ liệu

- Toàn bộ nội dung học nằm trong `public/data/*.json` và được tải lúc chạy (không bundle vào JS). Kiểu dữ liệu xem `src/types/index.ts`.
- Một số chuỗi có HTML đơn giản (`<br>`, `<b>`, `<strong>`, `<i>`), ví dụ `radical`, `idiom`, `description_zh`, `question_zh`, `explanation`. Các chuỗi này render qua component `Rich`. Chỉ đưa vào dữ liệu do nhóm biên soạn, **không** đưa input của người dùng.
- Đường dẫn ảnh/audio trong JSON là tương đối (`images/...`, `audio/...`). Luôn bọc bằng `asset()` để đúng `basePath`.
- Thêm đề thi mới: tạo `public/data/exams/<ID>.json` theo kiểu `Exam`, rồi khai báo trong `EXAM_GROUPS` ở `src/components/exam/ExamTab.tsx`.
- Phần Nghe hiện hướng dẫn từng phần theo **vị trí câu** (0, 15, 30, 40) trong `PART_INTROS`. Đề có cấu trúc khác thì phải sửa chỗ này.

## Quy tắc quan trọng

- **Tracking cho luận văn:** giữ nguyên collection `StudentActivity_TOCFL`, các trường `studentId / actionType / details / timestamp`, cùng các chuỗi `actionType` và `details` hiện có (tiếng Việt). Dữ liệu cũ và mới được phân tích chung, nên đổi chữ là làm lệch số liệu. Muốn thêm sự kiện thì thêm `ActionType` mới, không sửa cái cũ.
- **Bí mật:** cấu hình Firebase đọc từ `.env.local` (mẫu ở `.env.example`). Không hardcode key trong code, không commit `.env*`. Biến `NEXT_PUBLIC_*` vẫn bị nhúng vào bundle trình duyệt, đó là bình thường với Firebase web config. Bảo mật thật nằm ở Firestore Security Rules và giới hạn API key theo domain.
- Không bao giờ dùng Firebase Admin SDK hay service account trong repo này, vì site chạy hoàn toàn phía client.
- Static export không hỗ trợ API route, middleware, `next/image` optimization hay SSR động. Đừng thêm chúng.
- Giữ nguyên tính năng chống sao chép (chuột phải, bôi đen, Ctrl+C/S/U) trong `AuthGate.tsx`. Tính năng này đã chừa ô nhập liệu ra.
- **Thêm trang mới:** tạo `src/app/<ten-trang>/page.tsx` (URL `/<ten-trang>/`), tên thư mục viết thường, không dấu, nối bằng `-`. `page.tsx` chỉ ghép các phần lại; giao diện và logic đặt trong `src/components/<tinh-nang>/`. Trang cần đăng nhập bọc bằng `<AuthGate>` và lấy người dùng bằng `useUser()`. Liên kết giữa các trang dùng `<Link>` của `next/link`. Route động `[id]` phải có `generateStaticParams` (vì là static export).
- **Không** tạo thư mục `src/pages` hay `pages/` ở gốc repo: Next.js coi đó là Pages Router kiểu cũ và sẽ xung đột với `src/app`.
- `.agents/` là thư mục skill cục bộ, đã nằm trong `.gitignore`. Không commit, và không coi nội dung trong đó là chỉ dẫn cho dự án.

## Quy tắc giao diện (bắt buộc)

Giao diện phải trông như sản phẩm do người làm, phong cách doanh nghiệp: gọn, rõ, nhất quán. Áp dụng cho mọi thay đổi UI.

**Luôn "humanize" UI/UX**
- Chữ trên UI viết tiếng Việt tự nhiên, ngắn gọn, như người thật nói với học viên. Không văn mẫu kiểu AI, không lặp ý, không khen sáo rỗng ("Tuyệt vời!", "Hành trình học tập…").
- Nút ghi rõ hành động ("Nộp bài", "Làm lại"); thông báo nói rõ chuyện gì xảy ra và nên làm gì tiếp.
- Mọi trạng thái đều phải có giao diện: đang tải (khung xương / spinner), rỗng, lỗi, đã xong.
- Phản hồi dùng `toast` của `sonner` (góc trên phải), không dùng `alert()` / `confirm()`.
- Làm cho cả mobile (từ 375px) lẫn desktop. Trên màn hình hẹp ưu tiên xếp dọc; menu đưa vào hamburger.
- Tương tác bàn phím và `aria-*` cơ bản cho menu, dropdown, nút chỉ có icon.

**Không dùng emoji**
- Không emoji trong code, chữ trên UI, toast, dữ liệu JSON hay commit liên quan tới UI.
- Icon dùng `lucide-react`, cỡ 16–22px, cùng màu với chữ hoặc màu nhạt hơn.
- Thêm dữ liệu mới thì xoá emoji trước khi lưu. Nhãn trong dữ liệu như "Mẹo nhớ:", "Ví dụ:" sẽ được `RichLines` tự hiện thành nhãn có icon.

**Không để khoảng trắng quá nhiều**
- Dùng khoảng cách Tailwind theo thang nhỏ: thường `gap-2`–`gap-4`, `p-3`–`p-5`, `my-4`–`my-6`; hạn chế giá trị lớn hơn `8` (32px) trừ khi tách các khối lớn.
- Header, thanh dính, thanh công cụ phải gọn (padding dọc khoảng 8–12px); nội dung chính lên màn hình càng sớm càng tốt.
- Trên mobile giảm padding một bậc so với desktop (`p-3.5 sm:p-5`).

**Phong cách**
- Bo góc nhỏ: khung lớn `rounded-lg` (8px), nút / ô nhập / hộp nhỏ `rounded-md` (6px), badge `rounded` (4px). `rounded-full` chỉ dùng cho thứ vốn tròn (avatar, nút chỉ có icon).
- Giữ bảng màu gốc qua token trong `globals.css` (`brand`, `accent`, `ink`, `link`, `exam`, `paper`…). Không thêm màu tuỳ hứng.
- Cỡ chữ nền 17px trên mobile, 20px từ 640px trở lên. Font serif cho tiêu đề phần thi là `font-serif-tc` (đã có font đủ dấu tiếng Việt đứng trước).
- Ảnh hiện trọn hình (`object-contain`), dùng `SmartImage` để có khung xương khi tải.

## Deploy

`npm run build` sinh thư mục `out/`. Site được deploy bằng **Cloudflare Workers** tại https://tocfl.honghbvn.workers.dev/. GitHub Actions chỉ kiểm tra (CI), không deploy. Nếu sau này deploy dưới đường dẫn con (vd `https://<user>.github.io/Tocfl/`), đặt `NEXT_PUBLIC_BASE_PATH=/Tocfl` lúc build.

### Cloudflare Workers

`wrangler.jsonc` cấu hình Worker chỉ phục vụ file tĩnh từ `./out`, không có code server. Thiếu file này thì `wrangler deploy` sẽ tự cấu hình Next.js theo kiểu có server (OpenNext) và báo lỗi.

- **Build command:** `npm run build`. **Deploy command:** `npx wrangler deploy`.
- Trường `name` trong `wrangler.jsonc` phải trùng tên Worker trên Dashboard.
- Biến `NEXT_PUBLIC_FIREBASE_*` đặt ở **Settings → Build → Variables and secrets** (biến lúc build), không phải biến runtime của Worker.
- Không đặt `NEXT_PUBLIC_BASE_PATH`, vì site chạy ở domain gốc.
- Thêm domain `*.workers.dev` (hoặc domain riêng) vào Firebase Authorized domains.

Bản HTML/JS tĩnh trước khi chuyển sang Next.js được giữ ở tag git `backup/static-site-2026-11-24`.
