import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const addGeminiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ apiKey: z.string().min(15).max(400), label: z.string().max(60).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { validateGeminiKey, invalidateKeyCache } = await import("./ai-gateway.server");
    const apiKey = data.apiKey.trim();

    const check = await validateGeminiKey(apiKey);
    if (!check.ok) {
      return { ok: false as const, error: check.error ?? "Kalit ishlamadi. Google AI Studio dan to'g'ri API kalit oling." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("gemini_keys")
      .insert({ api_key: apiKey, label: data.label ?? null, added_by: context.userId });

    if (error && !/duplicate key|unique/i.test(error.message)) {
      return { ok: false as const, error: error.message };
    }

    // Make the new key usable straight away: drop the cached key list and every
    // cooldown, otherwise the pool keeps reporting "limit tugadi" for a while.
    invalidateKeyCache(apiKey);

    return { ok: true as const, already: !!error };
  });


export const getKeyPoolInfo = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { keyPoolInfo } = await import("./ai-gateway.server");
    return await keyPoolInfo();
  });
