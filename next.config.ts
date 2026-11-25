import type { NextConfig } from "next";

// Site được build thành file tĩnh (thư mục `out/`) để deploy lên GitHub Pages hoặc hosting tĩnh bất kỳ.
// Nếu deploy dưới một đường dẫn con (vd: https://<user>.github.io/Tocfl) thì đặt NEXT_PUBLIC_BASE_PATH=/Tocfl.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    // Site key Turnstile là thông tin công khai. Chấp nhận cả tên TURNSTILE_SITE_KEY (không tiền tố) để nhúng vào bundle.
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || process.env.TURNSTILE_SITE_KEY || "",
  },
};

export default nextConfig;
