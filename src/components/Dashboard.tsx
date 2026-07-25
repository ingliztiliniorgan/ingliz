import { useEffect, useState } from "react";
import type { Profile } from "@/lib/types";
import { updateProfile } from "@/lib/profile";
import { ageBandOf } from "@/lib/theme";

interface Props {
  profile: Profile;
  onStartLearning: () => void;
  onOpenMistakes: () => void;
  onRetakePlacement: () => void;
}

export default function Dashboard({ profile, onStartLearning, onOpenMistakes, onRetakePlacement }: Props) {
  const [dark, setDark] = useState(profile.theme === "dark");
  const band = ageBandOf(profile.age);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    updateProfile({ theme: dark ? "dark" : "light" });
  }, [dark]);

  const name = profile.name ?? "";
  const greeting =
    band === "kid"
      ? `Salom, ${name}! 🌟`
      : band === "teen"
      ? `Hey, ${name}! Ketdik 🚀`
      : `Assalomu alaykum, ${name}`;

  const mistakesCount = profile.mistakes?.length ?? 0;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Panel</div>
          <h1 className="text-2xl md:text-3xl font-bold">{greeting}</h1>
        </div>
        <button
          onClick={() => setDark((v) => !v)}
          className="btn-ghost text-sm"
          aria-label="Rejimni almashtirish"
        >
          {dark ? "☀️ Kunduz" : "🌙 Tun"}
        </button>
      </header>

      <section className="mt-6 grid md:grid-cols-3 gap-4">
        <div className="card-surface p-5">
          <div className="text-xs text-muted-foreground uppercase">Darajangiz</div>
          <div className="mt-1 text-3xl font-bold">{profile.placementScore ?? 0}%</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {"⭐".repeat(profile.placementStars ?? 0)}
            <span className="opacity-30">{"⭐".repeat(5 - (profile.placementStars ?? 0))}</span>
          </div>
        </div>
        <div className="card-surface p-5">
          <div className="text-xs text-muted-foreground uppercase">Streak</div>
          <div className="mt-1 text-3xl font-bold">{profile.streak ?? 1} 🔥</div>
          <div className="mt-1 text-sm text-muted-foreground">Ketma-ket kunlar</div>
        </div>
        <div className="card-surface p-5">
          <div className="text-xs text-muted-foreground uppercase">Xatolar sandig'i</div>
          <div className="mt-1 text-3xl font-bold">{mistakesCount}</div>
          <button
            onClick={onOpenMistakes}
            className="mt-2 text-sm text-primary hover:underline disabled:opacity-40"
            disabled={mistakesCount === 0}
          >
            Ustida ishlash →
          </button>
        </div>
      </section>

      <section className="mt-8 card-surface p-8 md:p-10">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Bugungi mashq
            </div>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold">
              O'rganishni boshlash
            </h2>
            <p className="mt-2 text-muted-foreground">
              AI-yordamli darslar. Yoshingiz va tanlagan mavzuga moslashtirilgan misollar, izohlar va flashcardlar.
            </p>
            <button onClick={onStartLearning} className="btn-primary mt-6">
              🚀 Boshlash
            </button>
          </div>
          <div className="hidden md:flex items-center justify-center">
            <div className="w-40 h-40 rounded-full gradient-brand flex items-center justify-center text-6xl">
              {band === "kid" ? "🎈" : band === "teen" ? "🎧" : "💼"}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid sm:grid-cols-2 gap-4">
        <div className="card-surface p-5">
          <div className="text-lg font-semibold">Placement ni qayta yechish</div>
          <p className="text-sm text-muted-foreground mt-1">
            Darajangiz o'zgardi deb o'ylaysizmi? Testni qayta yeching.
          </p>
          <button onClick={onRetakePlacement} className="btn-ghost mt-3">Qayta yechish</button>
        </div>
        <div className="card-surface p-5">
          <div className="text-lg font-semibold">Sizning profil</div>
          <ul className="text-sm text-muted-foreground mt-1 space-y-1">
            <li>Ism: {profile.name}</li>
            <li>Jins: {profile.gender === "female" ? "Ayol" : "Erkak"}</li>
            <li>Yosh: {profile.age}</li>
            <li>Boshlang'ich daraja: {profile.levelChosen}</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
