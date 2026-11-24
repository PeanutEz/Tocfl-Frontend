import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maomi Dictionary · NUTN",
  description: "Từ điển Hoa – Việt và luyện thi TOCFL cho sinh viên Đại học Quốc gia Đài Nam (NUTN).",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#b22222",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen px-1.5 py-2 antialiased sm:px-5 sm:py-5">
        {children}
        <Toaster position="top-right" richColors closeButton duration={3500} toastOptions={{ style: { fontSize: 15 } }} />
      </body>
    </html>
  );
}
