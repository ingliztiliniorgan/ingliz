import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { LevelName, Profile } from "@/lib/types";
import { bumpStreak, loadProfile, updateProfile } from "@/lib/profile";
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
import { useCloudProfileSync } from "@/hooks/useCloudSync";

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

const VIEW_KEY = "linny_view_v1";
const RESULT_KEY = "linny_last_result_v1";
const COUNT_KEY = "linny_test_count_v1";

function saveView(v: View) {
  try { localStorage.setItem(VIEW_KEY, v); } catch { /* ignore */ }
}
function loadView(): View | null {
  try { return (localStorage.getItem(VIEW_KEY) as View) || null; } catch { return null; }
}

function HomePage() {
  const [profile, setProfile] = useState<Profile>({});
  const [view, setViewState] = useState<View>("onboardProfile");
  const [testCount, setTestCount] = useState<number>(() => {
    if (typeof window === "undefined") return 20;
    return Number(localStorage.getItem(COUNT_KEY)) || 20;
  });
  const [lastResult, setLastResult] = useState<{ score: number; correct: number; total: number; stars: number } | null>(() => {
    if (typeof window === "undefined") return null;
    try { const r = localStorage.getItem(RESULT_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
  });

  function setView(v: View) {
    saveView(v);
    setViewState(v);
  }

  useCloudProfileSync(setProfile);

  useEffect(() => {
    const p = bumpStreak() ?? loadProfile();
    setProfile(p);
    applyDesignFor(p.gender, p.age);
    if (p.theme === "dark") document.documentElement.classList.add("dark");

    const saved = loadView();
    const canRestore =
      saved &&
      p.onboardedProfile && p.gender && p.age && p.name &&
      p.levelChosen &&
      typeof p.placementScore === "number" &&
      ["dashboard", "learn", "mistakes", "daily"].includes(saved);

    if (canRestore) {
      setViewState(saved);
    } else if (!p.onboardedProfile || !p.gender || !p.age || !p.name) {
      setView("onboardProfile");
    } else if (!p.levelChosen || typeof p.placementScore !== "number") {
      setView("levelSelect");
    } else {
      setView("dashboard");
    }
  }, []);

  function handleProfile(data: { name: string; gender: "male" | "female"; age: number }) {
    const p = updateProfile({ ...data, onboardedProfile: true });
    setProfile(p);
    applyDesignFor(p.gender, p.age);
    setView("levelSelect");
  }

  function handleLevel(level: LevelName) {
    const p = updateProfile({ levelChosen: level });
    setProfile(p);
    setView("count");
  }

  function handleFinishTest(result: { score: number; correct: number; total: number; stars: number }) {
    setLastResult(result);
    try { localStorage.setItem(RESULT_KEY, JSON.stringify(result)); } catch { /* ignore */ }
    const p = updateProfile({
      placementScore: result.score,
      placementStars: result.stars,
      placementCount: result.total,
    });
    setProfile(p);
    setView("results");
  }

  return (
    <>
      {view === "onboardProfile" && <OnboardingProfile onComplete={handleProfile} />}
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
          onProfileChange={setProfile} />
      )}
      {view === "learn" && <LearningSession profile={profile} onExit={() => setView("dashboard")} />}
      {view === "mistakes" && <MistakesReview profile={profile} onBack={() => setView("dashboard")} />}
      {view === "daily" && <DailyChallenge profile={profile} onBack={() => { setProfile(loadProfile()); setView("dashboard"); }} />}
    </>
  );
}
