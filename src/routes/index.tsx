import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { LevelName, Profile } from "@/lib/types";
import { loadProfile } from "@/lib/profile";
import { applyDesignFor } from "@/lib/theme";
import LevelSelect from "@/components/LevelSelect";
import PlacementTest from "@/components/PlacementTest";
import TestResults from "@/components/TestResults";
import OnboardingProfile from "@/components/OnboardingProfile";
import Dashboard from "@/components/Dashboard";
import LearningSession from "@/components/LearningSession";
import MistakesReview from "@/components/MistakesReview";
import TestCountSelect from "@/components/TestCountSelect";
import DailyChallenge from "@/components/methods/DailyChallenge";
import { useSessionProfile } from "@/hooks/useCloudSync";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Linny — Ingliz tilini o'rganish" },
      { name: "description", content: "Adaptiv AI test, yoshga moslashadigan darslar, xatolar sandig'i va streak — inglizchani nol darajadan jonli suhbatga qadar o'rganing." },
      { property: "og:title", content: "Linny — Ingliz tilini o'rganish" },
      { property: "og:description", content: "AI-yordamli, yosh va jinsga moslashadigan ingliz tili trenajyori." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

type View =
  | "onboardProfile" | "levelSelect" | "count" | "test" | "results"
  | "dashboard" | "learn" | "mistakes" | "daily";

const RESTORABLE: View[] = ["dashboard", "learn", "mistakes", "daily", "levelSelect", "count"];
const RESULT_KEY = "linny_last_result_v1";
const COUNT_KEY = "linny_test_count_v1";

function defaultViewFor(p: Profile): View {
  if (!p.onboardedProfile || !p.gender || !p.age || !p.name) return "onboardProfile";
  if (!p.levelChosen || typeof p.placementScore !== "number") return "levelSelect";
  return "dashboard";
}

function HomePage() {
  const { user, ready, profile, setProfile, persist } = useSessionProfile();
  const [view, setViewState] = useState<View | null>(null);
  const [testCount, setTestCount] = useState<number>(() => {
    if (typeof window === "undefined") return 20;
    return Number(localStorage.getItem(COUNT_KEY)) || 20;
  });
  const [lastResult, setLastResult] = useState<{ score: number; correct: number; total: number; stars: number } | null>(() => {
    if (typeof window === "undefined") return null;
    try { const r = localStorage.getItem(RESULT_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
  });

  // Persist the current screen (cloud for signed-in users) so a refresh — or a
  // sign-in on another device — lands exactly where the user left off.
  function setView(v: View) {
    setViewState(v);
    if (user) persist({ lastView: v });
  }

  // Decide the initial screen only once the profile is known.
  useEffect(() => {
    if (!ready) return;
    applyDesignFor(profile.gender, profile.age);
    if (profile.theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    const fallback = defaultViewFor(profile);
    const saved = profile.lastView as View | undefined;
    const canRestore =
      !!user && !!saved && RESTORABLE.includes(saved) && fallback === "dashboard";
    setViewState(canRestore ? saved! : fallback);

    // Keep the account's email on the profile so progress can be traced back
    // to the signed-in user.
    const email = user?.email;
    if (email && profile.email !== email) persist({ email });
  }, [ready, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps


  function handleProfile(data: { name: string; gender: "male" | "female"; age: number }) {
    const p = persist({ ...data, onboardedProfile: true });
    applyDesignFor(p.gender, p.age);
    setView("levelSelect");
  }

  function handleLevel(level: LevelName) {
    persist({ levelChosen: level });
    setView("count");
  }

  function handleFinishTest(result: { score: number; correct: number; total: number; stars: number }) {
    setLastResult(result);
    try { localStorage.setItem(RESULT_KEY, JSON.stringify(result)); } catch { /* ignore */ }
    persist({
      placementScore: result.score,
      placementStars: result.stars,
      placementCount: result.total,
    });
    setView("results");
  }

  if (!ready || view === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full gradient-brand flex items-center justify-center text-3xl animate-pulse">🦉</div>
          <p className="mt-4 text-sm text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // Auth-first: everything (AI darslar, lug'at, progress) needs an account.
  if (!user) return <SignInGate />;


  return (
    <>
      {view === "onboardProfile" && (
        <OnboardingProfile initialName={profile.name} onComplete={handleProfile} />
      )}
      {view === "levelSelect" && <LevelSelect onStart={handleLevel} />}
      {view === "count" && (
        <TestCountSelect
          onStart={(n) => {
            setTestCount(n);
            try { localStorage.setItem(COUNT_KEY, String(n)); } catch { /* ignore */ }
            setView("test");
          }}
          onBack={() => setView("levelSelect")}
        />
      )}
      {view === "test" && profile.levelChosen && (
        <PlacementTest startLevel={profile.levelChosen} totalQuestions={testCount} age={profile.age}
          onFinish={handleFinishTest} onExit={() => setView("count")} />
      )}
      {view === "results" && lastResult && (
        <TestResults result={lastResult}
          onContinue={() => setView("dashboard")}
          onRetry={() => setView("count")}
          onExit={() => setView("levelSelect")} />
      )}
      {view === "dashboard" && (
        <Dashboard profile={profile}
          onStartLearning={() => setView("learn")}
          onOpenMistakes={() => setView("mistakes")}
          onRetakePlacement={() => setView("levelSelect")}
          onDailyChallenge={() => setView("daily")}
          onProfileChange={(p) => {
            setProfile(p);
            if (user) persist({ difficulty: p.difficulty, theme: p.theme, linnyIntroSeen: p.linnyIntroSeen });
          }} />
      )}
      {view === "learn" && <LearningSession profile={profile} onExit={() => setView("dashboard")} />}
      {view === "mistakes" && <MistakesReview profile={profile} onBack={() => setView("dashboard")} />}
      {view === "daily" && <DailyChallenge profile={profile} onBack={() => { setProfile(loadProfile()); setView("dashboard"); }} />}
    </>
  );
}
