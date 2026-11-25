// Cloudflare Turnstile cho màn đăng nhập.
// Site key là thông tin công khai, được nhúng lúc build (next.config.ts ánh xạ TURNSTILE_SITE_KEY sang biến này).
// Secret key chỉ nằm ở Worker (`worker/index.ts`), endpoint `/api/turnstile` gọi siteverify của Cloudflare.

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

// Cùng gốc với API dịch: production là `/api/turnstile`, khi dev là Worker ở :8787.
const VERIFY_URL = (process.env.NEXT_PUBLIC_TRANSLATE_API || "/api/translate").replace(/\/translate\/?$/, "/turnstile");

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export type TurnstileOptions = {
  sitekey: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
  language?: string;
  size?: "normal" | "flexible" | "compact";
};

type TurnstileApi = {
  render(el: HTMLElement, options: TurnstileOptions): string;
  reset(widgetId?: string): void;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

/** Tải script Turnstile một lần duy nhất. */
export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile")));
    script.onerror = () => {
      scriptPromise = null; // cho phép thử tải lại
      script.remove();
      reject(new Error("turnstile"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/** Gửi token lên Worker để xác minh. Trả về true nếu Cloudflare xác nhận là người thật. */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = (await res.json().catch(() => ({}))) as { success?: boolean };
    return res.ok && data.success === true;
  } catch {
    return false;
  }
}
