import type { Gender } from "./types";

export type AgeBand = "kid" | "teen" | "adult";

export function ageBandOf(age?: number): AgeBand {
  if (!age || age <= 10) return "kid";
  if (age <= 17) return "teen";
  return "adult";
}

export function applyDesignFor(gender?: Gender, age?: number) {
  if (typeof document === "undefined") return;
  const band = ageBandOf(age);
  const root = document.documentElement;
  root.dataset.ageBand = band;
  root.dataset.gender = gender ?? "";
}
