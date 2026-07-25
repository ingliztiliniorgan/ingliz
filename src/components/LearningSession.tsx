import { useState } from "react";
import { pickQuestion } from "@/lib/questions";
import type { Profile, QItem } from "@/lib/types";
import { addMistake } from "@/lib/profile";
import { ageBandOf } from "@/lib/theme";

interface Props {
  profile: Profile;
  onExit: () => void;
}

type Method = "quiz" | "rules" | "skills" | "topics" | "flashcards";

const methods: { key: Method; title: string; desc: string; emoji: string }[] = [
  { key: "quiz", title: "Savollar orqali", desc: "AI turli savollar berib o'rgatadi", emoji: "❓" },
  { key: "rules", title: "Qoidalar bo'yicha", desc: "Har mavzu misollar bilan tushuntiriladi", emoji: "📘" },
  { key: "skills", title: "Ko'nikmalar", desc: "Vocabulary, Grammar, Reading…", emoji: "🎯" },
  { key: "topics", title: "Mavzular", desc: "IT, sayohat, biznes, kundalik", emoji: "🧭" },
  { key: "flashcards", title: "Flashcards", desc: "Kontekstli kartochkalar", emoji: "🃏" },
];

const introFor = (p: Profile) => {
  const band = ageBandOf(p.age);
  if (band === "kid") return "Salom, do'stim! Men Linny — sizga inglizchani o'yin qilib o'rgataman. Tayyormisan?";
  if (band === "teen") return "Salom! Men Linny — sening ingliz tili yordamching. Boshlaymizmi?";
  return "Assalomu alaykum. Men Linny — sizning shaxsiy ingliz tili o'qituvchingiz. Tayyor bo'lsangiz, boshlaymiz.";
};

export default function LearningSession({ profile, onExit }: Props) {
  const [stage, setStage] = useState<"intro" | "method" | "session">("intro");
  const [chosen, setChosen] = useState<Method[]>([]);
  const [q, setQ] = useState<QItem | null>(null);
  const [used] = useState<Set<string>>(new Set());
  const [answer, setAnswer] = useState<number | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  const [streak, setStreak] = useState(0);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(() => {
    const s = profile.placementScore ?? 0;
    if (s < 30) return 1;
    if (s < 55) return 2;
    if (s < 75) return 3;
    if (s < 90) return 4;
    return 5;
  });

  function next() {
    const nq = pickQuestion(difficulty, used);
    if (nq) {
      used.add(nq.id);
      setQ(nq);
      setAnswer(null);
      setShowWhy(false);
    }
  }

  function start() {
    setStage("session");
    setTimeout(() => next(), 0);
  }

  function handlePick(i: number) {
    if (!q || answer !== null) return;
    setAnswer(i);
    const ok = i === q.answerIndex;
    if (ok) {
      const s = streak + 1;
      setStreak(s);
      if (s >= 2 && difficulty < 5) {
        setDifficulty((d) => (d + 1) as 1 | 2 | 3 | 4 | 5);
        setStreak(0);
      }
    } else {
      setStreak(0);
      addMistake({
        questionId: q.id,
        wrongAnswer: q.choices[i],
        correctAnswer: q.choices[q.answerIndex],
        at: new Date().toISOString(),
      });
    }
  }

  if (stage === "intro") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-surface max-w-lg w-full p-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full gradient-brand flex items-center justify-center text-4xl">
            🦉
          </div>
          <h2 className="mt-4 text-2xl font-bold">Linny</h2>
          <p className="mt-3 text-muted-foreground">{introFor(profile)}</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={onExit} className="btn-ghost">Keyinroq</button>
            <button onClick={() => setStage("method")} className="btn-primary">
              Boshladik 🚀
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "method") {
    const toggle = (m: Method) =>
      setChosen((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
    return (
      <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
        <button onClick={onExit} className="btn-ghost text-sm">← Panelga</button>
        <h2 className="mt-6 text-2xl md:text-3xl font-bold">
          Ingliz tilini qanday o'rganmoqchisiz?
        </h2>
        <p className="text-muted-foreground mt-1">Bir yoki bir nechta yo'lni tanlashingiz mumkin.</p>

        <div className="mt-6 grid md:grid-cols-2 gap-3">
          {methods.map((m) => {
            const active = chosen.includes(m.key);
            return (
              <button
                key={m.key}
                onClick={() => toggle(m.key)}
                className={`card-surface p-4 text-left transition-all hover:-translate-y-0.5 ${
                  active ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{m.emoji}</div>
                  <div>
                    <div className="font-semibold">{m.title}</div>
                    <div className="text-sm text-muted-foreground">{m.desc}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            className="btn-primary disabled:opacity-40"
            disabled={chosen.length === 0}
            onClick={start}
          >
            Sessiyani boshlash
          </button>
        </div>
      </div>
    );
  }

  // session
  if (!q) return null;
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="btn-ghost text-sm">← Panelga</button>
        <div className="text-xs text-muted-foreground">
          Daraja: {difficulty} · Ketma-ket to'g'ri: {streak}
        </div>
      </div>

      <div className="card-surface p-6 md:p-8 mt-6">
        <h2 className="text-xl md:text-2xl font-semibold leading-snug">{q.q}</h2>
        <div className="mt-6 grid gap-3">
          {q.choices.map((c, i) => {
            const chosenI = answer === i;
            const isRight = q.answerIndex === i;
            let cls = "text-left rounded-2xl border p-4 transition-all hover:bg-accent";
            if (answer !== null) {
              if (isRight) cls += " border-green-500 bg-green-500/10";
              else if (chosenI) cls += " border-red-500 bg-red-500/10";
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
          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <button onClick={() => setShowWhy((v) => !v)} className="btn-ghost text-sm">
              {showWhy ? "Yopish" : "Nega? 🤔"}
            </button>
            <button onClick={next} className="btn-primary">Keyingi →</button>
          </div>
        )}
        {showWhy && (
          <div className="mt-3 p-4 rounded-xl bg-accent text-accent-foreground text-sm">
            {q.explanation}
          </div>
        )}
      </div>
    </div>
  );
}
