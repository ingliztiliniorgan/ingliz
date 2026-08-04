import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

const EntrySchema = z.object({
  word: z.string().min(2).max(40),
  cefr: z.string().max(2),
});

/** Current vocabulary source + how far the imported word bank has been used. */
export const getVocabConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: profile } = await supabase
      .from("profiles")
      .select("vocab_source, vocab_bank_ready, daily_word_count")
      .eq("user_id", userId)
      .maybeSingle();

    const { count: total } = await supabase
      .from("vocab_bank")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    const { count: used } = await supabase
      .from("vocab_bank")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("used", true);

    return {
      source: (profile?.vocab_source as "pdf" | "ai" | null) ?? null,
      bankReady: !!profile?.vocab_bank_ready,
      dailyCount: (profile?.daily_word_count as number) ?? 10,
      bankTotal: total ?? 0,
      bankUsed: used ?? 0,
    };
  });

export const setVocabSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ source: z.enum(["pdf", "ai"]) }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("profiles")
      .upsert(
        { user_id: context.userId, vocab_source: data.source },
        { onConflict: "user_id" },
      );
    return { ok: true };
  });

/**
 * Store the word list read from the user's PDF. Words keep their CEFR level and
 * original order, so the daily plan can walk from the easiest to the hardest
 * over months of study.
 */
export const importVocabBank = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ entries: z.array(EntrySchema).min(10).max(6000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const seen = new Set<string>();
    const rows = data.entries
      .map((e) => ({ word: e.word.toLowerCase().trim(), cefr: e.cefr.toUpperCase() }))
      .filter((e) => {
        if (!/^[a-z][a-z'’-]{1,30}$/.test(e.word) || seen.has(e.word)) return false;
        seen.add(e.word);
        return true;
      })
      .map((e) => (CEFR.includes(e.cefr as (typeof CEFR)[number]) ? e : { ...e, cefr: "A1" }))
      .sort(
        (a, b) => CEFR.indexOf(a.cefr as (typeof CEFR)[number]) - CEFR.indexOf(b.cefr as (typeof CEFR)[number]),
      )
      .map((e, i) => ({
        user_id: userId,
        word: e.word,
        cefr: e.cefr,
        level_rank: CEFR.indexOf(e.cefr as (typeof CEFR)[number]) + 1,
        position: i,
        used: false,
      }));

    if (rows.length < 10) {
      return { ok: false as const, imported: 0, error: "PDF dan so'zlar ajratilmadi. Boshqa PDF sinab ko'ring." };
    }

    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await supabase
        .from("vocab_bank")
        .upsert(rows.slice(i, i + 500), { onConflict: "user_id,word" });
      if (error) return { ok: false as const, imported: i, error: error.message };
    }

    await supabase
      .from("profiles")
      .upsert(
        { user_id: userId, vocab_source: "pdf", vocab_bank_ready: true },
        { onConflict: "user_id" },
      );

    const byLevel: Record<string, number> = {};
    for (const r of rows) byLevel[r.cefr] = (byLevel[r.cefr] ?? 0) + 1;

    return { ok: true as const, imported: rows.length, byLevel, error: null };
  });

/** Start over with a different PDF or switch back to AI-generated words. */
export const resetVocabBank = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("vocab_bank").delete().eq("user_id", context.userId);
    await context.supabase
      .from("profiles")
      .update({ vocab_source: null, vocab_bank_ready: false })
      .eq("user_id", context.userId);
    return { ok: true };
  });
