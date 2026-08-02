import { useEffect, useState } from "react";
import { addGeminiKey } from "@/lib/keys.functions";
import { aiErrorMessage } from "@/lib/ai-error";

export const OPEN_API_KEY_DIALOG = "linny:open-api-key-dialog";

export function openApiKeyDialog(exhausted = false) {
  window.dispatchEvent(new CustomEvent(OPEN_API_KEY_DIALOG, { detail: { exhausted } }));
}

/** Mounted once (root layout). Opens on demand or when all keys hit their limit. */
export default function ApiKeyDialog() {
  const [open, setOpen] = useState(false);
  const [exhausted, setExhausted] = useState(false);

  useEffect(() => {
    function onOpen(e: Event) {
      setExhausted(!!(e as CustomEvent).detail?.exhausted);
      setOpen(true);
    }
    window.addEventListener(OPEN_API_KEY_DIALOG, onOpen);
    return () => window.removeEventListener(OPEN_API_KEY_DIALOG, onOpen);
  }, []);

  if (!open) return null;
  return <Dialog exhausted={exhausted} onClose={() => setOpen(false)} />;
}

function Dialog({ exhausted, onClose }: { exhausted: boolean; onClose: () => void }) {
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (key.trim().length < 15) {
      setError("API kalitni to'liq kiriting.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await addGeminiKey({ data: { apiKey: key.trim() } });
      if (!res.ok) {
        setError(res.error);
      } else {
        setDone(true);
        setKey("");
      }
    } catch (e) {
      setError(aiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="card-surface w-full max-w-lg p-5 md:p-6 max-h-[90vh] overflow-y-auto">
        {exhausted ? (
          <>
            <h2 className="text-lg md:text-xl font-bold">⚠️ Barcha API kalitlarda limit tugadi</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ulangan barcha Gemini kalitlarining limiti tugagan. Yangi API kalit ulaysizmi? Yoki 1-2 daqiqa
              kutib qayta urinib ko'rishingiz mumkin.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg md:text-xl font-bold">🔑 Yangi API ulash</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Google AI Studio dan olgan Gemini API kalitingizni kiriting — u avtomatik ulanadi va limit
              almashinuviga qo'shiladi.
            </p>
          </>
        )}

        <a
          href="https://aistudio.google.com/apikey"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm text-primary hover:underline"
        >
          Google AI Studio dan kalit olish →
        </a>

        {done ? (
          <div className="mt-4 p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-sm">
            ✅ Kalit ulandi! Endi limit tugasa, avtomatik shu kalitga o'tadi.
          </div>
        ) : (
          <>
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIza... yoki AQ...."
              spellCheck={false}
              autoComplete="off"
              className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
            {error && (
              <div className="mt-3 p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
          </>
        )}

        <div className="mt-5 flex flex-wrap gap-2 justify-end">
          <button onClick={onClose} className="btn-ghost text-sm">
            {done ? "Yopish" : "Hozir emas"}
          </button>
          {!done && (
            <button onClick={submit} disabled={busy} className="btn-primary text-sm disabled:opacity-50">
              {busy ? "Tekshirilmoqda..." : "Ulash"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
