import type { Metadata, Viewport } from "next";
import { ThemedToaster } from "@/components/ui/ThemeSwitch";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
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
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen px-1.5 py-2 antialiased sm:px-5 sm:py-5">
        {children}
        <ThemedToaster />
      </body>
    </html>
  );
}
