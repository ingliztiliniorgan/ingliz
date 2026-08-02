import { useEffect, useState } from "react";
import type { Difficulty, Profile } from "@/lib/types";
import { mistakesByTag, updateProfile } from "@/lib/profile";
import { ageBandOf } from "@/lib/theme";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useCloudSync";
import { useNavigate } from "@tanstack/react-router";
import { openApiKeyDialog } from "@/components/ApiKeyDialog";

interface Props {
  profile: Profile;
  onStartLearning: () => void;
  onOpenMistakes: () => void;
  onRetakePlacement: () => void;
  onDailyChallenge: () => void;
  onProfileChange: (p: Profile) => void;
}

export default function Dashboard({ profile, onStartLearning, onOpenMistakes, onRetakePlacement, onDailyChallenge, onProfileChange }: Props) {
  const [dark, setDark] = useState(profile.theme === "dark");
  const band = ageBandOf(profile.age);
  const user = useAuthUser();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    updateProfile({ theme: dark ? "dark" : "light" });
  }, [dark]);

  const name = profile.name ?? "";
  const greeting =
    band === "kid" ? `Salom, ${name}! 🌟`
    : band === "teen" ? `Hey, ${name}! Ketdik 🚀`
    : `Assalomu alaykum, ${name}`;

  const mistakesCount = profile.mistakes?.length ?? 0;
  const tagMap = mistakesByTag();
  const topTags = Object.entries(tagMap).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const today = new Date().toISOString().slice(0, 10);
  const dailyDone = profile.dailyChallengeDate === today && profile.dailyChallengeDone;

  function setDifficulty(d: Difficulty) {
    const p = updateProfile({ difficulty: d });
    onProfileChange(p);
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  function openDailyChallenge() {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    onDailyChallenge();
  }

  const difficulty = profile.difficulty ?? "orta";

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Panel</div>
          <h1 className="text-2xl md:text-3xl font-bold">{greeting}</h1>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground hidden sm:block">☁️ {user.email}</div>
              <button onClick={signOut} className="btn-ghost text-sm">Chiqish</button>
            </div>
          ) : (
            <button onClick={() => navigate({ to: "/auth" })} className="btn-ghost text-sm">
              ☁️ Kirish
            </button>
          )}
          <button onClick={() => setDark((v) => !v)} className="btn-ghost text-sm">
            {dark ? "☀️" : "🌙"}
          </button>
        </div>
      </header>

      <div className="mt-4 p-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 text-sm">
        <div className="font-semibold">✨ AI: Google Gemini</div>
        <p className="mt-1 text-muted-foreground">
          Bir nechta Gemini API kalit ulangan — birining limiti tugasa, avtomatik keyingisiga o'tadi.
        </p>
        <button onClick={() => openApiKeyDialog(false)} className="btn-primary mt-3 text-sm">
          🔑 Yangi API ulash
        </button>
      </div>



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
          <button onClick={onOpenMistakes}
            className="mt-2 text-sm text-primary hover:underline disabled:opacity-40"
            disabled={mistakesCount === 0}>
            Ustida ishlash →
          </button>
        </div>
      </section>

      {topTags.length > 0 && (
        <section className="mt-4 card-surface p-4">
          <div className="text-xs uppercase text-muted-foreground">Kuchsiz joylar</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {topTags.map(([tag, count]) => (
              <span key={tag} className="text-xs px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
                {tag} · {count}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6 grid md:grid-cols-2 gap-4">
        <div className="card-surface p-6 md:p-7">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Bugungi mashq</div>
          <h2 className="mt-2 text-xl md:text-2xl font-bold">O'rganishni boshlash</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            9 xil rejim — quiz, tarjima, yozish, talaffuz, kod tushuntirgich va boshqalar.
          </p>
          <button onClick={onStartLearning} className="btn-primary mt-4">🚀 Boshlash</button>
        </div>
        <div className={`card-surface p-6 md:p-7 ${dailyDone ? "opacity-70" : ""}`}>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Bugungi challenge</div>
          <h2 className="mt-2 text-xl md:text-2xl font-bold">
            {dailyDone ? "✅ Bajarildi!" : "⚡ 3 mini vazifa"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Har kuni: 1 quiz + 1 tarjima + 1 so'z. Streak ni saqlang.
          </p>
          <button onClick={openDailyChallenge} disabled={dailyDone}
            className="btn-primary mt-4 disabled:opacity-40">
            {dailyDone ? "Ertaga qaytamiz" : "Boshlash"}
          </button>
        </div>
      </section>

      <section className="mt-6 card-surface p-5">
        <div className="text-xs uppercase text-muted-foreground">Qiyinlik darajasi</div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(["oson", "orta", "qiyin"] as Difficulty[]).map((d) => (
            <button key={d} onClick={() => setDifficulty(d)}
              className={`p-3 rounded-2xl border text-sm ${
                difficulty === d ? "border-primary bg-primary/10 font-semibold" : "hover:bg-accent"
              }`}>
              {d === "oson" ? "🟢 Oson" : d === "orta" ? "🟡 O'rta" : "🔴 Qiyin"}
              <div className="text-xs text-muted-foreground mt-1">
                {d === "oson" ? "3 urinish + hint" : d === "orta" ? "2 urinish" : "1 urinish, hint yo'q"}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 grid sm:grid-cols-2 gap-4">
        <div className="card-surface p-5">
          <div className="text-lg font-semibold">Placement ni qayta yechish</div>
          <p className="text-sm text-muted-foreground mt-1">Darajangiz o'zgardi deb o'ylaysizmi?</p>
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
