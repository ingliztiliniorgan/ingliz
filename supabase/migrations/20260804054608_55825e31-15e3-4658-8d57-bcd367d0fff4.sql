CREATE TABLE public.vocab_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word text NOT NULL,
  translation text,
  cefr text NOT NULL DEFAULT 'A1',
  level_rank integer NOT NULL DEFAULT 1,
  position integer NOT NULL DEFAULT 0,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, word)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vocab_bank TO authenticated;
GRANT ALL ON public.vocab_bank TO service_role;

ALTER TABLE public.vocab_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own vocab bank" ON public.vocab_bank
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX vocab_bank_pick_idx ON public.vocab_bank (user_id, used, level_rank, position);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS vocab_source text,
  ADD COLUMN IF NOT EXISTS vocab_bank_ready boolean NOT NULL DEFAULT false;