import { useEffect, useState } from "react";
import { dailyGoalState, setDailyGoal } from "@/lib/profile";

const OPTIONS = [5, 10, 20, 30];

/**
 * Kunlik maqsad — faqat qurilmadagi ma'lumot bilan ishlaydi (AI/limit sarflamaydi).
 * Har bir javob (quiz, yozish) shu hisobga qo'shiladi.
 */
export default function DailyGoalCard() {
  const [state, setState] = useState({ goal: 10, count: 0, correct: 0, history: [] as { date: string; count: number }[] });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setState(dailyGoalState());
  }, []);

  const pct = Math.min(100, Math.round((state.count / Math.max(1, state.goal)) * 100));
  const done = state.count >= state.goal;
  const accuracy = state.count > 0 ? Math.round((state.correct / state.count) * 100) : 0;

  const last7 = (() => {
    const days: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      days.push({ date: d, count: state.history.find((h) => h.date === d)?.count ?? 0 });
    }
    return days;
  })();

  function choose(g: number) {
    setDailyGoal(g);
    setState((s) => ({ ...s, goal: g }));
    setEditing(false);
  }

  return (
    <section className="mt-6 card-surface p-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-xs uppercase text-muted-foreground">Kunlik maqsad</div>
          <div className="mt-1 text-2xl font-bold">
            {state.count} / {state.goal} savol {done ? "✅" : ""}
          </div>
        </div>
        <button onClick={() => setEditing((v) => !v)} className="btn-ghost text-sm">
          🎯 Maqsadni o'zgartirish
        </button>
      </div>

      <div className="mt-3 h-3 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${done ? "bg-emerald-500" : "bg-primary"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-2 text-sm text-muted-foreground">
        {done
          ? "Bugungi maqsad bajarildi — zo'r ish! 🔥"
          : `Yana ${state.goal - state.count} savol qoldi.`}
        {state.count > 0 && <> · To'g'ri javoblar: {accuracy}%</>}
      </div>

      {editing && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {OPTIONS.map((g) => (
            <button
              key={g}
              onClick={() => choose(g)}
              className={`p-2 rounded-xl border text-sm ${
                state.goal === g ? "border-primary bg-primary/10 font-semibold" : "hover:bg-accent"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4">
        <div className="text-xs uppercase text-muted-foreground">Oxirgi 7 kun</div>
        <div className="mt-2 flex items-end gap-2 h-16">
          {last7.map((d) => {
            const h = Math.min(100, (d.count / Math.max(1, state.goal)) * 100);
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div
                  title={`${d.date}: ${d.count}`}
                  className={`w-full rounded-t-md ${d.count >= state.goal ? "bg-emerald-500" : d.count > 0 ? "bg-primary/70" : "bg-muted"}`}
                  style={{ height: `${Math.max(6, h)}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{d.date.slice(8)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
