import { useEffect, useMemo, useState } from "react";
import { pickQuestion, QUESTIONS } from "@/lib/questions";
import type { LevelName, QItem } from "@/lib/types";
import { addMistake } from "@/lib/profile";

interface Props {
  startLevel: LevelName;
  totalQuestions?: number;
  age?: number;
  onFinish: (result: { score: number; correct: number; total: number; stars: number }) => void;
  onExit: () => void;
}

const startDifficulty: Record<LevelName, 1 | 2 | 3 | 4 | 5> = {
  past: 1,
  orta: 3,
  yaxshi: 4,
};

const floorDifficulty: Record<LevelName, 1 | 2 | 3 | 4 | 5> = {
  past: 1,
  orta: 2,
  yaxshi: 3,
};

export default function PlacementTest({
  startLevel,
  totalQuestions = 20,
  age,
  onFinish,
  onExit,
}: Props) {
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(startDifficulty[startLevel]);
  const [used] = useState<Set<string>>(() => new Set());
  const [current, setCurrent] = useState<QItem | null>(null);
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const floor = floorDifficulty[startLevel];

  // Yosh bola + past daraja: faqat vocab/numbers/pronoun kabi oson mavzular
  const kidBeginner = (age ?? 99) <= 10 && startLevel === "past";
  const easyTopics = new Set(["vocab", "numbers", "pronoun", "articles", "be", "have", "question"]);
  const topicFilter = kidBeginner
    ? (t: string | undefined) => (t ? easyTopics.has(t) : false)
    : undefined;

  useEffect(() => {
    const q = pickQuestion(difficulty, used, { topicFilter });
    if (q) {
      used.add(q.id);
      setCurrent(q);
      setAnswer(null);
      setShowWhy(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const progress = useMemo(() => Math.round((index / totalQuestions) * 100), [index, totalQuestions]);

  function handlePick(i: number) {
    if (answer !== null || !current) return;
    setAnswer(i);
    const isRight = i === current.answerIndex;
    let nextStreak = isRight ? streak + 1 : 0;
    const newCorrect = correct + (isRight ? 1 : 0);

    let nextDiff: 1 | 2 | 3 | 4 | 5 = difficulty;
    if (isRight && nextStreak >= 2 && difficulty < 5) {
      nextDiff = (difficulty + 1) as 1 | 2 | 3 | 4 | 5;
      nextStreak = 0;
    } else if (!isRight) {
      if (startLevel === "past" && difficulty > floor) {
        nextDiff = (difficulty - 1) as 1 | 2 | 3 | 4 | 5;
      }
    }
    if (nextDiff < floor) nextDiff = floor;
    if (kidBeginner && nextDiff > 2) nextDiff = 2;

    if (!isRight) {
      addMistake({
        questionId: current.id,
        wrongAnswer: current.choices[i],
        correctAnswer: current.choices[current.answerIndex],
        at: new Date().toISOString(),
      });
    }

    setStreak(nextStreak);
    setCorrect(newCorrect);
    setDifficulty(nextDiff);

    setTimeout(() => {
      if (index + 1 >= totalQuestions || used.size >= QUESTIONS.length) {
        const score = Math.round((newCorrect / (index + 1)) * 100);
        const stars = Math.max(1, Math.min(5, Math.ceil(score / 20)));
        onFinish({ score, correct: newCorrect, total: index + 1, stars });
      } else {
        setIndex((v) => v + 1);
      }
    }, 900);
  }

  if (!current) return null;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <button onClick={onExit} className="btn-ghost text-sm">← Chiqish</button>
        <div className="flex-1">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full gradient-brand transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1 text-xs text-muted-foreground text-right">
            {index + 1} / {totalQuestions} · Daraja: {difficulty}
          </div>
        </div>
      </header>

      <div className="card-surface p-6 md:p-8 animate-in fade-in">
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
          Savol #{index + 1}
        </div>
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">{current.q}</h2>

        <div className="mt-6 grid gap-3">
          {current.choices.map((c, i) => {
            const chosen = answer === i;
            const isRight = current.answerIndex === i;
            let cls = "text-left rounded-2xl border p-4 transition-all hover:bg-accent";
            if (answer !== null) {
              if (isRight) cls += " border-green-500 bg-green-500/10";
              else if (chosen) cls += " border-red-500 bg-red-500/10";
              else cls += " opacity-60";
            }
            return (
              <button
                key={i}
                disabled={answer !== null}
                onClick={() => handlePick(i)}
                className={cls}
              >
                <span className="font-mono text-xs mr-2 text-muted-foreground">
                  {String.fromCharCode(65 + i)}
                </span>
                {c}
              </button>
            );
          })}
        </div>

        {answer !== null && (
          <div className="mt-5">
            <button onClick={() => setShowWhy((v) => !v)} className="btn-ghost text-sm">
              {showWhy ? "Yopish" : "Nega? 🤔"}
            </button>
            {showWhy && (
              <div className="mt-3 p-4 rounded-xl bg-accent text-accent-foreground text-sm">
                {current.explanation}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground text-center">
        To'g'ri: {correct} · Ketma-ket: {streak}
      </div>
    </div>
  );
}
