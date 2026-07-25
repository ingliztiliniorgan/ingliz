import { useState } from "react";

interface Props {
  onStart: (count: number) => void;
  onBack: () => void;
}

export default function TestCountSelect({ onStart, onBack }: Props) {
  const [count, setCount] = useState(20);
  const presets = [10, 20, 30, 50, 100];
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-surface max-w-lg w-full p-8">
        <button onClick={onBack} className="btn-ghost text-sm">← Orqaga</button>
        <h2 className="mt-4 text-2xl md:text-3xl font-bold text-center">
          Nechta savol yechmoqchisiz?
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          10 dan 100 gacha. Savollar sizga qanchalik oson kelsa, o'sha zahoti murakkablashadi.
        </p>
        <div className="mt-8 text-center">
          <div className="text-6xl font-bold">{count}</div>
          <input
            type="range"
            min={10}
            max={100}
            step={1}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full mt-4 accent-primary"
          />
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => setCount(p)}
                className={`px-3 py-1 rounded-full text-sm border transition ${
                  count === p ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => onStart(count)} className="btn-primary w-full mt-8">
          Testni boshlash →
        </button>
      </div>
    </div>
  );
}
