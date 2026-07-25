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
