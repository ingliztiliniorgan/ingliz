import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useServerFn } from "@tanstack/react-start";
import { getMyProfile, saveMyProfile, markDailyProgress } from "@/lib/cloud-profile.functions";
import { loadProfile, saveProfile, updateProfile } from "@/lib/profile";
import type { Profile } from "@/lib/types";

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);
  return user;
}

// Pull cloud profile on sign-in, merge into local storage; mark today's progress.
export function useCloudProfileSync(setProfile: (p: Profile) => void) {
  const user = useAuthUser();
  const pull = useServerFn(getMyProfile);
  const push = useServerFn(saveMyProfile);
  const mark = useServerFn(markDailyProgress);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const cloud = await pull();
        const local = loadProfile();
        // Cloud wins for defined fields; fall back to local for others.
        const merged: Profile = { ...local, ...Object.fromEntries(
          Object.entries(cloud ?? {}).filter(([, v]) => v !== undefined && v !== null),
        ) as Partial<Profile> };
        saveProfile(merged);
        setProfile(merged);
        // Push a snapshot back so cloud has any local-only fields.
        await push({
          data: {
            name: merged.name,
            gender: merged.gender,
            age: merged.age,
            levelChosen: merged.levelChosen,
            placementScore: merged.placementScore,
            placementStars: merged.placementStars,
            placementCount: merged.placementCount,
            difficulty: merged.difficulty,
            theme: merged.theme,
            onboardedProfile: merged.onboardedProfile,
            linnyIntroSeen: merged.linnyIntroSeen,
          },
        });
        const { streak } = await mark();
        const withStreak = updateProfile({ streak });
        setProfile(withStreak);
      } catch (e) {
        console.warn("cloud sync failed", e);
      }
    })();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  return user;
}
