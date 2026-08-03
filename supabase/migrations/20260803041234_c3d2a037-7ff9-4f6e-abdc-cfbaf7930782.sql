-- Remove any read/modify privileges for regular users on the sensitive keys table
REVOKE SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES ON public.gemini_keys FROM authenticated;
REVOKE ALL ON public.gemini_keys FROM anon;
GRANT INSERT ON public.gemini_keys TO authenticated;
GRANT ALL ON public.gemini_keys TO service_role;

-- Explicit, restrictive policies so intent is documented and fails closed
DROP POLICY IF EXISTS "No client read of api keys" ON public.gemini_keys;
CREATE POLICY "No client read of api keys"
  ON public.gemini_keys FOR SELECT TO authenticated, anon
  USING (false);

DROP POLICY IF EXISTS "No client update of api keys" ON public.gemini_keys;
CREATE POLICY "No client update of api keys"
  ON public.gemini_keys FOR UPDATE TO authenticated, anon
  USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "No client delete of api keys" ON public.gemini_keys;
CREATE POLICY "No client delete of api keys"
  ON public.gemini_keys FOR DELETE TO authenticated, anon
  USING (false);

COMMENT ON TABLE public.gemini_keys IS 'Sensitive AI API keys. Readable only by service_role via server-side code. Clients may insert their own key (added_by = auth.uid()) and can never read, update, or delete rows.';