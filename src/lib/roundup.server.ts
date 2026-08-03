import { z } from "zod";

export const ROUNDUP_MODEL = "gemini-flash-latest";

export const RoundUpImagesSchema = z.array(z.string().min(20)).min(1).max(6);

export const RoundUpTaskSchema = z.object({
  page: z.coerce.number().int().min(1).catch(1),
  number: z.coerce.string().catch("1"),
  title: z.coerce.string().catch("Topshiriqni bajarish"),
  type: z.coerce.string().catch("mashq"),
});

export type RoundUpTask = z.infer<typeof RoundUpTaskSchema>;

export const ROUNDUP_READING_RULES = `Rasmlar "NEW Round-Up" ingliz tili mashq daftaridan olingan. Kitob eski, qog'oz sifati past, rasmlar xira bo'lishi mumkin.
Juda sinchkovlik bilan tekshiring: har bir raqam, chiziq, bo'sh joy (____), jadval katakchasi, crossword to'rlari, kichik rasmchalar va yo'riqnoma matnini alohida ko'rib chiqing.
Agar biror joyni ANIQ o'qiy olmasangiz — taxmin qilmang, tushunarsiz joyni o'zbekcha aniq yozing.`;

export function roundUpImageParts(images: string[]) {
  return images.map((image) => ({ type: "image" as const, image }));
}

function jsonCandidate(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const source = fenced ?? text;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(source.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Gemini does not reliably honor strict JSON schemas for vision responses.
 * Accept JSON, a simple pipe-delimited format, or finally a safe generic task.
 */
export function parseRoundUpScan(text: string): { tasks: RoundUpTask[]; unclear: string } {
  const parsed = jsonCandidate(text);
  if (parsed && typeof parsed === "object") {
    const record = parsed as { tasks?: unknown; unclear?: unknown };
    const tasksResult = z.array(RoundUpTaskSchema).safeParse(record.tasks);
    if (tasksResult.success && tasksResult.data.length > 0) {
      return {
        tasks: tasksResult.data,
        unclear: typeof record.unclear === "string" ? record.unclear.trim() : "",
      };
    }
  }

  const tasks: RoundUpTask[] = [];
  let unclear = "";
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim().replace(/^[-*]\s*/, "");
    if (/^UNCLEAR\s*\|/i.test(line)) {
      unclear = line.split("|").slice(1).join("|").trim();
      continue;
    }
    if (!/^TASK\s*\|/i.test(line)) continue;
    const [, page, number, title, ...typeParts] = line.split("|").map((part) => part.trim());
    const task = RoundUpTaskSchema.safeParse({ page, number, title, type: typeParts.join("|") });
    if (task.success) tasks.push(task.data);
  }

  if (tasks.length > 0) return { tasks, unclear };

  // Never block the important teaching flow just because the model formatted
  // its scan differently. The guide call will inspect the original image again.
  return {
    tasks: [{ page: 1, number: "1", title: "Rasmdagi topshiriq", type: "mashq" }],
    unclear: "Topshiriqlar ro'yxati aniq ajratilmadi, lekin rasm asosida yordam berishni davom ettiraman.",
  };
}