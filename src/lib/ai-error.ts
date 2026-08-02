// Maps server-function errors to friendly Uzbek messages.
export function isAuthError(e: unknown): boolean {
  const m = (e as Error)?.message ?? "";
  return /Unauthorized|authorization header|Invalid token/i.test(m);
}

const EXHAUSTED_RE = /Barcha ulangan API kalitlarida limit tugadi|ALL_KEYS_EXHAUSTED/i;

export function isAllKeysExhausted(text: unknown): boolean {
  const m = typeof text === "string" ? text : ((text as Error)?.message ?? "");
  return EXHAUSTED_RE.test(m);
}

function notifyExhausted() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("linny:open-api-key-dialog", { detail: { exhausted: true } }),
  );
}

/** Cleans a message string coming back from the server and opens the key dialog when needed. */
export function cleanAiError(text: string): string {
  const msg = text.replace(/^ALL_KEYS_EXHAUSTED:\s*/, "");
  if (isAllKeysExhausted(text)) notifyExhausted();
  return msg;
}

export function aiErrorMessage(e: unknown): string {
  if (isAuthError(e)) return "AI funksiyalari uchun Google bilan kirish kerak.";
  const raw = (e as Error)?.message || "Xatolik yuz berdi";
  return cleanAiError(raw);
}
