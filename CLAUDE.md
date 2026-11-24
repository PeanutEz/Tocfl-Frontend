# CLAUDE.md

Toàn bộ quy ước của dự án nằm trong AGENTS.md (dùng chung cho mọi agent):

@AGENTS.md

## Ghi chú riêng cho Claude Code

- Trả lời người dùng bằng tiếng Việt.
- Chạy `npm run typecheck` và `npm run build` sau mỗi thay đổi code. Kiểm tra UI bằng `npm run dev` trong trình duyệt có sẵn của app.
- Tuyệt đối không sửa chuỗi tracking trong `src/lib/tracking.ts` và các chỗ gọi `trackUserAction()`, trừ khi người dùng yêu cầu rõ.
- Không đọc hay in giá trị trong `.env.local` ra chat. Cần biết biến nào thì xem `.env.example`.
