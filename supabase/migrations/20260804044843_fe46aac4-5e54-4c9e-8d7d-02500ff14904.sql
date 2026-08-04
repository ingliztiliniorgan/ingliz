DROP POLICY IF EXISTS "Authenticated users can add keys" ON public.gemini_keys;

REVOKE INSERT ON public.gemini_keys FROM authenticated;
REVOKE INSERT ON public.gemini_keys FROM anon;

CREATE POLICY "No client insert of api keys"
ON public.gemini_keys
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

GRANT ALL ON public.gemini_keys TO service_role;

COMMENT ON TABLE public.gemini_keys IS 'Sensitive AI credentials. No client access: rows are inserted and read only by trusted server-side code using the service role.';