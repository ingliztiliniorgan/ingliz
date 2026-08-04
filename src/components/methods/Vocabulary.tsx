import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ensureTodaysWords,
  markWordsShown,
  toggleFavorite,
  listFavorites,
  setDailyWordCount,
  buildVocabTest,
  finalizeVocabTest,
  type VocabRow,
} from "@/lib/vocab.functions";
import { getVocabConfig, resetVocabBank } from "@/lib/vocabbank.functions";
import VocabSource from "./VocabSource";
import type { Profile } from "@/lib/types";
import { useAuthUser } from "@/hooks/useCloudSync";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";


interface Props {
  profile: Profile;
  onBack: () => void;
}

type Stage = "home" | "setup" | "learn" | "test" | "favorites" | "result" | "source";

export default function Vocabulary({ onBack }: Props) {
  const ensure = useServerFn(ensureTodaysWords);
  const mark = useServerFn(markWordsShown);
  const fav = useServerFn(toggleFavorite);
  const setCount = useServerFn(setDailyWordCount);
  const build = useServerFn(buildVocabTest);
  const finalize = useServerFn(finalizeVocabTest);
  const favs = useServerFn(listFavorites);
  const config = useServerFn(getVocabConfig);
  const resetBank = useServerFn(resetVocabBank);

  const user = useAuthUser();
  const [stage, setStage] = useState<Stage>("home");
  const [words, setWords] = useState<VocabRow[]>([]);
  const [dailyCount, setDailyCountLocal] = useState<number>(10);
  const [testedToday, setTestedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [bank, setBank] = useState<{ total: number; used: number } | null>(null);
  const started = useRef(false);

  async function reload() {
    setLoading(true);
    setErr(null);
    try {
      // Ask for the learning source before generating anything.
      const cfg = await config();
      setDailyCountLocal(cfg.dailyCount);
      setBank(cfg.bankTotal > 0 ? { total: cfg.bankTotal, used: cfg.bankUsed } : null);
      if (!cfg.source) {
        setStage("source");
        setLoading(false);
        return;
      }
      const r = await ensure();
      setWords(r.words);
      setDailyCountLocal(r.dailyCount);
      setTestedToday(r.testedToday);
      setStage("home");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (started.current) return;
    if (user === null) {
      setLoading(false);
      return;
    }
    if (user) {
      started.current = true;
      reload();
    }
  }, [user]); // eslint-disable-line


  const anyShown = words.some((w) => w.status !== "pending");
  const allWordsIds = words.map((w) => w.id);

  async function startLearning() {
    setStage("learn");
    if (words.length > 0) await mark({ data: { ids: allWordsIds } });
  }

  async function onToggleFav(w: VocabRow) {
    const nextFav = !w.is_favorite;
    setWords((cur) =>
      cur.map((x) => (x.id === w.id ? { ...x, is_favorite: nextFav } : x)),
    );
    await fav({ data: { id: w.id, favorite: nextFav } });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-surface p-6">📚 Bugungi so'zlar tayyorlanmoqda...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-surface p-8 max-w-md w-full text-center">
          <div className="text-5xl">📚</div>
          <h2 className="mt-3 text-2xl font-bold">Lug'at uchun kirish kerak</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Kunlik so'zlaringiz bulutda saqlanadi va qurilmangizdan qat'iy progress yo'qolmaydi. Davom etish uchun Google orqali kiring.
          </p>
          <button
            onClick={async () => {
              await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
            }}
            className="btn-primary mt-6 w-full"
          >
            Google bilan kirish
          </button>
          <button onClick={onBack} className="btn-ghost mt-3 text-sm">← Orqaga</button>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-surface p-6 max-w-md text-center">
          <div className="text-2xl">😕</div>
          <div className="mt-2 font-semibold">Xatolik</div>
          <div className="mt-1 text-sm text-muted-foreground break-words">{err}</div>
          <div className="mt-4 flex gap-2 justify-center">
            <button onClick={reload} className="btn-primary">Qayta urinish</button>
            <button onClick={onBack} className="btn-ghost">Orqaga</button>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "source") {
    return (
      <VocabSource
        onDone={() => {
          started.current = true;
          void reload();
        }}
        onBack={onBack}
      />
    );
  }

  if (stage === "setup") {

    return (
      <SetupScreen
        current={dailyCount}
        onSave={async (n) => {
          await setCount({ data: { count: n } });
          setDailyCountLocal(n);
          setStage("home");
          await reload();
        }}
        onBack={() => setStage("home")}
      />
    );
  }

  if (stage === "favorites") {
    return <FavoritesScreen loader={favs} onToggle={fav} onBack={() => setStage("home")} />;
  }

  if (stage === "learn") {
    return (
      <LearnScreen
        words={words}
        onToggleFav={onToggleFav}
        onClose={() => setStage("home")}
      />
    );
  }

  if (stage === "test") {
    return (
      <TestScreen
        build={build}
        finalize={finalize}
        onDone={async (passed) => {
          if (passed) {
            setTestedToday(true);
            setStage("result");
          } else {
            setStage("test");
          }
        }}
        onBack={() => setStage("home")}
      />
    );
  }

  if (stage === "result") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-surface p-8 max-w-md text-center">
          <div className="text-6xl">🎉</div>
          <h2 className="mt-3 text-2xl font-bold">Zo'r! Bugungi lug'at bajarildi</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ertaga soat 00:00 dan keyin yangi so'zlar chiqadi.
          </p>
          <button onClick={onBack} className="btn-primary mt-6">Panelga</button>
        </div>
      </div>
    );
  }

  // Home
  const learnBtnLabel = !anyShown ? "Yodlashni boshlash" : "Yodlashni davom ettirish";

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <button onClick={onBack} className="btn-ghost text-sm">← Panelga</button>
      <div className="mt-4 flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-2xl md:text-3xl font-bold">📚 Lug'at</h2>
        <div className="flex gap-2">
          <button onClick={() => setStage("favorites")} className="btn-ghost text-sm">
            ⭐ Sevimlilar
          </button>
          <button onClick={() => setStage("setup")} className="btn-ghost text-sm">
            ⚙️ Kunlik meyor ({dailyCount})
          </button>
        </div>
      </div>

      {bank && (
        <div className="card-surface p-4 mt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm">
              📄 PDF ro'yxatingiz: <b>{bank.used}</b> / {bank.total} so'z o'tildi
              <span className="text-muted-foreground">
                {" "}
                — kuniga {dailyCount} ta bilan ~
                {Math.ceil((bank.total - bank.used) / Math.max(1, dailyCount))} kun qoldi
              </span>
            </div>
            <button
              onClick={async () => {
                if (!confirm("Ro'yxat o'chirilib, manba qaytadan so'raladi. Davom etamizmi?")) return;
                await resetBank();
                setBank(null);
                setStage("source");
              }}
              className="btn-ghost text-xs"
            >
              Ro'yxatni almashtirish
            </button>
          </div>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full gradient-brand"
              style={{ width: `${Math.min(100, (bank.used / Math.max(1, bank.total)) * 100)}%` }}
            />
          </div>
        </div>
      )}



      <div className="card-surface p-6 mt-6">
        <div className="text-xs uppercase text-muted-foreground">Bugungi vazifa</div>
        <div className="mt-1 text-3xl font-bold">
          {words.length} ta so'z
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          {testedToday
            ? "✅ Bugungi test topshirilgan"
            : anyShown
              ? "Ko'rib chiqdingiz — endi testni yechib, yodlaganingizni tasdiqlang."
              : "Boshlash uchun quyidagi tugmani bosing."}
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          <button
            onClick={startLearning}
            disabled={words.length === 0 || testedToday}
            className="btn-primary disabled:opacity-40"
          >
            {learnBtnLabel}
          </button>
          {anyShown && !testedToday && (
            <button onClick={() => setStage("test")} className="btn-primary">
              ✅ Yodladim — test
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        💡 Yodlamagan so'zlaringiz ertangi kunga qo'shiladi. Test 70%+ bo'lsa bugungi kun bajarildi hisoblanadi.
      </p>
    </div>
  );
}

