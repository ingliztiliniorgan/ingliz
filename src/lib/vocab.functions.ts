import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateText, Output } from "ai";
import { getGateway } from "./ai-gateway.server";
import { AI_MODEL } from "./ai-model";

const MODEL = AI_MODEL;


const WordSchema = z.object({
  word: z.string(),
  translation: z.string(),
  pronunciation: z.string(),
  example: z.string(),
  example_uz: z.string(),
  topic: z.string(),
});

function levelDescriptor(level: string) {
  if (level === "past") return "A1 boshlang'ich — eng oddiy va tez-tez ishlatiladigan so'zlar (200 asosiy so'z ichida).";
  if (level === "orta") return "A2-B1 o'rta — kundalik hayotdagi keng ishlatiladigan so'zlar.";
  return "B1-B2 yaxshi — professional, akademik va nozik ma'nodagi so'zlar.";
}

function ageContext(age: number) {
  if (age <= 12) return "Bola uchun: hayvonlar, ranglar, mevalar, oila, o'yinlar, maktab.";
  if (age <= 17) return "O'smir uchun: do'stlar, texnologiya, o'yinlar, sport, ijtimoiy tarmoqlar.";
  return "Katta uchun: ish, biznes, kundalik hayot, sayohat, texnologiya, IT.";
}

// ============= Ensure today's words exist and return them =============
export const ensureTodaysWords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { supabase, userId } = context;

    // Get profile config
    const { data: profile } = await supabase
      .from("profiles")
      .select("daily_word_count, vocab_last_generated, level_chosen, age, vocab_source, vocab_bank_ready, vocab_last_test_date")
      .eq("user_id", userId)
      .maybeSingle();

    const dailyCount = (profile?.daily_word_count as number) ?? 10;
    const level = (profile?.level_chosen as string) ?? "past";
    const age = (profile?.age as number) ?? 20;
    const usePdfBank = profile?.vocab_source === "pdf" && !!profile?.vocab_bank_ready;

    // Roll over: any pending word from earlier days → move to today
    await supabase
      .from("vocab_words")
      .update({ assigned_date: today })
      .eq("user_id", userId)
      .neq("status", "learned")
      .lt("assigned_date", today);

    // Count today's words
    const { count: existingCount } = await supabase
      .from("vocab_words")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("assigned_date", today);

    const need = dailyCount - (existingCount ?? 0);

    if (need > 0 && profile?.vocab_last_generated !== today) {
      // Get already-learned words to avoid duplicates
      const { data: learnedRows } = await supabase
        .from("vocab_words")
        .select("word")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(200);
      const seen = new Set((learnedRows ?? []).map((r) => (r.word as string).toLowerCase()));

      const gw = getGateway(userId);
      const Schema = z.object({ items: z.array(WordSchema).min(1).max(30) });

      // --- Source 1: the user's own PDF word bank (Oxford list). Words come in
      // CEFR order (A1 → C2), so difficulty grows naturally over the months.
      let bankPicked: { id: string; word: string; cefr: string }[] = [];
      if (usePdfBank) {
        const { data: bank } = await supabase
          .from("vocab_bank")
          .select("id, word, cefr")
          .eq("user_id", userId)
          .eq("used", false)
          .order("level_rank", { ascending: true })
          .order("position", { ascending: true })
          .limit(need);
        bankPicked = (bank ?? []) as { id: string; word: string; cefr: string }[];
      }

      const prompt = bankPicked.length
        ? `Sen ingliz tili o'qituvchisisan. Quyidagi inglizcha so'zlar (Oxford ro'yxatidan, darajasi bilan) uchun o'zbek tilida ma'lumot tayyorla.
So'zlar: ${bankPicked.map((b) => `${b.word} (${b.cefr})`).join(", ")}

Har bir so'z uchun AYNAN shu so'zni saqlab:
- "word": aynan berilgan inglizcha so'z (kichik harflarda, o'zgartirmang)
- "translation": o'zbekcha tarjima (asosiy ma'nosi)
- "pronunciation": o'zbekcha harflarda talaffuz (masalan "beautiful" → "byu-ti-ful")
- "example": so'z ishlatilgan oddiy inglizcha gap
- "example_uz": gapning o'zbekcha tarjimasi
- "topic": qisqa mavzu tegi

Barcha ${bankPicked.length} ta so'zni qaytar. JSON: {"items":[...]}`
        : `Sen ingliz tili o'qituvchisi. ${ageContext(age)} Daraja: ${levelDescriptor(level)}
Foydalanuvchi uchun bugungi ${need} ta yangi inglizcha so'z tanlang. Real suhbatda tez-tez ishlatiladigan, foydali so'zlar bo'lsin.

Quyidagi so'zlarni TAKRORLAMANG: ${Array.from(seen).slice(0, 100).join(", ") || "(hech qanday)"}

Har biri uchun:
- "word": inglizcha so'z (kichik harflarda)
- "translation": o'zbekcha tarjima
- "pronunciation": o'zbekcha harflarda talaffuz (masalan "beautiful" → "byu-ti-ful")
- "example": inglizcha oddiy misol gap
- "example_uz": gapning o'zbekcha tarjimasi
- "topic": qisqa mavzu tegi (masalan "food", "work", "emotions", "tech")

JSON: {"items":[...]}`;

      const { output } = await generateText({
        model: gw(MODEL),
        output: Output.object({ schema: Schema }),
        prompt,
      });

      const allowed = new Set(bankPicked.map((b) => b.word));
      const rows = output.items
        .map((w) => ({ ...w, word: w.word.toLowerCase().trim() }))
        .filter((w) => (bankPicked.length ? allowed.has(w.word) : !seen.has(w.word)))
        .slice(0, need)
        .map((w) => ({
          user_id: userId,
          word: w.word,
          translation: w.translation,
          pronunciation: w.pronunciation,
          example: w.example,
          example_uz: w.example_uz,
          topic: bankPicked.find((b) => b.word === w.word)?.cefr ?? w.topic,
          assigned_date: today,
          status: "pending",
        }));

      if (rows.length > 0) {
        await supabase.from("vocab_words").insert(rows);
        if (bankPicked.length) {
          const doneIds = bankPicked.filter((b) => rows.some((r) => r.word === b.word)).map((b) => b.id);
          if (doneIds.length) {
            await supabase.from("vocab_bank").update({ used: true }).in("id", doneIds);
          }
        }
      }
      await supabase
        .from("profiles")
        .update({ vocab_last_generated: today })
        .eq("user_id", userId);
    }


    // Return today's words
    const { data: words } = await supabase
      .from("vocab_words")
      .select("*")
      .eq("user_id", userId)
      .eq("assigned_date", today)
      .order("created_at", { ascending: true });

    const testedToday = profile && (profile as { vocab_last_test_date?: string }).vocab_last_test_date === today;

    return {
      words: (words ?? []) as VocabRow[],
      dailyCount,
      testedToday: !!testedToday,
    };
  });

