CREATE TABLE public.gemini_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key TEXT NOT NULL UNIQUE,
  label TEXT,
  added_by UUID REFERENCES auth.users,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.gemini_keys TO authenticated;
GRANT ALL ON public.gemini_keys TO service_role;

ALTER TABLE public.gemini_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can add keys"
ON public.gemini_keys FOR INSERT TO authenticated
WITH CHECK (auth.uid() = added_by);