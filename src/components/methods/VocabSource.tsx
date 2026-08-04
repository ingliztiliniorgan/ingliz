import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { importVocabBank, setVocabSource } from "@/lib/vocabbank.functions";
import { extractEntries, readPdfText, type BankEntry } from "@/lib/pdf-words";

interface Props {
  onDone: () => void;
  onBack: () => void;
}

/**
 * First-time choice: learn from your own PDF word list (e.g. Oxford 3000, with
 * CEFR levels) or let AI pick words. Shown once — afterwards the choice is
 * stored on the profile.
 */
export default function VocabSource({ onDone, onBack }: Props) {
  const doImport = useServerFn(importVocabBank);
  const setSource = useServerFn(setVocabSource);
  const inputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"choose" | "upload">("choose");
  const [file, setFile] = useState<File | null>(null);
  const [entries, setEntries] = useState<BankEntry[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function pickFile(f: File) {
    setErr(null);
    setEntries(null);
    if (!/\.pdf$/i.test(f.name)) {
      setErr("Faqat PDF fayl yuklang.");
      return;
    }
    setFile(f);
    setBusy("PDF o'qilmoqda...");
    setProgress(0);
    try {
      const text = await readPdfText(f, (p) => setProgress(Math.round(p * 100)));
      const found = extractEntries(text);
      if (found.length < 10) {
        setErr("PDF dan so'zlar ajratilmadi. Matnli (skaner emas) PDF kerak.");
        setEntries(null);
      } else {
        setEntries(found);
      }
    } catch (e) {
      setErr((e as Error).message || "PDF ni o'qib bo'lmadi.");
    } finally {
      setBusy(null);
    }
  }

  async function start() {
    if (!entries) return;
    setBusy("So'zlar bazaga yozilmoqda...");
    setErr(null);
    try {
      const res = await doImport({ data: { entries: entries.slice(0, 6000) } });
      if (!res.ok) {
        setErr(res.error ?? "Yuklab bo'lmadi.");
        return;
      }
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function chooseAi() {
    setBusy("Sozlanmoqda...");
    try {
      await setSource({ data: { source: "ai" } });
      onDone();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const levelCounts = entries
    ? entries.reduce<Record<string, number>>((acc, e) => {
        acc[e.cefr] = (acc[e.cefr] ?? 0) + 1;
        return acc;
      }, {})
    : null;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
      <button onClick={onBack} className="btn-ghost text-sm">← Panelga</button>
      <h2 className="mt-4 text-2xl md:text-3xl font-bold">📚 Lug'atni qanday o'rganamiz?</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Bu tanlov faqat bir marta so'raladi. Keyin har kuni kunlik meyoringizga mos so'zlar chiqadi.
      </p>

      {mode === "choose" && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <button
            onClick={() => setMode("upload")}
            className="card-surface p-5 text-left hover:ring-2 hover:ring-primary transition"
          >
            <div className="text-3xl">📄</div>
            <div className="mt-2 font-bold">PDF ro'yxatim bo'yicha</div>
            <p className="mt-1 text-sm text-muted-foreground">
              O'zingizning so'zlar ro'yxatini (masalan Oxford 3000) yuklang. So'zlar darajasi bo'yicha
              A1 dan boshlab, kun sayin murakkablashib boradi — tartibli va uzoq muddatli yodlash.
            </p>
            <div className="mt-2 text-xs text-primary">Tavsiya etiladi</div>
          </button>

          <button
            onClick={chooseAi}
            disabled={!!busy}
            className="card-surface p-5 text-left hover:ring-2 hover:ring-primary transition disabled:opacity-50"
          >
            <div className="text-3xl">🤖</div>
            <div className="mt-2 font-bold">AI tanlagan so'zlar bilan</div>
            <p className="mt-1 text-sm text-muted-foreground">
              AI yoshingiz va darajangizga qarab har kuni yangi so'zlar tanlaydi. Tayyor ro'yxat
              kerak emas, lekin ketma-ketlik tasodifiy bo'ladi.
            </p>
          </button>
        </div>
      )}

      {mode === "upload" && (
        <div className="mt-6">
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void pickFile(f);
            }}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
              dragOver ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="text-4xl">⬆️</div>
            <div className="mt-2 font-semibold">
              PDF faylni shu yerga tashlang yoki bosib tanlang
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Fayl qurilmangizda o'qiladi — serverga faqat so'zlar ro'yxati yuboriladi.
            </div>
            {file && <div className="mt-3 text-sm">📄 {file.name}</div>}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void pickFile(f);
            }}
          />

          {busy && (
            <div className="mt-4 card-surface p-4 text-sm">
              {busy} {progress > 0 && progress < 100 ? `${progress}%` : ""}
            </div>
          )}

          {entries && !busy && (
            <div className="mt-4 card-surface p-4">
              <div className="font-semibold">✅ {entries.length} ta so'z topildi</div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {Object.entries(levelCounts ?? {})
                  .sort()
                  .map(([lvl, n]) => (
                    <span key={lvl} className="rounded-full border border-border px-2 py-1">
                      {lvl}: {n}
                    </span>
                  ))}
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Eng oson (A1) so'zlardan boshlanadi va daraja ko'tarilib boradi.
              </div>
            </div>
          )}

          {err && (
            <div className="mt-4 p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-sm text-red-600 dark:text-red-400">
              {err}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => setMode("choose")} className="btn-ghost text-sm">
              ← Tanlovga qaytish
            </button>
            <button
              onClick={start}
              disabled={!entries || !!busy}
              className="btn-primary text-sm disabled:opacity-50"
            >
              Boshlash
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
