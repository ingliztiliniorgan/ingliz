import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { genRuleExplanation } from "@/lib/ai.functions";
import type { Profile } from "@/lib/types";

interface Props {
  profile: Profile;
  onBack: () => void;
}

const suggestions = ["of", "for", "to", "in / on / at", "a vs an vs the", "Present Simple", "Past Simple", "will vs going to", "have / has"];

export default function RulesMode({ profile, onBack }: Props) {
  const gen = useServerFn(genRuleExplanation);
  const [rule, setRule] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    title: string;
    intro: string;
    examples: { en: string; uz: string; note?: string }[];
  } | null>(null);

  async function load(r: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await gen({ data: { age: profile.age ?? 20, rule: r } });
      setResult(data);
    } catch (e) {
      console.error(e);
      setError("Yuklab bo'lmadi. Yana urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <button onClick={onBack} className="btn-ghost text-sm">← Panelga</button>
      <h2 className="mt-6 text-2xl md:text-3xl font-bold">Qoidalar bo'yicha</h2>
      <p className="text-muted-foreground mt-1">
        Qoida yoki so'zni yozing (masalan "of"), AI uni misollar bilan tushuntiradi.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => {
              setRule(s);
              load(s);
            }}
            className="px-3 py-1 rounded-full border text-sm hover:bg-accent"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={rule}
          onChange={(e) => setRule(e.target.value)}
          placeholder="Qoida yoki so'zni yozing"
          className="flex-1 rounded-2xl border p-4 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          disabled={rule.trim().length < 1 || loading}
          onClick={() => load(rule.trim())}
          className="btn-primary disabled:opacity-40"
        >
          Tushuntir
        </button>
      </div>

      {error && <div className="mt-3 text-sm text-red-500">{error}</div>}
      {loading && (
        <div className="mt-6 card-surface p-6 text-center">
          <div className="text-3xl animate-pulse">📘</div>
          <div className="mt-2 text-sm">AI misollar tayyorlayapti...</div>
        </div>
      )}

      {result && !loading && (
        <div className="mt-6 card-surface p-6">
          <h3 className="text-xl font-bold">{result.title}</h3>
          <p className="mt-2 text-muted-foreground">{result.intro}</p>
          <div className="mt-4 grid gap-3">
            {result.examples.map((ex, i) => (
              <div key={i} className="rounded-xl border p-3">
                <div className="font-mono">{ex.en}</div>
                <div className="text-sm text-muted-foreground mt-1">{ex.uz}</div>
                {ex.note && (
                  <div className="text-xs mt-1 text-primary">💡 {ex.note}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
