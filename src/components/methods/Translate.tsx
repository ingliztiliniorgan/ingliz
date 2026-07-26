import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { genTranslateSet, gradeTranslation } from "@/lib/ai.functions";
import type { Profile } from "@/lib/types";

interface Props { profile: Profile; onBack: () => void }
interface Item { source: string; ideal: string }
interface Grade {
  score: number;
  ideal: string;
  feedback: string;
  corrections: { was: string; should: string }[];
}

export default function Translate({ profile, onBack }: Props) {
  const setFn = useServerFn(genTranslateSet);
  const gradeFn = useServerFn(gradeTranslation);
  const [direction, setDirection] = useState<"uz-en" | "en-uz">("uz-en");
  const [topic, setTopic] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const data = await setFn({ data: { age: profile.age ?? 20, direction, topic: topic || "umumiy", count: 5 } });
      setItems(data); setIdx(0); setInput(""); setGrade(null);
    } finally { setLoading(false); }
  }

  async function check() {
    setLoading(true);
    try {
      const g = await gradeFn({
        data: { source: items[idx].source, userAnswer: input, direction, age: profile.age ?? 20 },
      });
      setGrade(g);
    } finally { setLoading(false); }
  }

  function next() {
    if (idx + 1 >= items.length) { setItems([]); return; }
    setIdx(idx + 1); setInput(""); setGrade(null);
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
        <button onClick={onBack} className="btn-ghost text-sm">← Panelga</button>
        <h2 className="mt-6 text-2xl md:text-3xl font-bold">🌍 Tarjima</h2>
        <p className="text-muted-foreground mt-1">Gaplarni tarjima qiling — AI baholaydi va tuzatadi.</p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={() => setDirection("uz-en")}
            className={`p-3 rounded-2xl border ${direction === "uz-en" ? "bg-primary text-primary-foreground" : ""}`}>
            🇺🇿 → 🇬🇧
          </button>
          <button onClick={() => setDirection("en-uz")}
            className={`p-3 rounded-2xl border ${direction === "en-uz" ? "bg-primary text-primary-foreground" : ""}`}>
            🇬🇧 → 🇺🇿
          </button>
        </div>
        <div className="mt-4 flex gap-2">
          <input value={topic} onChange={(e) => setTopic(e.target.value)}
            placeholder="Mavzu (ixtiyoriy)"
            className="flex-1 rounded-2xl border p-4 bg-background" />
          <button onClick={start} disabled={loading} className="btn-primary disabled:opacity-40">
            {loading ? "..." : "Boshlash"}
          </button>
        </div>
      </div>
    );
  }

  const it = items[idx];
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost text-sm">← Panelga</button>
        <div className="text-xs text-muted-foreground">{idx + 1}/{items.length}</div>
      </div>
      <div className="card-surface p-6 md:p-8 mt-6">
        <div className="text-xs uppercase text-muted-foreground">
          {direction === "uz-en" ? "Inglizchaga tarjima qiling" : "O'zbekchaga tarjima qiling"}
        </div>
        <div className="text-xl md:text-2xl font-semibold mt-2">{it.source}</div>
        <textarea
          value={input} onChange={(e) => setInput(e.target.value)} disabled={!!grade}
          rows={3} placeholder="Sizning tarjimangiz..."
          className="mt-4 w-full rounded-2xl border p-4 bg-background" />

        {!grade ? (
          <button onClick={check} disabled={!input.trim() || loading}
            className="btn-primary mt-3 disabled:opacity-40">
            {loading ? "Baholanmoqda..." : "Tekshirish"}
          </button>
        ) : (
          <>
            <div className="mt-4 p-4 rounded-xl bg-accent">
              <div className="text-3xl font-bold">{grade.score}/100</div>
              <div className="text-sm mt-2">{grade.feedback}</div>
              <div className="mt-3 text-sm">
                <span className="text-muted-foreground">Ideal:</span>{" "}
                <span className="font-medium">{grade.ideal}</span>
              </div>
              {grade.corrections?.length > 0 && (
                <ul className="mt-2 text-xs space-y-1">
                  {grade.corrections.map((c, i) => (
                    <li key={i}>❌ {c.was} → ✅ {c.should}</li>
                  ))}
                </ul>
              )}
            </div>
            <button onClick={next} className="btn-primary mt-3">
              {idx + 1 >= items.length ? "Yakunlash" : "Keyingi →"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
