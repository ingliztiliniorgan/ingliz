import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// Wraps fetch to translate Lovable AI Gateway errors into clear Uzbek messages
// so users see the real reason (e.g. "credits exhausted") instead of a generic
// "something went wrong" string.
const friendlyFetch: typeof fetch = async (input, init) => {
  const res = await fetch(input, init);
  if (res.ok) return res;
  const text = await res.clone().text().catch(() => "");
  let message = "";
  try {
    const j = JSON.parse(text);
    message = j?.message || j?.error?.message || j?.title || "";
  } catch {
    message = text.slice(0, 200);
  }
  if (res.status === 402) {
    throw new Error(
      "AI kreditlari tugagan. Workspace kreditlarini to'ldirmaguningizcha AI funksiyalari ishlamaydi. (Lovable → Cloud → Credits)",
    );
  }
  if (res.status === 429) {
    throw new Error("AI so'rovlari juda ko'p — biroz kuting va qayta urinib ko'ring.");
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error("AI xizmatiga ruxsat yo'q. LOVABLE_API_KEY ni tekshiring.");
  }
  throw new Error(`AI xatosi (${res.status}): ${message || "noma'lum"}`);
};

export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: friendlyFetch,
  });
}

export function getGateway() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  return createLovableAiGatewayProvider(key);
}
