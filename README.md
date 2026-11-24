# Maomi Chinese Dictionary (貓咪辭典)

Web học tiếng Hoa và luyện thi **TOCFL** cho sinh viên Việt Nam tại Đại học Quốc gia Đài Nam (國立臺南大學, NUTN).

**Bản đang chạy:** https://tocfl.honghbvn.workers.dev/

> Cần tài khoản học viên do giảng viên cấp để đăng nhập.

## Tính năng

### Từ điển TOCFL A1 – A2

- Hơn 1.100 từ vựng, mỗi từ có pinyin, IPA, âm Hán Việt, bộ thủ và cấu tạo chữ, mẹo nhớ, từ ghép, câu ví dụ, thành ngữ.
- Tra được theo chữ Hán, pinyin (có hoặc không dấu), âm Hán Việt hoặc nghĩa tiếng Việt (có hoặc không dấu). Kết quả xếp theo mức độ khớp.
- Ưu tiên file MP3 giọng Microsoft Neural nữ Đài Loan (zh-TW, chậm 10%) cho mục đã tạo sẵn; mục chưa có file dùng Web Speech API.
- Hoạt hình thứ tự nét tự chạy khi cuộn tới chữ; tải mẫu luyện viết dạng ô vuông để in hoặc lưu PDF.
- Phân trang; trang, từ khoá và tab đang mở được lưu trên URL nên tải lại hoặc gửi link vẫn mở đúng chỗ.

### Hội thoại và đoạn văn

- 60 bài hội thoại và bài đọc TOCFL A1, A2, chia theo cấp độ và bài học.
- Nghe cả bài hoặc từng câu, giọng nam/nữ theo nhân vật, chỉnh được tốc độ đọc.
- Bài tập điền từ, trắc nghiệm nội dung và đọc hiểu, biết đúng/sai ngay khi chọn.
- Tìm hội thoại theo chữ Hán, pinyin hoặc nghĩa tiếng Việt.

### Luyện thi TOCFL Band A

- 2 đề thi thử đầy đủ, mỗi đề có phần Nghe (50 câu, có file audio) và phần Đọc (50 câu).
- Nộp bài để xem điểm, đáp án đúng và giải thích từng câu; có nút làm lại từ đầu.

### Theo dõi học tập (phục vụ luận văn)

Học viên đăng nhập bằng Firebase Authentication. Các thao tác chính (đăng nhập, tra từ, chuyển tab, nộp bài, rời trang, không hoạt động 30 phút) được ghi vào Firestore, collection `StudentActivity_TOCFL`.

## Công nghệ

| Phần | Công nghệ |
|---|---|
| Framework | Next.js 16 (App Router, static export), React 19, TypeScript |
| Giao diện | Tailwind CSS v4, lucide-react (icon), sonner (thông báo) |
| Đăng nhập & dữ liệu học viên | Firebase Authentication, Cloud Firestore |
| Chữ Hán | hanzi-writer (thứ tự nét), Web Speech API (phát âm) |
| Hosting | Cloudflare Workers (static assets) |
| CI | GitHub Actions: typecheck và build mỗi lần push / Pull Request |

## Chạy trên máy

Yêu cầu Node.js 22 trở lên.

```bash
npm install
cp .env.example .env.local   # rồi điền cấu hình Firebase
npm run dev                  # http://localhost:3000
```

| Lệnh | Việc làm |
|---|---|
| `npm run dev` | Chạy bản phát triển |
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm run build` | Build site tĩnh ra thư mục `out/` |
| `npm run generate-audio` | Tạo MP3 cho toàn bộ từ, từ ghép, ví dụ và thành ngữ trong dữ liệu từ điển |

### Biến môi trường

Lấy giá trị ở Firebase Console → Project settings → Your apps → Web app. Xem mẫu trong [`.env.example`](.env.example).

| Biến | Bắt buộc |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `_AUTH_DOMAIN`, `_PROJECT_ID`, `_STORAGE_BUCKET`, `_MESSAGING_SENDER_ID`, `_APP_ID`, `_MEASUREMENT_ID` | Có |
| `NEXT_PUBLIC_BASE_PATH` | Không. Chỉ đặt khi site chạy dưới đường dẫn con (vd `/Tocfl`) |

Các biến `NEXT_PUBLIC_*` được nhúng vào mã chạy trên trình duyệt. Đó là cách Firebase web hoạt động; dữ liệu được bảo vệ bằng Firestore Security Rules và giới hạn API key theo domain. Không commit `.env.local`.

## Cấu trúc thư mục

```
src/
  app/          route (layout, trang chủ), theme màu
  components/   ui/ (dùng chung), layout/, auth/, dictionary/, dialogue/, exam/
  hooks/        custom hook
  lib/          Firebase, tracking, phát âm, tải dữ liệu, tìm kiếm
  types/        kiểu dữ liệu
public/
  data/         từ vựng, hội thoại, đề thi (JSON)
  images/       hình đề thi
  audio/        file nghe đề thi và MP3 phát âm SHA-1 trong words/
```

Quy ước code, quy tắc giao diện và cách thêm trang / đề thi mới: xem [AGENTS.md](AGENTS.md).

## Deploy

Site được deploy lên **Cloudflare Workers** ở https://tocfl.honghbvn.workers.dev/. Cloudflare tự build lại mỗi lần push lên nhánh được kết nối.

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy` (dùng [`wrangler.jsonc`](wrangler.jsonc), phục vụ thư mục `out/`)
- Biến `NEXT_PUBLIC_FIREBASE_*` khai báo ở **Settings → Build → Variables and secrets** của Worker.
- Domain của site phải có trong Firebase Console → Authentication → Settings → **Authorized domains**, nếu không thì đăng nhập sẽ lỗi.

## Phiên bản cũ

Bản HTML/JavaScript thuần trước khi chuyển sang Next.js được lưu ở tag git `backup/static-site-2026-11-24`.
