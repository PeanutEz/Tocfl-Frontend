"use client";

import { useCallback, useState } from "react";
import { ImageOff } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  /** Class cho khung bao (kích thước, bo góc, viền, căn giữa…). */
  className?: string;
  /** Class cho thẻ <img> bên trong. */
  imgClassName?: string;
  /** Chiều cao giữ chỗ khi ảnh chưa tải xong (cho ảnh không biết trước tỉ lệ). */
  placeholderClassName?: string;
};

/** Ảnh có khung xương nhấp nháy trong lúc tải, hiện dần khi xong, và báo rõ nếu không tải được. */
export default function SmartImage({ src, alt, className = "", imgClassName = "", placeholderClassName = "" }: Props) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  // Ảnh đã có trong cache có thể tải xong trước khi React gắn onLoad
  const imgRef = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete) setStatus(img.naturalWidth > 0 ? "loaded" : "error");
  }, []);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {status === "loading" && (
        <div aria-hidden className="absolute inset-0 animate-pulse bg-[#e9ecef]" />
      )}
      {status === "error" ? (
        <div className={`flex flex-col items-center justify-center gap-1.5 bg-[#f5f5f5] p-4 text-xs text-muted ${placeholderClassName}`}>
          <ImageOff size={22} />
          Không tải được hình
        </div>
      ) : (
        <>
          {/* Giữ chỗ cho ảnh chưa biết tỉ lệ để bố cục không nhảy */}
          {status === "loading" && placeholderClassName && <div aria-hidden className={placeholderClassName} />}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            draggable={false}
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
            className={`transition-opacity duration-300 ${status === "loaded" ? "opacity-100" : "absolute inset-0 opacity-0"} ${imgClassName}`}
          />
        </>
      )}
    </div>
  );
}
