// Cloudflare Worker: phục vụ site tĩnh trong `out/` và một API duy nhất `/api/translate`.
// Key Azure Translator chỉ nằm ở đây (biến bí mật của Worker), không bao giờ vào bundle trình duyệt.
// Mọi yêu cầu dịch phải kèm Firebase ID token của học viên đã đăng nhập.

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  AZURE_TRANSLATOR_KEY?: string;
  AZURE_TRANSLATOR_REGION?: string;
  AZURE_TRANSLATOR_ENDPOINT?: string;
  FIREBASE_PROJECT_ID?: string;
  /** Lúc chạy `wrangler dev`, Wrangler đọc `.env.local` nên có sẵn biến này. */
  NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string;
}

const MAX_CHARS = 100;
const SOURCE_LANGS = new Set(["auto", "zh-Hant", "zh-Hans", "vi"]);
const TARGET_LANGS = new Set(["vi", "zh-Hant", "zh-Hans"]);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/api/translate") return handleTranslate(request, env);
    return env.ASSETS.fetch(request);
  },
};

// ---------- CORS (chỉ để `next dev` ở localhost gọi được `wrangler dev`) ----------

function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin") ?? "";
  if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    Vary: "Origin",
  };
}

function json(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...corsHeaders(request) },
  });
}

// ---------- Xác thực Firebase ID token (RS256, khoá công khai của Google) ----------

const JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
type Jwk = JsonWebKey & { kid: string };
let jwksCache: { keys: Jwk[]; expires: number } | null = null;

async function getJwks(): Promise<Jwk[]> {
  if (jwksCache && jwksCache.expires > Date.now()) return jwksCache.keys;
  const res = await fetch(JWKS_URL);
  if (!res.ok) throw new Error("jwks");
  const { keys } = (await res.json()) as { keys: Jwk[] };
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get("Cache-Control") ?? "")?.[1] ?? 3600);
  jwksCache = { keys, expires: Date.now() + maxAge * 1000 };
  return keys;
}

function b64urlDecode(input: string): Uint8Array<ArrayBuffer> {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function verifyIdToken(token: string, projectId: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [h, p, s] = parts;
  const header = JSON.parse(new TextDecoder().decode(b64urlDecode(h))) as { alg?: string; kid?: string };
  const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(p))) as {
    aud?: string;
    iss?: string;
    exp?: number;
    iat?: number;
    sub?: string;
  };
  if (header.alg !== "RS256" || !header.kid) return false;

  const now = Math.floor(Date.now() / 1000);
  if (payload.aud !== projectId) return false;
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) return false;
  if (!payload.sub || !payload.exp || payload.exp < now || (payload.iat ?? 0) > now + 300) return false;

  const jwk = (await getJwks()).find((k) => k.kid === header.kid);
  if (!jwk) return false;
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  return crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlDecode(s), new TextEncoder().encode(`${h}.${p}`));
}

// ---------- Gọi Azure Translator ----------

type AzureTranslation = {
  detectedLanguage?: { language: string; score: number };
  translations: { text: string; to: string; transliteration?: { text: string } }[];
};

async function azure<T>(env: Env, path: string, params: Record<string, string>, text: string): Promise<T> {
  const base = (env.AZURE_TRANSLATOR_ENDPOINT || "https://api.cognitive.microsofttranslator.com").replace(/\/+$/, "");
  const qs = new URLSearchParams({ "api-version": "3.0", ...params });
  const headers: Record<string, string> = {
    "Ocp-Apim-Subscription-Key": env.AZURE_TRANSLATOR_KEY!,
    "Content-Type": "application/json; charset=UTF-8",
  };
  if (env.AZURE_TRANSLATOR_REGION) headers["Ocp-Apim-Subscription-Region"] = env.AZURE_TRANSLATOR_REGION;
  const res = await fetch(`${base}/${path}?${qs}`, { method: "POST", headers, body: JSON.stringify([{ Text: text }]) });
  if (!res.ok) throw new Error(`azure ${res.status}`);
  return (await res.json()) as T;
}

/** Pinyin cho câu chữ Hán (dùng API transliterate). */
async function pinyinOf(env: Env, text: string, lang: string): Promise<string | undefined> {
  try {
    const [r] = await azure<{ text: string }[]>(
      env,
      "transliterate",
      { language: lang, fromScript: lang === "zh-Hant" ? "Hant" : "Hans", toScript: "Latn" },
      text,
    );
    return r?.text;
  } catch {
    return undefined; // thiếu pinyin không làm hỏng bản dịch
  }
}

async function handleTranslate(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
  if (request.method !== "POST") return json(request, { error: "method" }, 405);

  const projectId = env.FIREBASE_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!env.AZURE_TRANSLATOR_KEY || !projectId) return json(request, { error: "not_configured" }, 503);

  const token = /^Bearer (.+)$/.exec(request.headers.get("Authorization") ?? "")?.[1];
  let authed = false;
  try {
    authed = !!token && (await verifyIdToken(token, projectId));
  } catch {
    authed = false;
  }
  if (!authed) return json(request, { error: "unauthorized" }, 401);

  let body: { text?: unknown; from?: unknown; to?: unknown };
  try {
    body = await request.json();
  } catch {
    return json(request, { error: "bad_request" }, 400);
  }
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const from = typeof body.from === "string" ? body.from : "auto";
  const to = typeof body.to === "string" ? body.to : "vi";
  if (!text || !SOURCE_LANGS.has(from) || !TARGET_LANGS.has(to)) return json(request, { error: "bad_request" }, 400);
  if (text.length > MAX_CHARS) return json(request, { error: "too_long" }, 413);

  try {
    const params: Record<string, string> = { to };
    if (from !== "auto") params.from = from;
    if (to.startsWith("zh-")) params.toScript = "Latn"; // kèm pinyin cho bản dịch tiếng Hoa

    const [result] = await azure<AzureTranslation[]>(env, "translate", params, text);
    const out = result.translations[0];
    const detected = result.detectedLanguage?.language;
    const sourceLang = from === "auto" ? detected : from;
    const sourcePinyin = sourceLang?.startsWith("zh-") ? await pinyinOf(env, text, sourceLang) : undefined;

    return json(request, {
      text: out.text,
      targetPinyin: out.transliteration?.text,
      detected,
      sourcePinyin,
    });
  } catch {
    return json(request, { error: "upstream" }, 502);
  }
}
