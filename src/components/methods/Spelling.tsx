import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { genSpellingWords } from "@/lib/ai.functions";
import { addMistake, countAnswer } from "@/lib/profile";
import type { Profile } from "@/lib/types";

interface Props {
  profile: Profile;
  onBack: () => void;
}
interface W {
  word: string;
  translation: string;
  hint: string;
  pronunciation: string;
}

export default function Spelling({ profile, onBack }: Props) {
  const gen = useServerFn(genSpellingWords);
  const [topic, setTopic] = useState("");
  const [items, setItems] = useState<W[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState<"none" | "right" | "wrong">("none");
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const startedRef = useRef(false);

  async function load(t: string) {
    setLoading(true);
    try {
      const data = await gen({ data: { age: profile.age ?? 20, topic: t || "umumiy", count: 8 } });
      setItems(data);
      setIdx(0);
      setInput("");
      setFeedback("none");
      setShowHint(false);
      setDone(false);
      setScore(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      // wait until user picks
    }
  }, []);

  function check() {
    if (!items[idx]) return;
    const ok = input.trim().toLowerCase() === items[idx].word.toLowerCase();
    setFeedback(ok ? "right" : "wrong");
    countAnswer(ok);
    if (ok) setScore((s) => s + 1);
    else
      addMistake({
        questionId: `sp-${Date.now()}-${idx}`,
        question: `Yozing: ${items[idx].translation}`,
        wrongAnswer: input,
        correctAnswer: items[idx].word,
        at: new Date().toISOString(),
        tag: "spelling",
      });
  }

  function next() {
    if (idx + 1 >= items.length) setDone(true);
    else {
      setIdx((v) => v + 1);
      setInput("");
      setFeedback("none");
      setShowHint(false);
    }
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
        <button onClick={onBack} className="btn-ghost text-sm">← Panelga</button>
        <h2 className="mt-6 text-2xl md:text-3xl font-bold">✍️ Yozish mashqi</h2>
        <p className="text-muted-foreground mt-1">
          O'zbekcha ma'nosini ko'ring — inglizcha so'zni to'g'ri yozing.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Mavzu (masalan: IT, ovqat, sport)"
            className="flex-1 rounded-2xl border p-4 bg-background"
          />
          <button onClick={() => load(topic.trim())} className="btn-primary">Boshlash</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-surface p-8 text-center">
          <div className="text-4xl animate-pulse">✍️</div>
          <div className="mt-3">So'zlar tayyorlanmoqda...</div>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-surface p-8 text-center max-w-md w-full">
          <div className="text-6xl">🎉</div>
          <h2 className="mt-3 text-2xl font-bold">{score}/{items.length}</h2>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={onBack} className="btn-ghost">Panelga</button>
            <button onClick={() => load(topic.trim())} className="btn-primary">Yana</button>
          </div>
        </div>
      </div>
    );
  }

  const w = items[idx];
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost text-sm">← Panelga</button>
        <div className="text-xs text-muted-foreground">{idx + 1}/{items.length}</div>
      </div>
      <div className="card-surface p-6 md:p-8 mt-6">
        <div className="text-xs uppercase text-muted-foreground">O'zbekcha</div>
        <div className="text-2xl md:text-3xl font-bold mt-1">{w.translation}</div>
        <div className="text-sm text-primary mt-1">🔊 {w.pronunciation}</div>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={feedback !== "none"}
          placeholder="Inglizcha yozing..."
          onKeyDown={(e) => e.key === "Enter" && (feedback === "none" ? check() : next())}
          className={`mt-6 w-full rounded-2xl border p-4 bg-background text-lg ${
            feedback === "right" ? "border-green-500" : feedback === "wrong" ? "border-red-500" : ""
          }`}
        />

        {feedback === "wrong" && (
          <div className="mt-2 text-sm">
            To'g'ri: <span className="font-mono font-bold">{w.word}</span>
          </div>
        )}

        <div className="mt-4 flex gap-2 flex-wrap">
          {feedback === "none" ? (
            <>
              <button onClick={() => setShowHint(true)} className="btn-ghost text-sm">💡 Hint</button>
              <button onClick={check} disabled={!input.trim()} className="btn-primary disabled:opacity-40">
                Tekshirish
              </button>
            </>
          ) : (
            <button onClick={next} className="btn-primary">
              {idx + 1 >= items.length ? "Yakunlash" : "Keyingi →"}
            </button>
          )}
        </div>
        {showHint && feedback === "none" && (
          <div className="mt-3 p-3 rounded-xl bg-accent text-sm font-mono">{w.hint}</div>
        )}
      </div>
    </div>
  );
}
