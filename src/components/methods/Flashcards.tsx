import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { genFlashcards } from "@/lib/ai.functions";
import type { FlashcardItem, Profile } from "@/lib/types";
import { ageBandOf } from "@/lib/theme";

interface Props {
  profile: Profile;
  onBack: () => void;
}

export default function Flashcards({ profile, onBack }: Props) {
  const gen = useServerFn(genFlashcards);
  const band = ageBandOf(profile.age);
  const defaults =
    band === "kid"
      ? ["Hayvonlar", "Mevalar", "Ranglar", "Sonlar", "Oila"]
      : band === "teen"
        ? ["Maktab", "Do'stlik", "Sport", "Musiqa", "Ijtimoiy tarmoqlar"]
        : ["IT / dasturlash", "Ofis / biznes", "Sayohat", "Kundalik hayot", "Sog'liq"];

  const [theme, setTheme] = useState("");
  const [cards, setCards] = useState<FlashcardItem[]>([]);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [known, setKnown] = useState(0);

  async function load(t: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await gen({ data: { age: profile.age ?? 20, theme: t, count: 8 } });
      setCards(data);
      setI(0);
      setFlipped(false);
      setKnown(0);
    } catch (e) {
      console.error(e);
      setError("Kartochkalarni yuklab bo'lmadi. Yana urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }

  function nextCard(learned: boolean) {
    if (learned) setKnown((k) => k + 1);
    setFlipped(false);
    if (i + 1 < cards.length) setI(i + 1);
    else setCards([]); // done
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-surface p-8 text-center">
          <div className="text-4xl animate-pulse">🃏</div>
          <div className="mt-3">Kartochkalar tayyorlanmoqda...</div>
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
        <button onClick={onBack} className="btn-ghost text-sm">← Panelga</button>
        <h2 className="mt-6 text-2xl md:text-3xl font-bold">Flashcards 🃏</h2>
        <p className="text-muted-foreground mt-1">
          Kartochkani bosing — orqasida tarjima, misol va talaffuz chiqadi. Har kartochkani "Bilaman" yoki "Hali emas" deb belgilang.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {defaults.map((d) => (
            <button
              key={d}
              onClick={() => load(d)}
              className="px-3 py-1 rounded-full border text-sm hover:bg-accent"
            >
              {d}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="O'zingizga yoqqan mavzu"
            className="flex-1 rounded-2xl border p-4 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            disabled={theme.trim().length < 2}
            onClick={() => load(theme.trim())}
            className="btn-primary disabled:opacity-40"
          >
            Boshlash
          </button>
        </div>
        {error && <div className="mt-3 text-sm text-red-500">{error}</div>}
        {known > 0 && (
          <div className="mt-6 card-surface p-6 text-center">
            <div className="text-4xl">✨</div>
            <div className="mt-2">Oxirgi sessiyada {known} ta so'zni bildingiz.</div>
          </div>
        )}
      </div>
    );
  }

  const c = cards[i];
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost text-sm">← Panelga</button>
        <div className="text-xs text-muted-foreground">{i + 1} / {cards.length}</div>
      </div>

      <div
        onClick={() => setFlipped((v) => !v)}
        className="mt-6 card-surface p-8 md:p-12 text-center cursor-pointer select-none min-h-[280px] flex flex-col items-center justify-center transition-all hover:-translate-y-0.5"
      >
        {!flipped ? (
          <>
            {c.emoji && <div className="text-6xl">{c.emoji}</div>}
            <div className="mt-4 text-3xl md:text-4xl font-bold">{c.word}</div>
            <div className="mt-3 text-xs text-muted-foreground uppercase">Bosing — tarjima</div>
          </>
        ) : (
          <>
            <div className="text-2xl md:text-3xl font-bold">{c.translation}</div>
            <div className="mt-3 text-sm text-primary">🔊 {c.pronunciation}</div>
            <div className="mt-4 text-base italic">"{c.example}"</div>
            <div className="mt-1 text-sm text-muted-foreground">{c.exampleUz}</div>
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button onClick={() => nextCard(false)} className="btn-ghost">Hali emas</button>
        <button onClick={() => nextCard(true)} className="btn-primary">✅ Bilaman</button>
      </div>
    </div>
  );
}
