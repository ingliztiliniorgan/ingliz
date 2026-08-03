import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const ALL_KEYS_EXHAUSTED = "ALL_KEYS_EXHAUSTED";

// ---------------------------------------------------------------------------
// Key pool
// ---------------------------------------------------------------------------
// Keys come from two sources:
//  1. Project secrets GEMINI_API_KEY, GEMINI_API_KEY_2..GEMINI_API_KEY_8
//  2. Keys users connect from the app (public.gemini_keys), loaded with the
//     service-role client so key values never reach the browser.
const RATE_LIMIT_COOLDOWN_MS = 65_000; // Gemini free-tier limits reset per minute.
const INVALID_KEY_COOLDOWN_MS = 30 * 60_000;
const cooldown = new Map<string, number>();

let dbKeysCache: { keys: string[]; at: number } = { keys: [], at: 0 };
const DB_CACHE_MS = 20_000;

function envKeys(): string[] {
  const names = [
    "GEMINI_API_KEY",
    "GEMINI_API_KEY_2",
    "GEMINI_API_KEY_3",
    "GEMINI_API_KEY_4",
    "GEMINI_API_KEY_5",
    "GEMINI_API_KEY_6",
    "GEMINI_API_KEY_7",
    "GEMINI_API_KEY_8",
  ];
  return names.map((n) => process.env[n]).filter((v): v is string => !!v && v.trim().length > 10);
}

async function dbKeys(): Promise<string[]> {
  const now = Date.now();
  if (now - dbKeysCache.at < DB_CACHE_MS) return dbKeysCache.keys;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("gemini_keys")
      .select("api_key")
      .eq("active", true)
      .order("created_at", { ascending: true });
    const keys = (data ?? []).map((r) => r.api_key).filter((k): k is string => !!k);
    dbKeysCache = { keys, at: now };
    return keys;
  } catch {
    dbKeysCache = { keys: dbKeysCache.keys, at: now };
    return dbKeysCache.keys;
  }
}

export function markKeyExhausted(key: string, duration = RATE_LIMIT_COOLDOWN_MS) {
  cooldown.set(key, Date.now() + duration);
}

function isCooling(key: string) {
  const until = cooldown.get(key);
  if (!until) return false;
  if (until <= Date.now()) {
    cooldown.delete(key);
    return false;
  }
  return true;
}

export async function allKeys(): Promise<string[]> {
  const keys = [...envKeys(), ...(await dbKeys())];
  return Array.from(new Set(keys));
}

export async function keyPoolInfo() {
  const keys = await allKeys();
  const available = keys.filter((k) => !isCooling(k));
  return { total: keys.length, available: available.length };
}

// ---------------------------------------------------------------------------
// Rotating fetch: tries every key that is not cooling down. A 429 / quota
// response marks that key as exhausted for a minute and moves to the next one.
// ---------------------------------------------------------------------------
async function parseError(res: Response) {
  const text = await res
    .clone()
    .text()
    .catch(() => "");
  try {
    const j = JSON.parse(text);
    return (j?.error?.message || j?.message || "") as string;
  } catch {
    return text.slice(0, 200);
  }
}

const rotatingFetch: typeof fetch = async (input, init) => {
  const keys = await allKeys();
  if (keys.length === 0) throw new Error("Missing GEMINI_API_KEY");

  // Never retry keys that are still cooling in the same request. Doing so made
  // one user action consume every key again and falsely report pool exhaustion.
  const fresh = keys.filter((k) => !isCooling(k));
  const order = fresh;

  if (order.length === 0) {
    throw new Error(
      `${ALL_KEYS_EXHAUSTED}: Barcha ulangan API kalitlari vaqtincha kutish rejimida (${keys.length} ta kalit). 1-2 daqiqadan keyin qayta urinib ko'ring.`,
    );
  }

  let lastMessage = "";
  for (const key of order) {
    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${key}`);
    let res: Response;
    try {
      res = await fetch(input, { ...init, headers });
    } catch (e) {
      lastMessage = e instanceof Error ? e.message : String(e);
      continue;
    }

    if (res.ok) {
      cooldown.delete(key);
      return res;
    }

    const message = await parseError(res);
    lastMessage = message;

    if (res.status === 429 || /quota|resource_exhausted|rate limit/i.test(message)) {
      markKeyExhausted(key);
      continue; // try the next key
    }
    if (res.status === 401 || res.status === 403) {
      markKeyExhausted(key, INVALID_KEY_COOLDOWN_MS);
      continue; // bad/expired key — skip it and try another
    }
    if (res.status === 402) {
      throw new Error("Gemini hisobida to'lov muammosi bor.");
    }
    throw new Error(`AI xatosi (${res.status}): ${message || "noma'lum"}`);
  }

  throw new Error(
    `${ALL_KEYS_EXHAUSTED}: Barcha ulangan API kalitlarida limit tugadi (${keys.length} ta kalit). Yangi API kalit ulang yoki 1-2 daqiqa kutib qayta urinib ko'ring.${
      lastMessage ? "" : ""
    }`,
  );
};

// Gemini exposes an OpenAI-compatible endpoint at
// https://generativelanguage.googleapis.com/v1beta/openai/
export function createGeminiProvider() {
  return createOpenAICompatible({
    name: "gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    // Placeholder; rotatingFetch overrides Authorization per attempt.
    headers: { Authorization: "Bearer rotating" },
    fetch: rotatingFetch,
  });
}

export function getGateway() {
  return createGeminiProvider();
}

// Validate a user-supplied key with one cheap request.
export async function validateGeminiKey(key: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (res.ok) return { ok: true };
    if (res.status === 429) return { ok: true }; // valid key, just rate limited right now
    const message = await parseError(res);
    return { ok: false, error: message || `Kalit tekshiruvi muvaffaqiyatsiz (${res.status})` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Kalitni tekshirib bo'lmadi" };
  }
}
