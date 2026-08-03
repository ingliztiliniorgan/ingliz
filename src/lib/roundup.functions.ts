import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateText } from "ai";
import { getGateway } from "./ai-gateway.server";

// ============ 1. Scan the uploaded page(s) and list the exercises ============
export const scanRoundUpPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ images: z.array(z.string().min(20)).min(1).max(6), description: z.string().max(1000).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const {
      ROUNDUP_MODEL,
      ROUNDUP_READING_RULES,
      parseRoundUpScan,
      roundUpImageParts,
    } = await import("./roundup.server");
    const gw = getGateway();

    try {
      const { text } = await generateText({
        model: gw(ROUNDUP_MODEL),
        maxRetries: 0,
        messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${ROUNDUP_READING_RULES}

Vazifa: yuborilgan ${data.images.length} ta sahifadagi BARCHA topshiriqlarni aniqlang.
Har bir topshiriqni AYNAN bitta qatorda shu ko'rinishda yozing:
TASK | sahifa_tartib_raqami | topshiriq_raqami | o'zbekcha_qisqa_mazmun | mashq_turi

Javob ni HECH QACHON yozmang — faqat topshiriqlar ro'yxati.
Agar biror joy tushunarsiz bo'lsa oxirida "UNCLEAR | o'zbekcha izoh" yozing.
JSON yozmang, markdown jadval yoki code fence ishlatmang.`,
            },
            ...roundUpImageParts(data.images),
          ],
        },
        ],
      });

      const parsed = parseRoundUpScan(text);
      return { tasks: parsed.tasks, unclear: parsed.unclear, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sahifani tahlil qilib bo'lmadi.";
      return { tasks: [], unclear: "", error: message };
    }
  });

// ============ 2. Teach how to solve (never the answer) ============
export const guideRoundUpTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        images: z.array(z.string().min(20)).min(1).max(6),
        taskRef: z.string().min(1),
        description: z.string().max(1000).optional(),
        mode: z.enum(["guide", "simple", "answer"]),
        userNote: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { ROUNDUP_MODEL, ROUNDUP_READING_RULES, roundUpImageParts } = await import("./roundup.server");
    const gw = getGateway();

    const modeRules =
      data.mode === "guide"
        ? `USLUB: Tajribali ustoz kabi tushuntiring. Topshiriqda nima so'ralayotganini ayting, kerakli qoidani misollar bilan yozing (misollar TOPSHIRIQDAN OLINMASIN — o'zingiz boshqa misol o'ylab toping), va qadam-baqadam qanday qilishni ko'rsating.
QAT'IY TAQIQ: topshiriqning javoblarini yozmang, javobga yaqin ham keltirmang, bo'sh joylarga nima yozilishini aytmang.`
        : data.mode === "simple"
          ? `USLUB: Endi JUDA SODDA qilib, bolaga tushuntirayotgandek qayta tushuntiring. Qisqa gaplar, oddiy so'zlar, kundalik hayotdan taqqoslash. Boshqa (o'zingiz o'ylab topgan) misol bilan ko'rsatib bering.
QAT'IY TAQIQ: baribir topshiriqning javoblarini yozmang va javobga yaqin ham keltirmang.`
          : `USLUB: Foydalanuvchi javobni ko'rishni tanladi. Endi TO'G'RI JAVOBLARNI to'liq yozing (har bir bo'sh joy / band uchun), so'ng har bir javob NEGA to'g'ri ekanini batafsil tushuntiring.`;

    try {
      const { text } = await generateText({
        model: gw(ROUNDUP_MODEL),
        maxRetries: 0,
        messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${ROUNDUP_READING_RULES}

Siz o'zbek tilida gaplashadigan ingliz tili ustozisiz. Foydalanuvchi ingliz tilini yangi boshlagan.
Yordam kerak bo'lgan topshiriq: ${data.taskRef}
${data.description ? `Foydalanuvchi izohi: ${data.description}` : ""}
${data.userNote ? `Foydalanuvchi qo'shimchasi: ${data.userNote}` : ""}

${modeRules}

Javobni o'zbek tilida, markdown sarlavha va ro'yxatlar bilan, tartibli yozing.
Agar sahifadagi biror joyni aniq o'qiy olmasangiz, boshida "⚠️ Tushunmadim:" deb qaysi joy tushunarsizligini yozing va foydalanuvchidan tushuntirishni so'rang.`,
            },
            ...roundUpImageParts(data.images),
          ],
        },
        ],
      });

      return { text, error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI javob bera olmadi.";
      return { text: "", error: message };
    }
  });
