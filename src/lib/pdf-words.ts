// Browser-side Oxford-word-list PDF reader.
// Runs entirely in the browser (pdf.js) so no big file ever leaves the device —
// only the clean word + CEFR list is sent to the server.

export type BankEntry = { word: string; cefr: string };

const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"];
const CEFR_RE = /\b(A1|A2|B1|B2|C1|C2)\b/gi;
const STOP = new Set(["the", "and", "oxford", "page", "list", "words", "word", "level"]);

export async function readPdfText(file: File, onProgress?: (p: number) => void): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const chunks: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // Rebuild lines from item positions so "word ... B2" stays on one line.
    const lines = new Map<number, string[]>();
    for (const item of content.items as { str: string; transform: number[] }[]) {
      if (!item.str?.trim()) continue;
      const y = Math.round(item.transform[5]);
      const arr = lines.get(y) ?? [];
      arr.push(item.str);
      lines.set(y, arr);
    }
    const ordered = [...lines.entries()].sort((a, b) => b[0] - a[0]);
    chunks.push(ordered.map(([, parts]) => parts.join(" ")).join("\n"));
    onProgress?.(i / doc.numPages);
  }
  return chunks.join("\n");
}

/**
 * Extract "word + CEFR level" pairs. Oxford lists write the level next to each
 * entry (e.g. `abandon v. /əˈbændən/ B2`), so we take the first English word of
 * a line together with the level found on that same line.
 */
export function extractEntries(text: string): BankEntry[] {
  const out: BankEntry[] = [];
  const seen = new Set<string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.length > 200) continue;

    const levels = line.match(CEFR_RE);
    // A line can hold several entries in multi-column PDFs — split on levels.
    const segments = levels && levels.length > 1 ? line.split(CEFR_RE) : [line];

    let li = 0;
    for (const seg of segments) {
      if (CEFR.includes(seg.toUpperCase())) continue;
      const level = levels?.[li++]?.toUpperCase();
      const word = seg
        .replace(/\/[^/]*\//g, " ") // drop phonetics
        .replace(/\([^)]*\)/g, " ")
        .match(/[A-Za-z][A-Za-z'’-]{1,20}/)?.[0]
        ?.toLowerCase()
        .replace(/[’']s$/, "");
      if (!word || word.length < 2 || STOP.has(word)) continue;
      if (seen.has(word)) continue;
      seen.add(word);
      out.push({ word, cefr: level && CEFR.includes(level) ? level : "A1" });
    }
  }

  return out;
}

export const cefrOrder = (c: string) => Math.max(1, CEFR.indexOf(c.toUpperCase()) + 1);
