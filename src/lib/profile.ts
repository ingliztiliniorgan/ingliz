import type { Profile, MistakeItem } from "./types";

const KEY = "eng_learn_profile_v1";

const isBrowser = () => typeof window !== "undefined";

export function loadProfile(): Profile {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Profile;
  } catch {
    return {};
  }
}

export function saveProfile(p: Profile) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

export function updateProfile(patch: Partial<Profile>): Profile {
  const cur = loadProfile();
  const next = { ...cur, ...patch };
  saveProfile(next);
  return next;
}

export function addMistake(m: MistakeItem) {
  const cur = loadProfile();
  const list = cur.mistakes ?? [];
  list.push(m);
  saveProfile({ ...cur, mistakes: list.slice(-200) });
}

export function clearPlacement() {
  const cur = loadProfile();
  saveProfile({ ...cur, placementScore: undefined, placementStars: undefined });
}

export function bumpStreak() {
  const cur = loadProfile();
  const today = new Date().toISOString().slice(0, 10);
  if (cur.lastVisit === today) return cur;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = cur.lastVisit === yesterday ? (cur.streak ?? 0) + 1 : 1;
  const next = { ...cur, streak, lastVisit: today };
  saveProfile(next);
  return next;
}

export function mistakesByTag(): Record<string, number> {
  const p = loadProfile();
  const map: Record<string, number> = {};
  for (const m of p.mistakes ?? []) {
    const t = m.tag ?? "boshqa";
    map[t] = (map[t] ?? 0) + 1;
  }
  return map;
}

// --- Kunlik maqsad (local, AI ishlatmaydi) ---------------------------------
const todayStr = () => new Date().toISOString().slice(0, 10);

/** Bugungi maqsad holati; kun o'zgarsa hisob avtomatik nolga tushadi. */
export function dailyGoalState() {
  const p = loadProfile();
  const fresh = p.goalDate === todayStr();
  return {
    goal: p.dailyGoal ?? 10,
    count: fresh ? (p.goalCount ?? 0) : 0,
    correct: fresh ? (p.goalCorrect ?? 0) : 0,
    history: p.goalHistory ?? [],
  };
}

export function setDailyGoal(goal: number): Profile {
  return updateProfile({ dailyGoal: goal });
}

/** Har bir javobdan keyin chaqiriladi. */
export function countAnswer(correct: boolean): Profile {
  const cur = loadProfile();
  const today = todayStr();
  const fresh = cur.goalDate === today;
  const count = (fresh ? cur.goalCount ?? 0 : 0) + 1;
  const okCount = (fresh ? cur.goalCorrect ?? 0 : 0) + (correct ? 1 : 0);

  const history = [...(cur.goalHistory ?? [])].filter((h) => h.date !== today);
  history.push({ date: today, count });

  const next: Profile = {
    ...cur,
    goalDate: today,
    goalCount: count,
    goalCorrect: okCount,
    goalHistory: history.slice(-14),
  };
  saveProfile(next);
  return next;
}
