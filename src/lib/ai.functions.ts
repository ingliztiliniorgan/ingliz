import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getGateway } from "./ai-gateway.server";
import { AI_MODEL } from "./ai-model";

const MODEL = AI_MODEL;


const QuestionSchema = z.object({
  q: z.string(),
  choices: z.array(z.string()).length(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
  hint: z.string().optional(),
  tag: z.string().optional(),
});
const QuestionsSchema = z.object({ items: z.array(QuestionSchema) });

const FlashcardSchema = z.object({
  word: z.string(),
  translation: z.string(),
  emoji: z.string().optional(),
  example: z.string(),
  exampleUz: z.string(),
  pronunciation: z.string(),
  grammarNote: z.string().optional(),
});
const FlashcardsSchema = z.object({ items: z.array(FlashcardSchema) });

const RuleExampleSchema = z.object({
  title: z.string(),
  intro: z.string(),
  examples: z.array(z.object({ en: z.string(), uz: z.string(), note: z.string().optional() })),
});

function ageDescriptor(age: number) {
  if (age <= 10) return `${age} yoshli bola. So'zlar bolalarga qiziq (hayvonlar, mevalar, ranglar, o'yinchoqlar, oila). Juda oddiy va qisqa gaplar.`;
  if (age <= 17) return `${age} yoshli o'smir. Maktab, do'stlar, o'yinlar, texnologiya mavzulari mos.`;
  return `${age} yoshli katta. Ish, IT, kompyuter, sayohat, biznes, kundalik hayot mos.`;
}

function levelDescriptor(level: string) {
  if (level === "past") return "Boshlang'ich (A1). Eng oddiy so'z va gaplar.";
  if (level === "orta") return "O'rta (A2-B1). Oddiy zamonlar, ko'proq lug'at.";
  return "Yaxshi (B1-B2). Murakkabroq gaplar va iboralar.";
}

function difficultyDescriptor(d: string) {
  if (d === "oson") return "OSON daraja: eng ko'p uchraydigan so'zlar, aniq va qisqa savollar. Har savolda 1 gapli maslahat (hint) qo'shing.";
  if (d === "qiyin") return "QIYIN daraja: aldash uchun yaqin variantlar, uzunroq gaplar. Hint bermang.";
  return "O'RTA daraja: balansli, ba'zilariga qisqa hint qo'shing.";
}

export const genQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        age: z.number().int(),
        level: z.enum(["past", "orta", "yaxshi"]),
        topic: z.string().min(1),
        count: z.number().int().min(1).max(20),
        skill: z.enum(["vocabulary", "grammar", "reading", "speaking", "general"]).default("general"),
        difficulty: z.enum(["oson", "orta", "qiyin"]).default("orta"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const gw = getGateway(context.userId);
    const skillPrompt =
      data.skill === "vocabulary"
        ? "Ko'proq so'z-tarjima yoki so'z ma'nosini topish savollari."
        : data.skill === "grammar"
          ? "Grammatika (zamonlar, artikllar, predloglar) savollari."
          : data.skill === "reading"
            ? "Qisqa matndan tushunish savollari."
            : data.skill === "speaking"
              ? "Talaffuz va gapga mos javob tanlash savollari — har savolda inglizcha so'zning taxminiy o'zbekcha talaffuzini ko'rsating."
              : "Umumiy mavzulash savollari.";

    const prompt = `Sen ingliz tili muallimisan. Foydalanuvchi: ${ageDescriptor(data.age)} Daraja: ${levelDescriptor(
      data.level,
    )} ${difficultyDescriptor(data.difficulty)} Mavzu: "${data.topic}". ${skillPrompt}

${data.count} ta ko'p variantli test tuz. Har biri uchun:
- "q": o'zbekcha savol matni (inglizcha bo'sh joyli gap yoki so'z bo'lishi mumkin)
- "choices": 4 ta variant
- "answerIndex": to'g'ri javob indeksi (0-3)
- "explanation": o'zbekcha 1-2 gapli izoh
- "hint": ixtiyoriy — oson darajada 1 gapli yordam
- "tag": mavzu tegi (masalan: "articles", "prepositions/of", "past-simple", "vocab/animals")

Faqat JSON qaytar: {"items":[...]}`;

    const { output } = await generateText({
      model: gw(MODEL),
      output: Output.object({ schema: QuestionsSchema }),
      prompt,
    });
    return output.items;
  });

