import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { genDailyChallenge, gradeTranslation, type DailyTask } from "@/lib/ai.functions";
import type { Profile } from "@/lib/types";
import { updateProfile } from "@/lib/profile";
import { aiErrorMessage, isAuthError } from "@/lib/ai-error";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";


interface Props { profile: Profile; onBack: () => void }

export default function DailyChallenge({ profile, onBack }: Props) {
  const gen = useServerFn(genDailyChallenge);
  const grade = useServerFn(gradeTranslation);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [needAuth, setNeedAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const started = useRef(false);

  async function load() {
    setLoading(true);
    setErr(null);
    setNeedAuth(false);
    try {
      // Protected server functions need the current access token. Confirm the
      // browser session first so an anonymous visit never sends a doomed RPC.
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session?.access_token) {
        setNeedAuth(true);
        setErr("AI funksiyalari uchun Google bilan kirish kerak.");
        return;
      }
      const t = await gen({ data: { age: profile.age ?? 20, level: profile.levelChosen ?? "past" } });
      setTasks(t);
    } catch (e) {
      setNeedAuth(isAuthError(e));
      setErr(aiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    if (started.current) return;
    started.current = true;
    load();
  }, []); // eslint-disable-line

  function finish() {
    updateProfile({ dailyChallengeDate: new Date().toISOString().slice(0, 10), dailyChallengeDone: true });
    setDone(true);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="card-surface p-8">⚡ Yuklanmoqda...</div></div>;
  }

  if (err || tasks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-surface p-6 max-w-md text-center">
          <div className="text-3xl">{needAuth ? "🔐" : "😕"}</div>
          <div className="mt-2 font-semibold">
            {needAuth ? "Google bilan kirish kerak" : "Vazifalarni yuklab bo'lmadi"}
          </div>
          {err && <div className="mt-1 text-xs text-muted-foreground break-words">{err}</div>}
          <div className="mt-4 flex gap-2 justify-center">
            {needAuth ? (
              <button
                onClick={() => lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })}
                className="btn-primary"
              >
                Google bilan kirish
              </button>
            ) : (
              <button onClick={load} className="btn-primary">Qayta urinish</button>
            )}
            <button onClick={onBack} className="btn-ghost">Orqaga</button>
          </div>

        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-surface p-8 text-center max-w-md w-full">
          <div className="text-6xl">🏆</div>
          <h2 className="mt-3 text-2xl font-bold">Bugungi challenge yakunlandi!</h2>
          <button onClick={onBack} className="btn-primary mt-6">Panelga</button>
        </div>
      </div>
    );
  }

  const task = tasks[idx];
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost text-sm">← Panelga</button>
        <div className="text-xs text-muted-foreground">Vazifa {idx + 1}/{tasks.length}</div>
      </div>
      <div className="card-surface p-6 md:p-8 mt-6">
        {task.type === "quiz" && (
          <QuizTask task={task} onDone={() => (idx + 1 >= tasks.length ? finish() : setIdx(idx + 1))} />
        )}
        {task.type === "translate" && (
          <TranslateTask
            task={task}
            age={profile.age ?? 20}
            grade={grade}
            onDone={() => (idx + 1 >= tasks.length ? finish() : setIdx(idx + 1))}
          />
        )}
        {task.type === "match" && (
          <MatchTask task={task} onDone={() => (idx + 1 >= tasks.length ? finish() : setIdx(idx + 1))} />
        )}
      </div>
    </div>
  );
}

function QuizTask({ task, onDone }: { task: any; onDone: () => void }) {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <>
      <div className="text-xs uppercase text-muted-foreground">Quiz</div>
      <h3 className="mt-2 text-xl font-semibold">{task.q}</h3>
      <div className="mt-4 grid gap-2">
        {task.choices.map((c: string, i: number) => (
          <button key={i} disabled={pick !== null} onClick={() => setPick(i)}
            className={`text-left rounded-xl border p-3 ${
              pick === null ? "hover:bg-accent" :
              i === task.answerIndex ? "border-green-500 bg-green-500/10" :
              i === pick ? "border-red-500 bg-red-500/10" : "opacity-60"
            }`}>
            {c}
          </button>
        ))}
      </div>
      {pick !== null && (
        <>
          <div className="mt-3 text-sm p-3 rounded-xl bg-accent">{task.explanation}</div>
          <button onClick={onDone} className="btn-primary mt-3">Keyingi →</button>
        </>
      )}
    </>
  );
}

function TranslateTask({ task, age, grade, onDone }: any) { // eslint-disable-line
  const [val, setVal] = useState("");
  const [g, setG] = useState<any>(null); // eslint-disable-line
  const [busy, setBusy] = useState(false);
  async function check() {
    setBusy(true);
    try {
      const r = await grade({ data: { source: task.source, userAnswer: val, direction: task.direction, age } });
      setG(r);
    } finally { setBusy(false); }
  }
  return (
    <>
      <div className="text-xs uppercase text-muted-foreground">Tarjima</div>
      <div className="mt-2 text-lg">{task.source}</div>
      <textarea value={val} onChange={(e) => setVal(e.target.value)} disabled={!!g} rows={2}
        className="mt-3 w-full rounded-2xl border p-3 bg-background" />
      {!g ? (
        <button onClick={check} disabled={!val.trim() || busy} className="btn-primary mt-3 disabled:opacity-40">
          {busy ? "..." : "Tekshirish"}
        </button>
      ) : (
        <>
          <div className="mt-3 p-3 rounded-xl bg-accent text-sm">
            <div className="font-bold">{g.score}/100</div>
            <div className="mt-1">{g.feedback}</div>
            <div className="mt-1 text-muted-foreground">Ideal: {g.ideal}</div>
          </div>
          <button onClick={onDone} className="btn-primary mt-3">Keyingi →</button>
        </>
      )}
    </>
  );
}

function MatchTask({ task, onDone }: { task: any; onDone: () => void }) {
  const [shown, setShown] = useState(false);
  return (
    <>
      <div className="text-xs uppercase text-muted-foreground">So'zni eslang</div>
      <div className="mt-2 text-3xl font-bold">{task.word}</div>
      <div className="mt-2 text-sm text-muted-foreground">O'zbekcha ma'nosini o'ylab ko'ring.</div>
      {!shown ? (
        <button onClick={() => setShown(true)} className="btn-primary mt-4">Javobni ko'rish</button>
      ) : (
        <>
          <div className="mt-4 p-3 rounded-xl bg-accent">
            <div className="text-lg font-semibold">{task.translation}</div>
            <div className="text-sm italic mt-1">"{task.example}"</div>
          </div>
          <button onClick={onDone} className="btn-primary mt-3">Keyingi →</button>
        </>
      )}
    </>
  );
}
