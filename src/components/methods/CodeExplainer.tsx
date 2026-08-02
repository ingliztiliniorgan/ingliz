import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { explainCodeText } from "@/lib/ai.functions";
import { aiErrorMessage, cleanAiError } from "@/lib/ai-error";
import type { Profile } from "@/lib/types";

interface Props { profile: Profile; onBack: () => void }
interface Result {
  summary: string;
  lineByLine: { en: string; uz: string }[];
  vocab: { word: string; meaning: string }[];
}

export default function CodeExplainer({ profile, onBack }: Props) {
  const fn = useServerFn(explainCodeText);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const r = await fn({ data: { input, age: profile.age ?? 20 } });
      if (!r.ok) {
        setError(cleanAiError(r.error));
        return;
      }
      setResult(r.data);
    } catch (e) {
      setError(aiErrorMessage(e));
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <button onClick={onBack} className="btn-ghost text-sm">← Panelga</button>
      <h2 className="mt-6 text-2xl md:text-3xl font-bold">💻 Kod / Matn tushuntirgich</h2>
      <p className="text-muted-foreground mt-1">Inglizcha kod parchasi yoki matn yuboring — o'zbekchada tushuntirib beraman.</p>

      <textarea value={input} onChange={(e) => setInput(e.target.value)}
        rows={8} placeholder={"const users = await fetch('/api/users').then(r => r.json())"}
        className="mt-4 w-full rounded-2xl border p-4 bg-background font-mono text-sm" />
      <button onClick={run} disabled={input.trim().length < 3 || loading}
        className="btn-primary mt-3 disabled:opacity-40">
        {loading ? "Tushuntirilmoqda..." : "Tushuntir"}
      </button>

      {error && (
        <div role="alert" className="card-surface mt-4 p-4">
          <p className="text-sm">{error}</p>
          <button onClick={run} disabled={loading} className="btn-ghost mt-3 text-sm disabled:opacity-40">
            Qayta urinish
          </button>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <div className="card-surface p-5">
            <div className="text-xs uppercase text-muted-foreground">Xulosa</div>
            <div className="mt-1">{result.summary}</div>
          </div>
          {result.lineByLine.length > 0 && (
            <div className="card-surface p-5">
              <div className="text-xs uppercase text-muted-foreground mb-2">Qator-qator</div>
              <div className="space-y-2">
                {result.lineByLine.map((l, i) => (
                  <div key={i} className="rounded-xl border p-3">
                    <div className="font-mono text-sm">{l.en}</div>
                    <div className="text-sm text-muted-foreground mt-1">{l.uz}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.vocab?.length > 0 && (
            <div className="card-surface p-5">
              <div className="text-xs uppercase text-muted-foreground mb-2">Yangi so'zlar</div>
              <ul className="text-sm space-y-1">
                {result.vocab.map((v, i) => (
                  <li key={i}><span className="font-mono">{v.word}</span> — {v.meaning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