export const genFlashcards = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        age: z.number().int(),
        theme: z.string().min(1),
        count: z.number().int().min(3).max(15).default(8),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const gw = getGateway(context.userId);
    const prompt = `Sen ingliz tili muallimisan. Foydalanuvchi: ${ageDescriptor(data.age)}
Mavzu: "${data.theme}". ${data.count} ta flashcard tayyorla. Har birida:
- "word": inglizcha so'z
- "translation": o'zbekcha tarjima
- "emoji": bitta mos emoji
- "example": inglizcha oddiy misol gap
- "exampleUz": o'sha gapning o'zbekcha tarjimasi
- "pronunciation": so'z qanday o'qilishini o'zbekcha harflarda (masalan "father" → "fa-zer")
- "grammarNote": ixtiyoriy — 1 gapli grammatik eslatma (masalan "ko'plik shakli: cats")

Faqat JSON: {"items":[...]}`;
    const { output } = await generateText({
      model: gw(MODEL),
      output: Output.object({ schema: FlashcardsSchema }),
      prompt,
    });
    return output.items;
  });

export const genRuleExplanation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ age: z.number().int(), rule: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const gw = getGateway(context.userId);
    const prompt = `Sen ingliz tili muallimisan. Foydalanuvchi: ${ageDescriptor(data.age)}
"${data.rule}" ni tushuntir. 6-10 ta real hayotdan olingan misollar bilan. Har misolning o'zbekcha tarjimasi bo'lsin.

JSON: {"title": "...", "intro": "o'zbekcha 2-3 gap qoida", "examples": [{"en":"...","uz":"...","note":"ixtiyoriy izoh"}]}`;
    const { output } = await generateText({
      model: gw(MODEL),
      output: Output.object({ schema: RuleExampleSchema }),
      prompt,
    });
    return output;
  });

// Deep explanation on-demand — "Ko'proq ma'lumot"
export const deepExplain = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        age: z.number().int(),
        question: z.string(),
        wrongAnswer: z.string().optional(),
        correctAnswer: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const gw = getGateway(context.userId);
    const prompt = `Sen ingliz tili muallimisan. ${ageDescriptor(data.age)}
Savol: "${data.question}"
${data.wrongAnswer ? `Foydalanuvchi javobi: "${data.wrongAnswer}" (noto'g'ri)` : ""}
To'g'ri javob: "${data.correctAnswer}"

Chuqurroq va do'stona uslubda o'zbekchada tushuntir:
1) Qoida nima ekanligini
2) Nima uchun bu variant to'g'ri
3) Yana 3 ta o'xshash misol (ingliz + tarjima)
4) Xotirada saqlash uchun oddiy mnemonika/qoida

Faqat JSON: {"summary":"...", "why":"...", "examples":[{"en":"...","uz":"..."}], "mnemonic":"..."}`;
    const Schema = z.object({
      summary: z.string(),
      why: z.string(),
      examples: z.array(z.object({ en: z.string(), uz: z.string() })),
      mnemonic: z.string(),
    });
    const { output } = await generateText({
      model: gw(MODEL),
      output: Output.object({ schema: Schema }),
      prompt,
    });
    return output;
  });

// Translation grading (UZ↔EN)
export const gradeTranslation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        source: z.string(),
        userAnswer: z.string(),
        direction: z.enum(["uz-en", "en-uz"]),
        age: z.number().int(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const gw = getGateway(context.userId);
    const prompt = `Sen ingliz tili o'qituvchisisan. ${ageDescriptor(data.age)}
Yo'nalish: ${data.direction === "uz-en" ? "O'zbekchadan Inglizchaga" : "Inglizchadan O'zbekchaga"}
Manba: "${data.source}"
Talabaning tarjimasi: "${data.userAnswer}"

Baholang: mazmun to'g'rimi? Grammatika? Tabiiy jaranglaydimi?
JSON: {"score":0-100 son, "ideal":"eng yaxshi tarjima", "feedback":"o'zbekcha qisqa fikr (1-3 gap)", "corrections":[{"was":"...","should":"..."}]}`;
    const Schema = z.object({
      score: z.number(),
      ideal: z.string(),
      feedback: z.string(),
      corrections: z.array(z.object({ was: z.string(), should: z.string() })).default([]),
    });
    const { output } = await generateText({
      model: gw(MODEL),
      output: Output.object({ schema: Schema }),
      prompt,
    });
    return output;
  });

