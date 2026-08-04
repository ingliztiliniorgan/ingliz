import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Profile } from "./types";

const ProfilePatch = z.object({
  name: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  age: z.number().int().optional(),
  levelChosen: z.enum(["past", "orta", "yaxshi"]).optional(),
  placementScore: z.number().int().optional(),
  placementStars: z.number().int().optional(),
  placementCount: z.number().int().optional(),
  difficulty: z.enum(["oson", "orta", "qiyin"]).optional(),
  theme: z.enum(["light", "dark"]).optional(),
  onboardedProfile: z.boolean().optional(),
  linnyIntroSeen: z.boolean().optional(),
  lastView: z.string().max(40).optional(),
  email: z.string().email().max(200).optional(),
});

function rowToProfile(row: Record<string, unknown>): Profile {
  return {
    name: (row.name as string) ?? undefined,
    gender: (row.gender as Profile["gender"]) ?? undefined,
    age: (row.age as number) ?? undefined,
    levelChosen: (row.level_chosen as Profile["levelChosen"]) ?? undefined,
    placementScore: (row.placement_score as number) ?? undefined,
    placementStars: (row.placement_stars as number) ?? undefined,
    placementCount: (row.placement_count as number) ?? undefined,
    difficulty: (row.difficulty as Profile["difficulty"]) ?? "orta",
    theme: (row.theme as Profile["theme"]) ?? "light",
    streak: (row.streak as number) ?? 0,
    lastVisit: (row.last_visit as string) ?? undefined,
    onboardedProfile: (row.onboarded as boolean) ?? false,
    linnyIntroSeen: (row.linny_intro_seen as boolean) ?? false,
    lastView: (row.last_view as string) ?? undefined,
    email: (row.email as string) ?? undefined,
  };
}

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToProfile(data as Record<string, unknown>) : null;
  });

export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProfilePatch.parse(d))
  .handler(async ({ data, context }) => {
    const row = {
      user_id: context.userId,
      name: data.name,
      gender: data.gender,
      age: data.age,
      level_chosen: data.levelChosen,
      placement_score: data.placementScore,
      placement_stars: data.placementStars,
      placement_count: data.placementCount,
      difficulty: data.difficulty,
      theme: data.theme,
      onboarded: data.onboardedProfile,
      linny_intro_seen: data.linnyIntroSeen,
      last_view: data.lastView,
      email: data.email,
    };
    const { error } = await context.supabase.from("profiles").upsert(row, { onConflict: "user_id" });
    if (error) throw error;
    return { ok: true };
  });

export const markDailyProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const day = new Date().toISOString().slice(0, 10);
    const { error } = await context.supabase
      .from("daily_progress")
      .upsert({ user_id: context.userId, day }, { onConflict: "user_id,day" });
    if (error) throw error;

    // Recompute streak from consecutive days
    const { data } = await context.supabase
      .from("daily_progress")
      .select("day")
      .eq("user_id", context.userId)
      .order("day", { ascending: false })
      .limit(60);
    let streak = 0;
    const set = new Set((data ?? []).map((r) => r.day as string));
    const d = new Date();
    while (set.has(d.toISOString().slice(0, 10))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    await context.supabase
      .from("profiles")
      .update({ streak, last_visit: day })
      .eq("user_id", context.userId);
    return { streak };
  });
