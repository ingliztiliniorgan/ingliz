import { useState } from "react";
import type { Gender } from "@/lib/types";

interface Props {
  onComplete: (data: { gender: Gender; age: number }) => void;
}

export default function OnboardingProfile({ onComplete }: Props) {
  const [step, setStep] = useState<0 | 1>(0);
  const [gender, setGender] = useState<Gender | null>(null);
  const [age, setAge] = useState<number>(16);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-surface max-w-md w-full p-8">
        {step === 0 ? (
          <>
            <h2 className="text-2xl font-bold text-center">Siz kimsiz?</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Ilova sizga mos ravishda ko'rinishga kelsin.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setGender("male")}
                className={`card-surface p-5 text-center transition-all hover:-translate-y-1 ${
                  gender === "male" ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="text-4xl">👦</div>
                <div className="mt-2 font-semibold">Erkak</div>
              </button>
              <button
                onClick={() => setGender("female")}
                className={`card-surface p-5 text-center transition-all hover:-translate-y-1 ${
                  gender === "female" ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="text-4xl">👧</div>
                <div className="mt-2 font-semibold">Ayol</div>
              </button>
            </div>
            <button
              className="btn-primary w-full mt-6 disabled:opacity-40"
              disabled={!gender}
              onClick={() => setStep(1)}
            >
              Keyingi →
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-center">Yoshingiz nechada?</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Darslar va dizayn yoshingizga moslashadi.
            </p>
            <div className="mt-8 text-center">
              <div className="text-6xl font-bold">{age}</div>
              <input
                type="range"
                min={5}
                max={80}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full mt-4 accent-primary"
              />
              <div className="text-xs text-muted-foreground mt-1">5 – 80</div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button onClick={() => setStep(0)} className="btn-ghost">← Orqaga</button>
              <button
                onClick={() => gender && onComplete({ gender, age })}
                className="btn-primary"
              >
                Boshlash
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