// Translate sentence bank
export const genTranslateSet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        age: z.number().int(),
        direction: z.enum(["uz-en", "en-uz"]),
        topic: z.string().default("umumiy"),
        count: z.number().int().min(3).max(10).default(5),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const gw = getGateway(context.userId);
    const prompt = `${ageDescriptor(data.age)}
${data.count} ta tarjima uchun gap tuz. Mavzu: ${data.topic}.
Yo'nalish: ${data.direction === "uz-en" ? "o'zbekcha manba, inglizchaga tarjima qilinadi" : "inglizcha manba, o'zbekchaga tarjima qilinadi"}.
Har gap 3-8 so'zdan iborat, foydalanuvchining darajasiga mos.

JSON: {"items":[{"source":"...","ideal":"..."}]}`;
    const Schema = z.object({ items: z.array(z.object({ source: z.string(), ideal: z.string() })) });
    const { output } = await generateText({
      model: gw(MODEL),
      output: Output.object({ schema: Schema }),
      prompt,
    });
    return output.items;
  });

// Spelling words
export const genSpellingWords = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        age: z.number().int(),
        topic: z.string().default("umumiy"),
        count: z.number().int().min(4).max(15).default(8),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const gw = getGateway(context.userId);
    const prompt = `${ageDescriptor(data.age)}
${data.count} ta inglizcha so'z tanlang (mavzu: ${data.topic}). Yozilishi biroz qiyin lekin foydali bo'lsin.
Har birida: so'z, o'zbekcha ma'nosi, hint (birinchi harf va nechta harf), talaffuz.

JSON: {"items":[{"word":"...","translation":"...","hint":"b_____ (7)","pronunciation":"be-a-yu-ti-fool"}]}`;
    const Schema = z.object({
      items: z.array(
        z.object({ word: z.string(), translation: z.string(), hint: z.string(), pronunciation: z.string() }),
      ),
    });
    const { output } = await generateText({
      model: gw(MODEL),
      output: Output.object({ schema: Schema }),
      prompt,
    });
    return output.items;
  });

// IT Code/Text explainer
export const explainCodeText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ input: z.string().min(3), age: z.number().int() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    try {
      const gw = getGateway(context.userId);
      const prompt = `${ageDescriptor(data.age)}
Foydalanuvchi inglizcha matn yoki kod parchasini yubordi. Uni o'zbek tilida tushuntir. Agar kod bo'lsa — nima qilishini, agar matn bo'lsa — mazmunini va notanish so'zlarni tarjima qil.

Kirish:
"""${data.input}"""

JSON: {"summary":"1-2 gap o'zbekcha xulosa", "lineByLine":[{"en":"...","uz":"..."}], "vocab":[{"word":"...","meaning":"..."}]}`;
      const Schema = z.object({
        summary: z.string(),
        lineByLine: z.array(z.object({ en: z.string(), uz: z.string() })),
        vocab: z.array(z.object({ word: z.string(), meaning: z.string() })).default([]),
      });
      const { output } = await generateText({
        model: gw(MODEL),
        output: Output.object({ schema: Schema }),
        prompt,
        maxRetries: 0,
      });
      return { ok: true as const, data: output };
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI javob bera olmadi";
      if (/limit|429|quota|resource_exhausted/i.test(message)) {
        return {
          ok: false as const,
          error: "Gemini so'rovlari limiti tugadi. 1-2 daqiqa kutib, qayta urinib ko'ring.",
        };
      }
      return { ok: false as const, error: message };
    }
  });

// Daily challenge — 3 mixed mini-tasks
const DailyTaskSchema = z.object({
  type: z.enum(["quiz", "translate", "match"]),
  q: z.string().optional(),
  choices: z.array(z.string()).optional(),
  answerIndex: z.number().int().optional(),
  explanation: z.string().optional(),
  source: z.string().optional(),
  direction: z.enum(["uz-en", "en-uz"]).optional(),
  ideal: z.string().optional(),
  word: z.string().optional(),
  translation: z.string().optional(),
  example: z.string().optional(),
});
export type DailyTask = z.infer<typeof DailyTaskSchema>;

export const genDailyChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ age: z.number().int(), level: z.enum(["past", "orta", "yaxshi"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const gw = getGateway(context.userId);
    const prompt = `${ageDescriptor(data.age)} Daraja: ${levelDescriptor(data.level)}
Bugungi 3 mini vazifa tuz — har xil turdagi qisqa mashqlar (1 ta quiz, 1 ta tarjima, 1 ta so'z-emoji mos qilish).
JSON: {"tasks":[
 {"type":"quiz","q":"...","choices":["","","",""],"answerIndex":0,"explanation":"..."},
 {"type":"translate","source":"...","direction":"uz-en","ideal":"..."},
 {"type":"match","word":"...","translation":"...","example":"..."}
]}`;
    const Schema = z.object({ tasks: z.array(DailyTaskSchema) });
    const { output } = await generateText({
      model: gw(MODEL),
      output: Output.object({ schema: Schema }),
      prompt,
    });
    return output.tasks;
  });
