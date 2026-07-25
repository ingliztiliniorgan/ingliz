import type { Profile } from "@/lib/types";
import { updateProfile } from "@/lib/profile";

interface Props {
  profile: Profile;
  onBack: () => void;
}

export default function MistakesReview({ profile, onBack }: Props) {
  const mistakes = profile.mistakes ?? [];
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <button onClick={onBack} className="btn-ghost text-sm">← Panelga</button>
      <h2 className="mt-6 text-2xl md:text-3xl font-bold">Xatolar sandig'i</h2>
      <p className="text-muted-foreground mt-1">
        Bu yerda siz xato qilgan savollar to'planadi. Ularni takrorlab, bir daraja yuqoriga chiqing.
      </p>

      <div className="mt-6 grid gap-3">
        {mistakes.length === 0 && (
          <div className="card-surface p-6 text-center text-muted-foreground">
            Hozircha xatolar yo'q. Zo'r ish! 🎉
          </div>
        )}
        {mistakes.slice().reverse().map((m, idx) => (
          <div key={idx} className="card-surface p-4">
            <div className="text-xs text-muted-foreground">
              {new Date(m.at).toLocaleString()}
            </div>
            <div className="mt-1 text-sm">
              Siz javob: <span className="text-red-500 font-mono">{m.wrongAnswer}</span>
            </div>
            <div className="text-sm">
              To'g'ri: <span className="text-green-600 font-mono">{m.correctAnswer}</span>
            </div>
          </div>
        ))}
      </div>

      {mistakes.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => {
              updateProfile({ mistakes: [] });
              onBack();
            }}
            className="btn-ghost"
          >
            Sandiqni tozalash
          </button>
        </div>
      )}
    </div>
  );
}