export type VocabRow = {
  id: string;
  word: string;
  translation: string;
  pronunciation: string | null;
  example: string | null;
  example_uz: string | null;
  topic: string | null;
  assigned_date: string;
  status: string;
  is_favorite: boolean;
  favorited_at: string | null;
  learned_at: string | null;
};

// ============= Mark words as "shown" (user opened them) =============
export const markWordsShown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ ids: z.array(z.string()) }).parse(d))
  .handler(async ({ data, context }) => {
    if (data.ids.length === 0) return { ok: true };
    await context.supabase
      .from("vocab_words")
      .update({ status: "shown" })
      .in("id", data.ids)
      .eq("status", "pending");
    return { ok: true };
  });

// ============= Toggle favorite =============
export const toggleFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string(), favorite: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("vocab_words")
      .update({
        is_favorite: data.favorite,
        favorited_at: data.favorite ? new Date().toISOString() : null,
      })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    return { ok: true };
  });

// ============= Favorites list =============
export const listFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("vocab_words")
      .select("*")
      .eq("user_id", context.userId)
      .eq("is_favorite", true)
      .order("favorited_at", { ascending: false });
    return (data ?? []) as VocabRow[];
  });

// ============= Update daily word count =============
export const setDailyWordCount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ count: z.number().int().min(5).max(30) }).parse(d))
  .handler(async ({ data, context }) => {
    await context.supabase
      .from("profiles")
      .update({ daily_word_count: data.count, vocab_setup_done: true })
      .eq("user_id", context.userId);
    return { ok: true };
  });

// ============= Build vocab test (today + % of previously learned) =============
type TestItem =
  | { kind: "mcq"; wordId: string; word: string; q: string; choices: string[]; answerIndex: number }
  | { kind: "write"; wordId: string; translation: string; answer: string };

export const buildVocabTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ oldPercent: z.number().min(10).max(70) }).parse(d))
  .handler(async ({ data, context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { supabase, userId } = context;

    const { data: todayWords } = await supabase
      .from("vocab_words")
      .select("*")
      .eq("user_id", userId)
      .eq("assigned_date", today);

    const { data: learnedWords } = await supabase
      .from("vocab_words")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "learned")
      .limit(200);

    const todays = (todayWords ?? []) as VocabRow[];
    const learned = (learnedWords ?? []) as VocabRow[];

    const oldCount = Math.round((todays.length * data.oldPercent) / 100);
    const shuffled = [...learned].sort(() => Math.random() - 0.5).slice(0, oldCount);
    const pool = [...todays, ...shuffled].sort(() => Math.random() - 0.5);

    // Build distractors from the pool
    const allTranslations = Array.from(
      new Set([...todays, ...learned].map((w) => w.translation)),
    );

    const items: TestItem[] = pool.map((w, i) => {
      // Alternate MCQ and write
      if (i % 2 === 0) {
        const distractors = allTranslations
          .filter((t) => t !== w.translation)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        const choices = [w.translation, ...distractors].sort(() => Math.random() - 0.5);
        return {
          kind: "mcq",
          wordId: w.id,
          word: w.word,
          q: `"${w.word}" ning ma'nosi?`,
          choices,
          answerIndex: choices.indexOf(w.translation),
        };
      }
      return {
        kind: "write",
        wordId: w.id,
        translation: w.translation,
        answer: w.word,
      };
    });

    return { items, hasOld: learned.length > 0 };
  });

// ============= Finalize test result =============
export const finalizeVocabTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        correctIds: z.array(z.string()),
        total: z.number().int(),
        passed: z.boolean(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    if (data.passed && data.correctIds.length > 0) {
      const today = new Date().toISOString().slice(0, 10);
      await context.supabase
        .from("vocab_words")
        .update({ status: "learned", learned_at: new Date().toISOString() })
        .in("id", data.correctIds)
        .eq("user_id", context.userId);
      await context.supabase
        .from("profiles")
        .update({ vocab_last_test_date: today })
        .eq("user_id", context.userId);
    }
    return { ok: true };
  });
