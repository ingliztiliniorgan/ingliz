/*
# Create core learning tables (profiles, daily_progress, vocab_words)

## Summary
The app's server functions reference three tables — `profiles`, `daily_progress`,
and `vocab_words` — that were never applied to the live database (the migration
files on disk had no effect). This migration creates all three with the exact
columns the current code expects, plus owner-scoped Row Level Security policies.

## New Tables

### 1. profiles
Stores each learner's personal settings and progress snapshot.
- `user_id` (uuid, primary key, references auth.users, defaults to auth.uid())
- `name` (text) — display name
- `gender` (text, 'male' | 'female')
- `age` (int, 3–120)
- `level_chosen` (text, 'past' | 'orta' | 'yaxshi') — self-rated starting level
- `placement_score` (int) — placement test percentage
- `placement_stars` (int) — 0–5 stars
- `placement_count` (int) — how many times placement was taken
- `difficulty` (text, 'oson' | 'orta' | 'qiyin', default 'orta')
- `theme` (text, 'light' | 'dark', default 'light')
- `streak` (int, default 0) — current consecutive-day streak
- `best_streak` (int, default 0) — longest streak ever
- `last_visit` (date) — last active day
- `onboarded` (boolean, default false) — finished onboarding
- `linny_intro_seen` (boolean, default false) — saw the intro
- `daily_word_count` (int, default 10) — vocab words per day
- `vocab_last_generated` (date) — last day vocab was generated
- `vocab_last_test_date` (date) — last day vocab test was taken
- `vocab_setup_done` (boolean, default false) — vocab daily count configured
- `created_at` / `updated_at` (timestamptz)

### 2. daily_progress
One row per user per day — used to compute streaks.
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users, defaults to auth.uid())
- `day` (date, not null)
- Unique constraint on (user_id, day)

### 3. vocab_words
Daily vocabulary words assigned to each learner.
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users, defaults to auth.uid())
- `word` (text) — English word
- `translation` (text) — Uzbek translation
- `pronunciation` (text) — Uzbek-letter pronunciation guide
- `example` / `example_uz` (text) — example sentence + translation
- `topic` (text) — topic tag
- `assigned_date` (date) — day the word was assigned
- `status` (text, default 'pending') — 'pending' | 'shown' | 'learned'
- `learned_at` (timestamptz) — when marked learned
- `is_favorite` (boolean, default false)
- `favorited_at` (timestamptz)
- `created_at` (timestamptz, default now())

## Security (RLS)
All three tables have RLS enabled with owner-scoped policies:
- profiles: SELECT/INSERT/UPDATE scoped to `auth.uid() = user_id`
- daily_progress: SELECT/INSERT/UPDATE/DELETE scoped to `auth.uid() = user_id`
- vocab_words: SELECT/INSERT/UPDATE/DELETE scoped to `auth.uid() = user_id`

All policies use `TO authenticated` because the app uses Google sign-in.
Owner columns default to `auth.uid()` so inserts that omit user_id still pass
the WITH CHECK policy.

## Automation
- `profiles_updated_at` trigger keeps `updated_at` fresh on every UPDATE.
- `handle_new_user` trigger auto-creates an empty profile row when a new auth.users
  row is inserted (i.e. on signup), pre-filling the name from OAuth metadata.

## Important Notes
1. This migration is idempotent — safe to re-run. All CREATE statements use
   IF NOT EXISTS, and policies are dropped before re-creating.
2. Existing old tables (users, user_sessions, user_progress, daily_streaks,
   mistakes, test_results) are NOT touched — they belong to a previous schema
   and are unused by the current code. They are left in place to avoid data loss.
3. The `set_updated_at` function and `handle_new_user` function use
   CREATE OR REPLACE and the triggers use DROP IF EXISTS + CREATE to stay
   idempotent.
*/

-- ============================================================
-- 1. profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  gender text CHECK (gender IN ('male','female')),
  age int CHECK (age BETWEEN 3 AND 120),
  level_chosen text CHECK (level_chosen IN ('past','orta','yaxshi')),
  placement_score int,
  placement_stars int,
  placement_count int,
  difficulty text NOT NULL DEFAULT 'orta' CHECK (difficulty IN ('oson','orta','qiyin')),
  theme text NOT NULL DEFAULT 'light' CHECK (theme IN ('light','dark')),
  streak int NOT NULL DEFAULT 0,
  best_streak int NOT NULL DEFAULT 0,
  last_visit date,
  onboarded boolean NOT NULL DEFAULT false,
  linny_intro_seen boolean NOT NULL DEFAULT false,
  daily_word_count integer NOT NULL DEFAULT 10,
  vocab_last_generated date,
  vocab_last_test_date date,
  vocab_setup_done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own profile read" ON public.profiles;
CREATE POLICY "own profile read" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own profile insert" ON public.profiles;
CREATE POLICY "own profile insert" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own profile update" ON public.profiles;
CREATE POLICY "own profile update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. daily_progress
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL,
  UNIQUE (user_id, day)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_progress TO authenticated;
GRANT ALL ON public.daily_progress TO service_role;
ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own daily progress select" ON public.daily_progress;
CREATE POLICY "own daily progress select" ON public.daily_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own daily progress insert" ON public.daily_progress;
CREATE POLICY "own daily progress insert" ON public.daily_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own daily progress update" ON public.daily_progress;
CREATE POLICY "own daily progress update" ON public.daily_progress
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own daily progress delete" ON public.daily_progress;
CREATE POLICY "own daily progress delete" ON public.daily_progress
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 3. vocab_words
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vocab_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  word text NOT NULL,
  translation text NOT NULL,
  pronunciation text,
  example text,
  example_uz text,
  topic text,
  assigned_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  learned_at timestamptz,
  is_favorite boolean NOT NULL DEFAULT false,
  favorited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vocab_words TO authenticated;
GRANT ALL ON public.vocab_words TO service_role;
ALTER TABLE public.vocab_words ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own vocab select" ON public.vocab_words;
CREATE POLICY "own vocab select" ON public.vocab_words
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own vocab insert" ON public.vocab_words;
CREATE POLICY "own vocab insert" ON public.vocab_words
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own vocab update" ON public.vocab_words;
CREATE POLICY "own vocab update" ON public.vocab_words
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own vocab delete" ON public.vocab_words;
CREATE POLICY "own vocab delete" ON public.vocab_words
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS vocab_words_user_date_idx
  ON public.vocab_words(user_id, assigned_date);
CREATE INDEX IF NOT EXISTS vocab_words_user_fav_idx
  ON public.vocab_words(user_id, is_favorite) WHERE is_favorite = true;

-- ============================================================
-- Triggers: updated_at on profiles + auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'nickname'
    )
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Revoke function execution from non-admin roles
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;