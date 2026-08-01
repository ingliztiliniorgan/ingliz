import { useCallback, useEffect, useRef, useState } from "react";
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

function cloudPatchOf(p: Profile) {
  return {
    name: p.name,
    gender: p.gender,
    age: p.age,
    levelChosen: p.levelChosen,
    placementScore: p.placementScore,
    placementStars: p.placementStars,
    placementCount: p.placementCount,
    difficulty: p.difficulty,
    theme: p.theme,
    onboardedProfile: p.onboardedProfile,
    linnyIntroSeen: p.linnyIntroSeen,
    lastView: p.lastView,
  };
}

/**
 * Single source of truth for the signed-in / anonymous profile.
 * - Signed in: cloud profile wins, local storage is a mirror, every change is pushed.
 * - Anonymous: local session only (not restored after a refresh, by design).
 */
export function useSessionProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<Profile>({});
  const [ready, setReady] = useState(false);
  const syncedFor = useRef<string | null>(null);

  const pull = useServerFn(getMyProfile);
  const push = useServerFn(saveMyProfile);
  const mark = useServerFn(markDailyProgress);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
      setAuthReady(true);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;

    // Anonymous: nothing is persisted across refreshes.
    if (!user) {
      if (syncedFor.current !== "anon") {
        syncedFor.current = "anon";
        setProfile({});
        setReady(true);
      }
      return;
    }

    if (syncedFor.current === user.id) return;
    syncedFor.current = user.id;
    setReady(false);

    (async () => {
      const local = loadProfile();
      let merged: Profile = local;
      try {
        const cloud = await pull();
        const cloudDefined = Object.fromEntries(
          Object.entries(cloud ?? {}).filter(([, v]) => v !== undefined && v !== null),
        ) as Partial<Profile>;
        merged = { ...local, ...cloudDefined };
        // Cloud row exists but was never onboarded → keep local truth if we have it.
        if (!cloud?.onboardedProfile && local.onboardedProfile) {
          merged.onboardedProfile = true;
          merged.name = local.name ?? merged.name;
          merged.gender = local.gender ?? merged.gender;
          merged.age = local.age ?? merged.age;
        }
        if (!merged.name) {
          const meta = user.user_metadata as Record<string, unknown> | undefined;
          const gName = (meta?.full_name ?? meta?.name) as string | undefined;
          if (gName) merged.name = gName.split(" ")[0];
        }
        saveProfile(merged);
        setProfile(merged);
        await push({ data: cloudPatchOf(merged) });
        const { streak } = await mark();
        merged = updateProfile({ streak });
        setProfile(merged);
      } catch (e) {
        console.warn("cloud sync failed", e);
        setProfile(merged);
      } finally {
        setReady(true);
      }
    })();
  }, [authReady, user]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Update local state (+ localStorage) and push to cloud when signed in. */
  const persist = useCallback(
    (patch: Partial<Profile>) => {
      const next = updateProfile(patch);
      setProfile(next);
      if (user) {
        void push({ data: cloudPatchOf({ ...next, ...patch }) }).catch((e) =>
          console.warn("profile push failed", e),
        );
      }
      return next;
    },
    [user, push],
  );

  return { user, authReady, ready, profile, setProfile, persist };
}

// Kept for backwards compatibility with older call sites.
export function useCloudProfileSync(setProfileExternal: (p: Profile) => void) {
  const { user, profile } = useSessionProfile();
  useEffect(() => {
    setProfileExternal(profile);
  }, [profile]); // eslint-disable-line react-hooks/exhaustive-deps
  return user;
}