// ============= Setup =============
function SetupScreen({
  current,
  onSave,
  onBack,
}: {
  current: number;
  onSave: (n: number) => Promise<void>;
  onBack: () => void;
}) {
  const [n, setN] = useState(current);
  const [busy, setBusy] = useState(false);
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-surface p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold">Kunlik meyor</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Har kuni nechta yangi so'z yodlashni istaysiz? (5–30)
        </p>
        <div className="mt-6 text-center">
          <div className="text-6xl font-bold text-primary">{n}</div>
          <input
            type="range"
            min={5}
            max={30}
            value={n}
            onChange={(e) => setN(parseInt(e.target.value))}
            className="w-full mt-4"
          />
        </div>
        <div className="mt-6 flex gap-2">
          <button onClick={onBack} className="btn-ghost flex-1">Bekor</button>
          <button
            onClick={async () => {
              setBusy(true);
              await onSave(n);
              setBusy(false);
            }}
            disabled={busy}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {busy ? "..." : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============= Learn (word list) =============
function speak(word: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(word);
  u.lang = "en-US";
  u.rate = 0.9;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

function formatShareText(words: VocabRow[]) {
  return words
    .map(
      (w, i) =>
        `${i + 1}. ${w.word} — ${w.translation}${w.pronunciation ? ` (${w.pronunciation})` : ""}`,
    )
    .join("\n");
}

function LearnScreen({
  words,
  onToggleFav,
  onClose,
}: {
  words: VocabRow[];
  onToggleFav: (w: VocabRow) => void;
  onClose: () => void;
}) {
  async function shareList() {
    const text = formatShareText(words);
    if (navigator.share) {
      try {
        await navigator.share({ title: "Bugungi lug'at", text });
        return;
      } catch {
        // fallthrough
      }
    }
    // Fallback: copy
    await navigator.clipboard.writeText(text);
    alert("Nusxa olindi ✓");
  }

  function downloadList() {
    const text = formatShareText(words);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lugat-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto pb-32">
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="btn-ghost text-sm">← Yopish</button>
        <div className="text-xs text-muted-foreground">{words.length} ta so'z</div>
      </div>

      <h2 className="mt-4 text-2xl md:text-3xl font-bold">Bugungi so'zlar</h2>

      <div className="mt-6 space-y-3">
        {words.map((w) => (
          <div key={w.id} className="card-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-xl font-bold">{w.word}</div>
                  <button
                    onClick={() => speak(w.word)}
                    aria-label="Eshitish"
                    className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center"
                  >
                    🔊
                  </button>
                  {w.topic && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent">
                      {w.topic}
                    </span>
                  )}
                </div>
                <div className="text-base mt-1">{w.translation}</div>
                {w.pronunciation && (
                  <div className="text-xs text-muted-foreground mt-1">
                    /{w.pronunciation}/
                  </div>
                )}
                {w.example && (
                  <div className="mt-2 text-sm italic text-muted-foreground">
                    "{w.example}"
                    {w.example_uz && (
                      <div className="not-italic text-xs mt-0.5">↳ {w.example_uz}</div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => onToggleFav(w)}
                aria-label="Sevimli"
                className="text-2xl"
              >
                {w.is_favorite ? "⭐" : "☆"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="fixed bottom-4 left-0 right-0 px-4">
        <div className="max-w-3xl mx-auto card-surface p-3 flex flex-wrap gap-2 justify-center shadow-lg">
          <button onClick={shareList} className="btn-ghost text-sm">🔗 Ulashish</button>
          <button onClick={downloadList} className="btn-ghost text-sm">💾 Yuklab olish</button>
          <button onClick={onClose} className="btn-primary text-sm">Yopish</button>
        </div>
      </div>
    </div>
  );
}

// ============= Favorites =============
function FavoritesScreen({
  loader,
  onToggle,
  onBack,
}: {
  loader: () => Promise<VocabRow[]>;
  onToggle: (args: { data: { id: string; favorite: boolean } }) => Promise<unknown>;
  onBack: () => void;
}) {
  const [items, setItems] = useState<VocabRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loader().then((r) => {
      setItems(r);
      setLoading(false);
    });
  }, []); // eslint-disable-line

  async function remove(w: VocabRow) {
    setItems((c) => c.filter((x) => x.id !== w.id));
    await onToggle({ data: { id: w.id, favorite: false } });
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <button onClick={onBack} className="btn-ghost text-sm">← Orqaga</button>
      <h2 className="mt-4 text-2xl md:text-3xl font-bold">⭐ Sevimli so'zlar</h2>

      {loading ? (
        <div className="mt-6 text-muted-foreground">Yuklanmoqda...</div>
      ) : items.length === 0 ? (
        <div className="mt-6 text-muted-foreground">
          Hozircha sevimli so'zlar yo'q. Yodlash oynasida ☆ tugmasini bosing.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((w) => (
            <div key={w.id} className="card-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-lg font-bold">{w.word}</div>
                    <button
                      onClick={() => speak(w.word)}
                      className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center"
                    >
                      🔊
                    </button>
                    {w.topic && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent">
                        {w.topic}
                      </span>
                    )}
                  </div>
                  <div className="text-sm mt-1">{w.translation}</div>
                  {w.pronunciation && (
                    <div className="text-xs text-muted-foreground">/{w.pronunciation}/</div>
                  )}
                  {w.favorited_at && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Saqlangan: {new Date(w.favorited_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => remove(w)}
                  className="text-xs px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400"
                >
                  Olib tashlash
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============= Test =============
type TestItem =
  | { kind: "mcq"; wordId: string; word: string; q: string; choices: string[]; answerIndex: number }
  | { kind: "write"; wordId: string; translation: string; answer: string };

function TestScreen({
  build,
  finalize,
  onDone,
  onBack,
}: {
  build: (args: { data: { oldPercent: number } }) => Promise<{ items: TestItem[]; hasOld: boolean }>;
  finalize: (args: { data: { correctIds: string[]; total: number; passed: boolean } }) => Promise<unknown>;
  onDone: (passed: boolean) => void;
  onBack: () => void;
}) {
  const [phase, setPhase] = useState<"setup" | "test" | "result">("setup");
  const [oldPct, setOldPct] = useState(20);
  const [items, setItems] = useState<TestItem[]>([]);
  const [hasOld, setHasOld] = useState(false);
  const [idx, setIdx] = useState(0);
  const [correctIds, setCorrectIds] = useState<Set<string>>(new Set());
  const [score, setScore] = useState({ ok: 0, total: 0 });
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    const r = await build({ data: { oldPercent: hasOld ? oldPct : 10 } });
    setItems(r.items);
    setHasOld(r.hasOld);
    setPhase("test");
    setIdx(0);
    setCorrectIds(new Set());
    setScore({ ok: 0, total: r.items.length });
    setLoading(false);
  }

  function submitAnswer(item: TestItem, wasCorrect: boolean) {
    if (wasCorrect) {
      setCorrectIds((s) => {
        const n = new Set(s);
        n.add(item.wordId);
        return n;
      });
    }
    setTimeout(async () => {
      if (idx + 1 >= items.length) {
        // finish
        const ok = wasCorrect
          ? Array.from(correctIds).length + 1
          : Array.from(correctIds).length;
        const percent = Math.round((ok / items.length) * 100);
        const passed = percent >= 70;
        await finalize({
          data: {
            correctIds: Array.from(
              wasCorrect ? new Set([...correctIds, item.wordId]) : correctIds,
            ),
            total: items.length,
            passed,
          },
        });
        setScore({ ok, total: items.length });
        setPhase("result");
      } else {
        setIdx(idx + 1);
      }
    }, 800);
  }

  if (phase === "setup") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-surface p-8 max-w-md w-full">
          <button onClick={onBack} className="btn-ghost text-sm">← Orqaga</button>
          <h2 className="mt-3 text-2xl font-bold">Testni boshlash</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Bugungi so'zlarni to'liq + eski yodlaganlaringizdan qo'shimcha % beriladi.
          </p>
          <div className="mt-6">
            <label className="text-sm">
              Eskilardan qo'shimcha: <b>{oldPct}%</b>
            </label>
            <input
              type="range"
              min={10}
              max={70}
              value={oldPct}
              onChange={(e) => setOldPct(parseInt(e.target.value))}
              className="w-full mt-2"
            />
            <div className="text-xs text-muted-foreground mt-1">
              10% (minimum) — 70% (maximum)
            </div>
          </div>
          <button
            onClick={start}
            disabled={loading}
            className="btn-primary w-full mt-6 disabled:opacity-50"
          >
            {loading ? "Tayyorlanmoqda..." : "Boshlash"}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const percent = Math.round((score.ok / score.total) * 100);
    const passed = percent >= 70;
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-surface p-8 max-w-md w-full text-center">
          <div className="text-6xl">{passed ? "🎉" : "💪"}</div>
          <h2 className="mt-3 text-2xl font-bold">{percent}%</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {score.ok}/{score.total} to'g'ri
          </p>
          {passed ? (
            <p className="mt-2 text-sm">Bugungi lug'at bajarildi! ✅</p>
          ) : (
            <p className="mt-2 text-sm text-red-500">
              70% dan kam — qayta yechish kerak
            </p>
          )}
          <div className="mt-6 flex gap-2">
            {passed ? (
              <button onClick={() => onDone(true)} className="btn-primary flex-1">
                Davom etish
              </button>
            ) : (
              <>
                <button onClick={onBack} className="btn-ghost flex-1">Orqaga</button>
                <button onClick={() => setPhase("setup")} className="btn-primary flex-1">
                  Qayta yechish
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // test
  const item = items[idx];
  if (!item) return null;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost text-sm">← Chiqish</button>
        <div className="text-xs text-muted-foreground">
          {idx + 1}/{items.length}
        </div>
      </div>

      <div className="card-surface p-6 md:p-8 mt-6">
        {item.kind === "mcq" ? (
          <McqItem item={item} onAnswer={(c) => submitAnswer(item, c)} />
        ) : (
          <WriteItem item={item} onAnswer={(c) => submitAnswer(item, c)} />
        )}
      </div>
    </div>
  );
}

function McqItem({
  item,
  onAnswer,
}: {
  item: Extract<TestItem, { kind: "mcq" }>;
  onAnswer: (correct: boolean) => void;
}) {
  const [pick, setPick] = useState<number | null>(null);
  return (
    <>
      <div className="text-xs uppercase text-muted-foreground">Ma'nosi</div>
      <h3 className="mt-2 text-xl font-semibold">{item.q}</h3>
      <div className="mt-4 grid gap-2">
        {item.choices.map((c, i) => (
          <button
            key={i}
            disabled={pick !== null}
            onClick={() => {
              setPick(i);
              onAnswer(i === item.answerIndex);
            }}
            className={`text-left rounded-xl border p-3 ${
              pick === null
                ? "hover:bg-accent"
                : i === item.answerIndex
                  ? "border-green-500 bg-green-500/10"
                  : i === pick
                    ? "border-red-500 bg-red-500/10"
                    : "opacity-60"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </>
  );
}

function WriteItem({
  item,
  onAnswer,
}: {
  item: Extract<TestItem, { kind: "write" }>;
  onAnswer: (correct: boolean) => void;
}) {
  const [val, setVal] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const isCorrect =
    val.trim().toLowerCase() === item.answer.trim().toLowerCase();

  return (
    <>
      <div className="text-xs uppercase text-muted-foreground">Inglizchada yozing</div>
      <h3 className="mt-2 text-xl font-semibold">{item.translation}</h3>
      <input
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        disabled={submitted}
        onKeyDown={(e) => {
          if (e.key === "Enter" && val.trim() && !submitted) {
            setSubmitted(true);
            onAnswer(isCorrect);
          }
        }}
        placeholder="type here..."
        className="mt-4 w-full rounded-2xl border p-3 bg-background text-lg"
      />
      {submitted && (
        <div
          className={`mt-3 p-3 rounded-xl text-sm ${
            isCorrect
              ? "bg-green-500/10 text-green-700 dark:text-green-400"
              : "bg-red-500/10 text-red-700 dark:text-red-400"
          }`}
        >
          {isCorrect ? "To'g'ri ✓" : `To'g'ri javob: ${item.answer}`}
        </div>
      )}
      {!submitted && (
        <button
          onClick={() => {
            setSubmitted(true);
            onAnswer(isCorrect);
          }}
          disabled={!val.trim()}
          className="btn-primary mt-3 disabled:opacity-40"
        >
          Tekshirish
        </button>
      )}
    </>
  );
}
