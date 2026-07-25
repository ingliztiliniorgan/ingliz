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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Linny — Ingliz tilini o'rganish" },
      {
        name: "description",
        content:
          "Adaptiv 100 savolli placement test, yoshga moslashadigan darslar, xatolar sandig'i va streak — inglizchani nol darajadan boshlab jonli suhbatga qadar o'rganing.",
      },
      { property: "og:title", content: "Linny — Ingliz tilini o'rganish" },
      {
        property: "og:description",
        content:
          "AI-yordamli, yosh va jinsga moslashadigan ingliz tili trenajyori. 100 savolli placement, adaptiv darslar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

type View =
  | "onboardProfile"
  | "levelSelect"
  | "test"
  | "results"
  | "dashboard"
  | "learn"
  | "mistakes";

function HomePage() {
  const [profile, setProfile] = useState<Profile>({});
  const [view, setView] = useState<View>("onboardProfile");
  const [lastResult, setLastResult] = useState<{
    score: number;
    correct: number;
    total: number;
    stars: number;
  } | null>(null);

  // Hydrate from localStorage after mount (SSR-safe)
  useEffect(() => {
    const p = bumpStreak() ?? loadProfile();
    setProfile(p);
    applyDesignFor(p.gender, p.age);
    if (p.theme === "dark") document.documentElement.classList.add("dark");
    if (!p.onboardedProfile || !p.gender || !p.age) setView("onboardProfile");
    else if (!p.levelChosen) setView("levelSelect");
    else if (typeof p.placementScore !== "number") setView("levelSelect");
    else setView("dashboard");
  }, []);

  function handleProfile(data: { gender: "male" | "female"; age: number }) {
    const p = updateProfile({ ...data, onboardedProfile: true });
    setProfile(p);
    applyDesignFor(p.gender, p.age);
    setView("levelSelect");
  }

  function handleLevel(level: LevelName) {
    const p = updateProfile({ levelChosen: level });
    setProfile(p);
    setView("test");
  }

  function handleFinishTest(result: { score: number; correct: number; total: number; stars: number }) {
    setLastResult(result);
    const p = updateProfile({ placementScore: result.score, placementStars: result.stars });
    setProfile(p);
    setView("results");
  }

  return (
    <>
      {view === "onboardProfile" && <OnboardingProfile onComplete={handleProfile} />}
      {view === "levelSelect" && <LevelSelect onStart={handleLevel} />}
      {view === "test" && profile.levelChosen && (
        <PlacementTest
          startLevel={profile.levelChosen}
          totalQuestions={100}
          onFinish={handleFinishTest}
          onExit={() => setView("levelSelect")}
        />
      )}
      {view === "results" && lastResult && (
        <TestResults
          result={lastResult}
          onContinue={() => setView("dashboard")}
          onRetry={() => setView("test")}
          onExit={() => setView("levelSelect")}
        />
      )}
      {view === "dashboard" && (
        <Dashboard
          profile={profile}
          onStartLearning={() => setView("learn")}
          onOpenMistakes={() => setView("mistakes")}
          onRetakePlacement={() => setView("levelSelect")}
        />
      )}
      {view === "learn" && (
        <LearningSession profile={profile} onExit={() => setView("dashboard")} />
      )}
      {view === "mistakes" && (
        <MistakesReview profile={profile} onBack={() => setView("dashboard")} />
      )}
    </>
  );
}
