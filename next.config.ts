import type { NextConfig } from "next";

// Site được build thành file tĩnh (thư mục `out/`) để deploy lên GitHub Pages hoặc hosting tĩnh bất kỳ.
// Nếu deploy dưới một đường dẫn con (vd: https://<user>.github.io/Tocfl) thì đặt NEXT_PUBLIC_BASE_PATH=/Tocfl.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
