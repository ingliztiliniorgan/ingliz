import { useState } from "react";
import type { LevelName } from "@/lib/types";

interface Props {
  onStart: (level: LevelName) => void;
}

const options: { key: LevelName; title: string; desc: string; emoji: string }[] = [
  { key: "past", title: "Past", desc: "Endi boshlayapman, bir necha so'z bilaman", emoji: "🌱" },
  { key: "orta", title: "O'rta", desc: "Oddiy gaplarni tuza olaman", emoji: "🌿" },
  { key: "yaxshi", title: "Yaxshi", desc: "Bemalol o'qiy va yoza olaman", emoji: "🌳" },
];

export default function LevelSelect({ onStart }: Props) {
  const [choice, setChoice] = useState<LevelName | null>(null);
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs uppercase tracking-wider">
            Xush kelibsiz
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
            Ingliz tilini haqiqatan o'rganamiz
          </h1>
          <p className="mt-3 text-muted-foreground">
            Boshlash uchun darajangizni tanlang. Keyingi qadamda nechta savol yechishni o'zingiz tanlaysiz — sizga qanchalik oson kelsa, savollar o'sha zahoti murakkablashadi.
          </p>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {options.map((o) => {
            const active = choice === o.key;
            return (
              <button
                key={o.key}
                onClick={() => setChoice(o.key)}
                className={`card-surface p-5 text-left transition-all hover:-translate-y-1 ${
                  active ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="text-3xl">{o.emoji}</div>
                <div className="mt-3 text-lg font-semibold">{o.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{o.desc}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            className="btn-primary disabled:opacity-40"
            disabled={!choice}
            onClick={() => choice && onStart(choice)}
          >
            Davom etish →
          </button>
        </div>
      </div>
    </div>
  );
}
