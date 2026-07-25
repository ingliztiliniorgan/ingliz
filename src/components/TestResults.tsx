interface Props {
  result: { score: number; correct: number; total: number; stars: number };
  onContinue: () => void;
  onRetry: () => void;
  onExit: () => void;
}

export default function TestResults({ result, onContinue, onRetry, onExit }: Props) {
  const { score, correct, total, stars } = result;
  const message =
    score >= 80
      ? "Ajoyib natija! Sizda kuchli poydevor bor."
      : score >= 60
      ? "Yaxshi! Endi murakkab mavzularga o'tsak bo'ladi."
      : score >= 40
      ? "Yomon emas — biroz mashq bilan tez o'sasiz."
      : "Boshlash uchun ajoyib joy. Birga o'rganamiz!";

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-surface max-w-lg w-full p-8 text-center">
        <div className="text-sm uppercase tracking-wider text-muted-foreground">
          Placement natijasi
        </div>
        <div className="mt-4 text-6xl font-bold">{score}%</div>
        <div className="mt-2 text-sm text-muted-foreground">
          {correct} / {total} to'g'ri javob
        </div>

        <div className="mt-6 flex items-center justify-center gap-1 text-3xl">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={i < stars ? "" : "opacity-25"}>⭐</span>
          ))}
        </div>

        <p className="mt-4 text-base">{message}</p>

        <div className="mt-8 grid gap-3">
          <button onClick={onContinue} className="btn-primary w-full">
            Davom etish →
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onRetry} className="btn-ghost">Qayta yechish</button>
            <button onClick={onExit} className="btn-ghost">Chiqish</button>
          </div>
        </div>
      </div>
    </div>
  );
}
