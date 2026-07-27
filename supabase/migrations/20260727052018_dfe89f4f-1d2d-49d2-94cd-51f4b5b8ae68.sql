
CREATE TABLE public.vocab_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
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

CREATE POLICY "own vocab words" ON public.vocab_words
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX vocab_words_user_date_idx ON public.vocab_words(user_id, assigned_date);
CREATE INDEX vocab_words_user_fav_idx ON public.vocab_words(user_id, is_favorite) WHERE is_favorite = true;

ALTER TABLE public.profiles
  ADD COLUMN daily_word_count integer NOT NULL DEFAULT 10,
  ADD COLUMN vocab_last_generated date,
  ADD COLUMN vocab_last_test_date date,
  ADD COLUMN vocab_setup_done boolean NOT NULL DEFAULT false;
