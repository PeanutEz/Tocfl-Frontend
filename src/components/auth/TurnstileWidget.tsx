"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { RotateCw } from "lucide-react";
import { loadTurnstile, TURNSTILE_SITE_KEY } from "@/lib/turnstile";

export type TurnstileHandle = {
  /** Lấy lại thử thách mới (token Turnstile chỉ dùng được một lần). */
  reset(): void;
};

type Props = {
  /** Nhận token khi xác minh xong, `null` khi token hết hạn hoặc lỗi. */
  onToken(token: string | null): void;
};

const TurnstileWidget = forwardRef<TurnstileHandle, Props>(function TurnstileWidget({ onToken }, ref) {
  const boxRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [attempt, setAttempt] = useState(0);

  useImperativeHandle(ref, () => ({
    reset() {
      onTokenRef.current(null);
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    },
  }));

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    loadTurnstile()
      .then((api) => {
        if (cancelled || !boxRef.current) return;
        widgetId.current = api.render(boxRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
          language: "vi",
          size: "flexible",
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("failed"));
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [attempt]);

  return (
    <div className="min-h-[65px]">
      {status === "loading" && <div className="h-[65px] animate-pulse rounded-md bg-page" aria-label="Đang tải bước xác minh" />}
      {status === "failed" && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-line-strong px-3 py-2.5 text-sm text-muted">
          <span>Không tải được bước xác minh. Kiểm tra mạng rồi thử lại.</span>
          <button
            type="button"
            onClick={() => setAttempt((n) => n + 1)}
            className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 font-medium text-accent hover:bg-page"
          >
            <RotateCw size={16} />
            Tải lại
          </button>
        </div>
      )}
      <div ref={boxRef} className={status === "ready" ? "" : "hidden"} />
    </div>
  );
});

export default TurnstileWidget;
