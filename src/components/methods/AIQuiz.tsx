import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { genQuestions, deepExplain } from "@/lib/ai.functions";
import type { Profile } from "@/lib/types";
import { addMistake, countAnswer } from "@/lib/profile";

interface AIQ {
  q: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  hint?: string;
  tag?: string;
}

interface Props {
  profile: Profile;
  defaultTopic?: string;
  askTopic?: boolean;
  skill?: "vocabulary" | "grammar" | "reading" | "speaking" | "general";
  title: string;
  intro: string;
  onBack: () => void;
}

export default function AIQuiz({ profile, defaultTopic, askTopic = true, skill = "general", title, intro, onBack }: Props) {
  const gen = useServerFn(genQuestions);
  const deep = useServerFn(deepExplain);
  const difficulty = profile.difficulty ?? "orta";

  const [topic, setTopic] = useState(defaultTopic ?? "");
  const [stage, setStage] = useState<"input" | "loading" | "quiz" | "done">(askTopic ? "input" : "loading");
  const [items, setItems] = useState<AIQ[]>([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showWhy, setShowWhy] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [deepR, setDeepR] = useState<null | { summary: string; why: string; examples: {en:string;uz:string}[]; mnemonic: string }>(null);
  const [deepLoading, setDeepLoading] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const maxAttempts = difficulty === "qiyin" ? 1 : difficulty === "orta" ? 2 : 3;

  async function load(useTopic: string) {
    setStage("loading");
    setError(null);
    try {
      const data = await gen({
        data: {
          age: profile.age ?? 20,
          level: profile.levelChosen ?? "past",
          topic: useTopic,
          count: 6,
          skill,
          difficulty,
        },
      });
      if (!data?.length) throw new Error("empty");
      setItems(data);
      setIdx(0);
      setCorrect(0);
      resetQ();
      setStage("quiz");
    } catch (e) {
      console.error(e);
      setError((e as Error)?.message || "Savollarni yuklab bo'lmadi.");
      setStage("input");
    }
  }

  function resetQ() {
    setAnswer(null);
    setAttempts(0);
    setShowWhy(false);
    setShowHint(false);
    setDeepR(null);
  }

  const autoLoadedRef = useRef(false);
  useEffect(() => {
    if (!askTopic && !autoLoadedRef.current) {
      autoLoadedRef.current = true;
      load(defaultTopic ?? "general English");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (stage === "input") {
    return (
      <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
        <button onClick={onBack} className="btn-ghost text-sm">← Orqaga</button>
        <h2 className="mt-6 text-2xl md:text-3xl font-bold">{title}</h2>
        <p className="text-muted-foreground mt-1">{intro}</p>
        <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
          placeholder="Masalan: futbol, dasturlash, sayohat, oila, Photoshop..."
          className="mt-6 w-full rounded-2xl border p-4 bg-background focus:outline-none focus:ring-2 focus:ring-primary" />
        {error && <div className="mt-3 text-sm text-red-500">{error}</div>}
        <button disabled={topic.trim().length < 2} onClick={() => load(topic.trim())}
          className="btn-primary mt-4 disabled:opacity-40">
          AI savol tayyorlasin →
        </button>
      </div>
    );
  }

  if (stage === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-surface p-8 text-center">
          <div className="text-4xl animate-pulse">🧠</div>
          <div className="mt-3">AI siz uchun savol tayyorlayapti...</div>
        </div>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-surface p-8 text-center max-w-md w-full">
          <div className="text-6xl">🎉</div>
          <h2 className="mt-3 text-2xl font-bold">Tabriklaymiz!</h2>
          <p className="mt-2 text-muted-foreground">{correct} / {items.length} to'g'ri javob</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={onBack} className="btn-ghost">Panelga</button>
            <button onClick={() => (askTopic ? setStage("input") : load(defaultTopic ?? ""))} className="btn-primary">Yana</button>
          </div>
        </div>
      </div>
    );
  }

  const q = items[idx];
  if (!q) return null;

  function handlePick(i: number) {
    if (answer !== null) return;
    if (i === q.answerIndex) {
      setAnswer(i);
      setCorrect((c) => c + 1);
      countAnswer(true);
      return;
    }
    // Wrong pick
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    if (newAttempts >= maxAttempts) {
      setAnswer(i);
      countAnswer(false);
      addMistake({
        questionId: `ai-${Date.now()}-${idx}`,
        question: q.q,
        wrongAnswer: q.choices[i],
        correctAnswer: q.choices[q.answerIndex],
        explanation: q.explanation,
        tag: q.tag ?? skill,
        at: new Date().toISOString(),
      });
    }
  }

  function next() {
    if (idx + 1 >= items.length) setStage("done");
    else {
      setIdx((v) => v + 1);
      resetQ();
    }
  }

  async function askDeep() {
    setDeepLoading(true);
    try {
      const r = await deep({
        data: {
          age: profile.age ?? 20,
          question: q.q,
          wrongAnswer: answer !== null && answer !== q.answerIndex ? q.choices[answer] : undefined,
          correctAnswer: q.choices[q.answerIndex],
        },
      });
      setDeepR(r);
    } finally { setDeepLoading(false); }
  }

  const isAnswered = answer !== null;
  const isCorrect = isAnswered && answer === q.answerIndex;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost text-sm">← Panelga</button>
        <div className="text-xs text-muted-foreground">
          {idx + 1} / {items.length} · {difficulty === "oson" ? "🟢" : difficulty === "orta" ? "🟡" : "🔴"} {difficulty}
        </div>
      </div>

      <div className="card-surface p-6 md:p-8 mt-6">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">{q.q}</h2>
        {difficulty === "oson" && q.hint && !isAnswered && (
          <button onClick={() => setShowHint(true)} className="mt-2 text-sm text-primary hover:underline">
            💡 Hint kerakmi?
          </button>
        )}
        {showHint && q.hint && (
          <div className="mt-2 p-3 rounded-xl bg-accent text-sm">💡 {q.hint}</div>
        )}

        <div className="mt-6 grid gap-3">
          {q.choices.map((c, i) => {
            const chosen = answer === i;
            const isRight = q.answerIndex === i;
            let cls = "text-left rounded-2xl border p-4 transition-all";
            if (isAnswered) {
              if (isRight) cls += " border-green-500 bg-green-500/10";
              else if (chosen) cls += " border-red-500 bg-red-500/10";
              else cls += " opacity-60";
            } else {
              cls += " hover:bg-accent";
            }
            return (
              <button key={i} disabled={isAnswered} onClick={() => handlePick(i)} className={cls}>
                <span className="font-mono text-xs mr-2 text-muted-foreground">{String.fromCharCode(65 + i)}</span>
                {c}
              </button>
            );
          })}
        </div>

        {!isAnswered && attempts > 0 && (
          <div className="mt-3 text-sm text-red-500">
            ❌ Noto'g'ri. {maxAttempts - attempts} ta urinish qoldi.
          </div>
        )}

        {isAnswered && (
          <>
            <div className="mt-5 flex items-center gap-3 flex-wrap">
              <button onClick={() => setShowWhy((v) => !v)} className="btn-ghost text-sm">
                {showWhy ? "Yopish" : "Nega? 🤔"}
              </button>
              <button onClick={askDeep} disabled={deepLoading || !!deepR} className="btn-ghost text-sm disabled:opacity-40">
                {deepLoading ? "..." : "Ko'proq ma'lumot 📚"}
              </button>
              <button onClick={next} className="btn-primary ml-auto">
                {idx + 1 >= items.length ? "Yakunlash" : "Keyingi →"}
              </button>
            </div>
            {showWhy && (
              <div className="mt-3 p-4 rounded-xl bg-accent text-sm">
                <div className="font-semibold mb-1">{isCorrect ? "✅ To'g'ri!" : "❌ To'g'ri javob:"} {q.choices[q.answerIndex]}</div>
                {q.explanation}
              </div>
            )}
            {deepR && (
              <div className="mt-3 p-4 rounded-2xl border-2 border-primary/40 bg-primary/5 text-sm space-y-3">
                <div><span className="font-bold">📌 Xulosa:</span> {deepR.summary}</div>
                <div><span className="font-bold">🎯 Nima uchun:</span> {deepR.why}</div>
                {deepR.examples.length > 0 && (
                  <div>
                    <div className="font-bold">📖 Yana misollar:</div>
                    <ul className="mt-1 space-y-1">
                      {deepR.examples.map((e, i) => (
                        <li key={i}><span className="font-mono">{e.en}</span> — {e.uz}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="p-2 rounded-lg bg-background">🧠 <span className="italic">{deepR.mnemonic}</span></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
