import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateText, Output } from "ai";
import { getGateway } from "./ai-gateway.server";

const MODEL = "gemini-flash-latest";

const ImagesSchema = z.array(z.string().min(20)).min(1).max(6);

const READING_RULES = `Rasmlar "NEW Round-Up" ingliz tili mashq daftaridan olingan. Kitob eski, qog'oz sifati past, rasmlar xira bo'lishi mumkin.
Juda sinchkovlik bilan tekshiring: har bir raqam, chiziq, bo'sh joy (____), jadval katakchasi, crossword to'rlari, kichik rasmchalar va yo'riqnoma matnini alohida ko'rib chiqing.
Agar biror joyni ANIQ o'qiy olmasangiz — taxmin qilmang, "unclear" maydonida qaysi joy tushunarsizligini o'zbekcha aniq yozing.`;

const TaskSchema = z.object({
  page: z.number(),
  number: z.string(),
  title: z.string(),
  type: z.string(),
});

function imageParts(images: string[]) {
  return images.map((img) => ({ type: "image" as const, image: img }));
}

// ============ 1. Scan the uploaded page(s) and list the exercises ============
export const scanRoundUpPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ images: ImagesSchema, description: z.string().max(1000).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const gw = getGateway();
    const Schema = z.object({
      tasks: z.array(TaskSchema),
      unclear: z.string(),
    });

    const { output } = await generateText({
      model: gw(MODEL),
      output: Output.object({ schema: Schema }),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${READING_RULES}

Vazifa: yuborilgan ${data.images.length} ta sahifadagi BARCHA topshiriqlarni aniqlang.
Har bir topshiriq uchun:
- "page": sahifa tartib raqami (1 dan boshlab, yuborilgan rasmlar tartibida)
- "number": kitobdagi topshiriq raqami (masalan "1", "2", "A", "B")
- "title": topshiriq nima qilishni so'rayotgani — o'zbekcha 1 qisqa gap
- "type": turi (masalan "bo'sh joyni to'ldirish", "crossword", "rasmga mos so'z", "gap tuzish")

Javob ni HECH QACHON yozmang — faqat topshiriqlar ro'yxati.
"unclear": agar biror sahifa yoki rasm tushunarsiz bo'lsa, o'zbekcha aniq yozing; aks holda bo'sh matn qoldiring.`,
            },
            ...imageParts(data.images),
          ],
        },
      ],
    });

    return { tasks: output.tasks, unclear: output.unclear?.trim() ?? "" };
  });

// ============ 2. Teach how to solve (never the answer) ============
export const guideRoundUpTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        images: ImagesSchema,
        taskRef: z.string().min(1),
        description: z.string().max(1000).optional(),
        mode: z.enum(["guide", "simple", "answer"]),
        userNote: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const gw = getGateway();

    const modeRules =
      data.mode === "guide"
        ? `USLUB: Tajribali ustoz kabi tushuntiring. Topshiriqda nima so'ralayotganini ayting, kerakli qoidani misollar bilan yozing (misollar TOPSHIRIQDAN OLINMASIN — o'zingiz boshqa misol o'ylab toping), va qadam-baqadam qanday qilishni ko'rsating.
QAT'IY TAQIQ: topshiriqning javoblarini yozmang, javobga yaqin ham keltirmang, bo'sh joylarga nima yozilishini aytmang.`
        : data.mode === "simple"
          ? `USLUB: Endi JUDA SODDA qilib, bolaga tushuntirayotgandek qayta tushuntiring. Qisqa gaplar, oddiy so'zlar, kundalik hayotdan taqqoslash. Boshqa (o'zingiz o'ylab topgan) misol bilan ko'rsatib bering.
QAT'IY TAQIQ: baribir topshiriqning javoblarini yozmang va javobga yaqin ham keltirmang.`
          : `USLUB: Foydalanuvchi javobni ko'rishni tanladi. Endi TO'G'RI JAVOBLARNI to'liq yozing (har bir bo'sh joy / band uchun), so'ng har bir javob NEGA to'g'ri ekanini batafsil tushuntiring.`;

    const { text } = await generateText({
      model: gw(MODEL),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${READING_RULES}

Siz o'zbek tilida gaplashadigan ingliz tili ustozisiz. Foydalanuvchi ingliz tilini yangi boshlagan.
Yordam kerak bo'lgan topshiriq: ${data.taskRef}
${data.description ? `Foydalanuvchi izohi: ${data.description}` : ""}
${data.userNote ? `Foydalanuvchi qo'shimchasi: ${data.userNote}` : ""}

${modeRules}

Javobni o'zbek tilida, markdown sarlavha va ro'yxatlar bilan, tartibli yozing.
Agar sahifadagi biror joyni aniq o'qiy olmasangiz, boshida "⚠️ Tushunmadim:" deb qaysi joy tushunarsizligini yozing va foydalanuvchidan tushuntirishni so'rang.`,
            },
            ...imageParts(data.images),
          ],
        },
      ],
    });

    return { text };
  });
