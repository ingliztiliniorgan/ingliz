import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getGateway } from "./ai-gateway.server";

const MODEL = "google/gemini-3.6-flash";

const QuestionSchema = z.object({
  q: z.string(),
  choices: z.array(z.string()).length(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
});
const QuestionsSchema = z.object({ items: z.array(QuestionSchema) });

const FlashcardSchema = z.object({
  word: z.string(),
  translation: z.string(),
  emoji: z.string().optional(),
  example: z.string(),
  exampleUz: z.string(),
  pronunciation: z.string(),
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

export const genQuestions = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        age: z.number().int(),
        level: z.enum(["past", "orta", "yaxshi"]),
        topic: z.string().min(1),
        count: z.number().int().min(1).max(20),
        skill: z.enum(["vocabulary", "grammar", "reading", "speaking", "general"]).default("general"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const gw = getGateway();
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

    const prompt = `Sen ingliz tili muallimisan. Foydalanuvchi haqida: ${ageDescriptor(data.age)} Daraja: ${levelDescriptor(
      data.level,
    )} Mavzu: "${data.topic}". ${skillPrompt}

${data.count} ta ko'p variantli test tuz. Har biri uchun:
- "q": o'zbekcha savol matni (inglizcha bo'sh joyli gap yoki so'z bo'lishi mumkin)
- "choices": 4 ta variant
- "answerIndex": to'g'ri javob indeksi (0-3)
- "explanation": o'zbekcha 1-2 gapli izoh, "nima uchun to'g'ri"

Faqat JSON qaytar: {"items":[...]}`;

    const { output } = await generateText({
      model: gw(MODEL),
      output: Output.object({ schema: QuestionsSchema }),
      prompt,
    });
    return output.items;
  });

export const genFlashcards = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        age: z.number().int(),
        theme: z.string().min(1),
        count: z.number().int().min(3).max(15).default(8),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const gw = getGateway();
    const prompt = `Sen ingliz tili muallimisan. Foydalanuvchi: ${ageDescriptor(data.age)}
Mavzu: "${data.theme}". ${data.count} ta flashcard tayyorla. Har birida:
- "word": inglizcha so'z
- "translation": o'zbekcha tarjima
- "emoji": bitta mos emoji
- "example": inglizcha oddiy misol gap
- "exampleUz": o'sha gapning o'zbekcha tarjimasi
- "pronunciation": so'z qanday o'qilishini o'zbekcha harflarda yozib bering (masalan "father" → "fa-zer")

Faqat JSON qaytar: {"items":[...]}`;
    const { output } = await generateText({
      model: gw(MODEL),
      output: Output.object({ schema: FlashcardsSchema }),
      prompt,
    });
    return output.items;
  });

export const genRuleExplanation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ age: z.number().int(), rule: z.string().min(1) }).parse(d),
  )
  .handler(async ({ data }) => {
    const gw = getGateway();
    const prompt = `Sen ingliz tili muallimisan. Foydalanuvchi: ${ageDescriptor(data.age)}
"${data.rule}" ni tushuntir. 6-10 ta turli xil real hayotdan olingan misollar bilan ko'rsating. Har misolning o'zbekcha tarjimasi bo'lsin.

JSON: {"title": "...", "intro": "o'zbekcha 2-3 gap qoida", "examples": [{"en":"...","uz":"...","note":"ixtiyoriy izoh"}]}`;
    const { output } = await generateText({
      model: gw(MODEL),
      output: Output.object({ schema: RuleExampleSchema }),
      prompt,
    });
    return output;
  });
