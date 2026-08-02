import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Translate Gemini API errors into clear Uzbek messages, retrying rate limits.
const friendlyFetch: typeof fetch = async (input, init) => {
  const MAX_RETRIES = 3;
  let res = await fetch(input, init);

  for (let attempt = 0; attempt < MAX_RETRIES && (res.status === 429 || res.status >= 500); attempt++) {
    await sleep(1500 * (attempt + 1) + Math.floor(Math.random() * 500));
    res = await fetch(input, init);
  }

  if (res.ok) return res;
  const text = await res.clone().text().catch(() => "");
  let message = "";
  try {
    const j = JSON.parse(text);
    message = j?.error?.message || j?.message || "";
  } catch {
    message = text.slice(0, 200);
  }
  if (res.status === 429) {
    throw new Error(
      "Gemini so'rovlari limitidan oshdi. 1-2 daqiqa kutib, qayta urinib ko'ring (rasmlar sonini kamaytirsangiz ham yordam beradi).",
    );
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error("Gemini API kalitiga ruxsat yo'q yoki noto'g'ri. GEMINI_API_KEY ni tekshiring.");
  }
  if (res.status === 402) {
    throw new Error("Gemini hisobida to'lov muammosi bor.");
  }
  throw new Error(`AI xatosi (${res.status}): ${message || "noma'lum"}`);
};

// Gemini exposes an OpenAI-compatible endpoint at
// https://generativelanguage.googleapis.com/v1beta/openai/
export function createGeminiProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "gemini",
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    headers: { Authorization: `Bearer ${apiKey}` },
    fetch: friendlyFetch,
  });
}

export function getGateway() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY");
  return createGeminiProvider(key);
}
