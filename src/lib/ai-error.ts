// Maps server-function errors to friendly Uzbek messages.
export function isAuthError(e: unknown): boolean {
  const m = (e as Error)?.message ?? "";
  return /Unauthorized|authorization header|Invalid token/i.test(m);
}

export function aiErrorMessage(e: unknown): string {
  if (isAuthError(e)) return "AI funksiyalari uchun Google bilan kirish kerak.";
  return (e as Error)?.message || "Xatolik yuz berdi";
}
