import { cleanAiError } from "@/lib/ai-error";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { scanRoundUpPage, guideRoundUpTask } from "@/lib/roundup.functions";
import type { Profile } from "@/lib/types";

interface Props {
  profile: Profile;
  onBack: () => void;
}

type Task = { page: number; number: string; title: string; type: string };
type Step = "collect" | "camera" | "scanning" | "choose" | "guide";

const MAX_IMAGES = 6;

/** Downscale + compress a picked file so the request stays small. */
function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Rasmni o'qib bo'lmadi"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Rasm buzuq"));
      img.onload = () => {
        const max = 1600;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function simpleMarkdown(text: string) {
  return text.split("\n").map((line, i) => {
    const t = line.trim();
    if (!t) return <div key={i} className="h-2" />;
    if (t.startsWith("### ")) return <h4 key={i} className="mt-3 font-bold">{t.slice(4)}</h4>;
    if (t.startsWith("## ")) return <h3 key={i} className="mt-4 text-lg font-bold">{t.slice(3)}</h3>;
    if (t.startsWith("# ")) return <h3 key={i} className="mt-4 text-xl font-bold">{t.slice(2)}</h3>;
    const bullet = /^[-*•]\s+/.test(t);
    const body = bullet ? t.replace(/^[-*•]\s+/, "") : t;
    const parts = body.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
      p.startsWith("**") && p.endsWith("**") ? <strong key={j}>{p.slice(2, -2)}</strong> : <span key={j}>{p}</span>,
    );
    return (
      <p key={i} className={bullet ? "pl-4 relative before:content-['•'] before:absolute before:left-0" : ""}>
        {parts}
      </p>
    );
  });
}

export default function RoundUp({ onBack }: Props) {
  const [step, setStep] = useState<Step>("collect");
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [unclear, setUnclear] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [allMode, setAllMode] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [queue, setQueue] = useState<string[]>([]);
  const [qi, setQi] = useState(0);
  const [guide, setGuide] = useState("");
  const [loading, setLoading] = useState(false);
  const [helpText, setHelpText] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState<string | null>(null);
  const [extraNote, setExtraNote] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const scan = useServerFn(scanRoundUpPage);
  const askGuide = useServerFn(guideRoundUpTask);

  // ---------- camera ----------
  async function openCamera() {
    setErr(null);
    setAddOpen(false);
    setStep("camera");
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
      });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
      }
    } catch {
      setErr("Kameraga ruxsat berilmadi. Galereyadan rasm yuklashingiz mumkin.");
      setStep("collect");
    }
  }
  function closeCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStep("collect");
  }
  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  function shoot() {
    const v = videoRef.current;
    if (!v) return;
    const max = 1600;
    const scale = Math.min(1, max / Math.max(v.videoWidth, v.videoHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(v.videoWidth * scale);
    c.height = Math.round(v.videoHeight * scale);
    c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
    setImages((p) => [...p, c.toDataURL("image/jpeg", 0.85)].slice(0, MAX_IMAGES));
    closeCamera();
  }

  async function pickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    setAddOpen(false);
    setErr(null);
    try {
      const urls: string[] = [];
      for (const f of files.slice(0, MAX_IMAGES)) urls.push(await fileToCompressedDataUrl(f));
      setImages((p) => [...p, ...urls].slice(0, MAX_IMAGES));
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Rasm yuklanmadi");
    }
  }

  // ---------- send ----------
  async function send() {
    if (images.length === 0) return;
    setErr(null);
    setStep("scanning");
    try {
      const r = await scan({ data: { images, description: description.trim() || undefined } });
      if (r.error) {
        setErr(cleanAiError(r.error));
        setStep("collect");
        return;
      }
      setTasks(r.tasks);
      setUnclear(r.unclear);
      const many = r.tasks.length > 1;
      if (!many || description.trim()) {
        const ref = description.trim()
          ? `Foydalanuvchi izohida ko'rsatilgan topshiriq${r.tasks.length === 1 ? ` (${r.tasks[0].number}-topshiriq)` : ""}`
          : r.tasks.length === 1
            ? `${r.tasks[0].page}-sahifa, ${r.tasks[0].number}-topshiriq`
            : "sahifadagi topshiriq";
        setQueue([ref]);
        setQi(0);
        await loadGuide(ref, "guide");
      } else {
        setStep("choose");
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Tahlil qilinmadi");
      setStep("collect");
    }
  }

  async function loadGuide(ref: string, mode: "guide" | "simple" | "answer", note?: string) {
    setLoading(true);
    setErr(null);
    if (mode === "guide") {
      setStep("guide");
      setGuide("");
    }
    try {
      const r = await askGuide({
        data: { images, taskRef: ref, description: description.trim() || undefined, mode, userNote: note },
      });
      if (r.error) {
        setErr(cleanAiError(r.error));
        return;
      }
      if (mode === "guide") setGuide(r.text);
      if (mode === "simple") setHelpText(r.text);
      if (mode === "answer") setAnswerText(r.text);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "AI javob bermadi");
    } finally {
      setLoading(false);
    }
  }

  function startSelected() {
    const refs = allMode
      ? tasks.map((t) => `${t.page}-sahifa, ${t.number}-topshiriq`)
      : selected.map((k) => {
          const [page, number] = k.split("|");
          return `${page}-sahifa, ${number}-topshiriq`;
        });
    if (refs.length === 0) return;
    setQueue(refs);
    setQi(0);
    void loadGuide(refs[0], "guide");
  }

  function reset(withCamera: boolean) {
    setImages([]);
    setDescription("");
    setTasks([]);
    setSelected([]);
    setAllMode(false);
    setQueue([]);
    setQi(0);
    setGuide("");
    setHelpText(null);
    setAnswerText(null);
    setExtraNote("");
    setUnclear("");
    setErr(null);
    if (withCamera) void openCamera();
    else setStep("collect");
  }

  // ---------- camera view ----------
  if (step === "camera") {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <video ref={videoRef} playsInline muted className="flex-1 w-full object-contain" />
        <div className="p-4 flex items-center justify-center gap-4 bg-black">
          <button onClick={closeCamera} className="btn-ghost text-white">Bekor qilish</button>
          <button onClick={shoot} className="w-16 h-16 rounded-full bg-white border-4 border-white/50" aria-label="Rasmga olish" />
        </div>
      </div>
    );
  }

  // ---------- header ----------
  const header = (
    <>
      <button onClick={onBack} className="btn-ghost text-sm">← Orqaga</button>
      <h2 className="mt-6 text-2xl md:text-3xl font-bold">📕 New Round-Up</h2>
      <p className="text-muted-foreground mt-1">
        Mashq daftaridagi sahifani rasmga oling — javobni aytmasdan, qanday yechishni o'rgataman.
      </p>
    </>
  );

  if (step === "scanning") {
    return (
      <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
        {header}
        <div className="card-surface p-8 mt-6 text-center">
          <div className="text-4xl animate-pulse">🔎</div>
          <p className="mt-3 font-semibold">Sahifa sinchiklab tekshirilmoqda...</p>
          <p className="text-sm text-muted-foreground mt-1">Bir necha soniya kuting.</p>
        </div>
      </div>
    );
  }

  // ---------- task chooser ----------
  if (step === "choose") {
    const numbers = Array.from(new Set(tasks.map((t) => t.number)));
    return (
      <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
        {header}
        {unclear && (
          <div className="card-surface p-4 mt-4 text-sm border-l-4 border-yellow-500">
            <b>⚠️ Tushunmadim:</b> {unclear}
          </div>
        )}
        <div className="card-surface p-5 mt-6">
          <div className="font-semibold">Sahifada {tasks.length} ta topshiriq topildi.</div>
          <div className="text-sm text-muted-foreground">Qaysi biriga yordam kerak? (bir nechtasini tanlashingiz mumkin)</div>

          <div className="mt-4 flex flex-wrap gap-2">
            {numbers.map((n) => {
              const pages = tasks.filter((t) => t.number === n).map((t) => t.page);
              const multi = pages.length > 1;
              const keys = pages.map((p) => `${p}|${n}`);
              const active = !allMode && keys.some((k) => selected.includes(k));
              return (
                <div key={n} className="relative">
                  <button
                    onClick={() => {
                      if (allMode) return;
                      if (multi) {
                        setExpanded(expanded === n ? null : n);
                        return;
                      }
                      const k = keys[0];
                      setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
                    }}
                    className={`px-4 py-2 rounded-2xl border font-semibold transition ${
                      active ? "bg-primary text-primary-foreground" : "bg-background"
                    } ${allMode ? "opacity-40" : ""}`}
                  >
                    {n}
                    {multi ? " ▾" : ""}
                  </button>
                  {multi && expanded === n && !allMode && (
                    <div className="absolute z-10 mt-2 card-surface p-2 min-w-40">
                      <div className="text-xs text-muted-foreground px-2 pb-1">Qaysi sahifadagi?</div>
                      {pages.map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            const k = `${p}|${n}`;
                            setSelected((s) => (s.includes(k) ? s.filter((x) => x !== k) : [...s, k]));
                          }}
                          className={`block w-full text-left px-2 py-1.5 rounded-lg text-sm ${
                            selected.includes(`${p}|${n}`) ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                          }`}
                        >
                          {p}-sahifa
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <button
              onClick={() => {
                setAllMode((v) => !v);
                setSelected([]);
                setExpanded(null);
              }}
              className={`px-4 py-2 rounded-2xl border font-semibold ${
                allMode ? "bg-primary text-primary-foreground" : "bg-background"
              }`}
            >
              Hammasi
            </button>
          </div>

          <ul className="mt-5 space-y-2 text-sm">
            {tasks.map((t, i) => (
              <li key={i} className="text-muted-foreground">
                <b className="text-foreground">{t.page}-sahifa · {t.number}:</b> {t.title}{" "}
                <span className="opacity-70">({t.type})</span>
              </li>
            ))}
          </ul>

          <button
            onClick={startSelected}
            disabled={!allMode && selected.length === 0}
            className="btn-primary w-full mt-5 disabled:opacity-40"
          >
            Yordam olish →
          </button>
        </div>
      </div>
    );
  }

  // ---------- guide ----------
  if (step === "guide") {
    const ref = queue[qi] ?? "";
    return (
      <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
        {header}
        <div className="card-surface p-5 mt-6">
          <div className="text-sm text-muted-foreground">
            {ref}
            {queue.length > 1 ? ` · ${qi + 1}/${queue.length}` : ""}
          </div>
          {loading && !guide ? (
            <div className="py-10 text-center">
              <div className="text-3xl animate-pulse">🧑‍🏫</div>
              <p className="mt-2 text-sm text-muted-foreground">Tushuntirish tayyorlanmoqda...</p>
            </div>
          ) : (
            <div className="mt-3 space-y-1 leading-relaxed">{simpleMarkdown(guide)}</div>
          )}
          {err && <div className="mt-3 text-sm text-red-500">{err}</div>}
          {err && !loading && (
            <button onClick={() => void loadGuide(ref, "guide")} className="btn-ghost mt-3">
              Qayta urinish
            </button>
          )}

          {guide.includes("Tushunmadim") && (
            <div className="mt-4">
              <textarea
                value={extraNote}
                onChange={(e) => setExtraNote(e.target.value)}
                placeholder="Rasmdagi tushunarsiz joyni menga tushuntirib bering..."
                className="w-full rounded-2xl border p-3 bg-background text-sm"
                rows={3}
              />
              <button
                onClick={() => loadGuide(ref, "guide", extraNote)}
                disabled={extraNote.trim().length < 3}
                className="btn-ghost mt-2 disabled:opacity-40"
              >
                Tushuntirishni yubordim →
              </button>
            </div>
          )}

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button onClick={() => loadGuide(ref, "simple")} className="btn-ghost">🤝 Yordam</button>
            {qi + 1 < queue.length ? (
              <button
                onClick={() => {
                  setQi(qi + 1);
                  void loadGuide(queue[qi + 1], "guide");
                }}
                className="btn-primary"
              >
                Keyingi topshiriq →
              </button>
            ) : (
              <button onClick={() => reset(true)} className="btn-primary">📷 Yangi yordam olish</button>
            )}
          </div>
        </div>

        {/* help modal */}
        {helpText !== null && (
          <div className="fixed inset-0 z-40 bg-black/50 flex items-end sm:items-center justify-center p-4">
            <div className="card-surface p-5 max-w-lg w-full max-h-[85vh] overflow-auto">
              <h3 className="font-bold text-lg">🤝 Eng sodda tushuntirish</h3>
              <div className="mt-3 space-y-1 text-sm leading-relaxed">{simpleMarkdown(helpText)}</div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button onClick={() => setHelpText(null)} className="btn-ghost">Yopish</button>
                <button onClick={() => loadGuide(ref, "answer")} className="btn-primary">Javobni bilish</button>
              </div>
            </div>
          </div>
        )}

        {/* answer modal */}
        {answerText !== null && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
            <div className="card-surface p-5 max-w-lg w-full max-h-[85vh] overflow-auto">
              <h3 className="font-bold text-lg">✅ To'g'ri javob va izoh</h3>
              <div className="mt-3 space-y-1 text-sm leading-relaxed">{simpleMarkdown(answerText)}</div>
              <button onClick={() => setAnswerText(null)} className="btn-ghost w-full mt-5">Yopish</button>
            </div>
          </div>
        )}

        {loading && (helpText === null || answerText === null) && (guide !== "") && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 card-surface px-4 py-2 text-sm">Yuklanmoqda...</div>
        )}
      </div>
    );
  }

  // ---------- collect ----------
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      {header}

      <input ref={fileRef} type="file" accept="image/*" multiple onChange={pickFiles} className="hidden" />

      {images.length > 0 && (
        <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 gap-3">
          {images.map((src, i) => (
            <div key={i} className="relative">
              <img src={src} alt={`Sahifa ${i + 1}`} className="w-full h-28 object-cover rounded-2xl border" />
              <button
                onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-background border font-bold"
                aria-label="O'chirish"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        {images.length === 0 ? (
          <div className="grid sm:grid-cols-2 gap-3">
            <button onClick={openCamera} className="card-surface p-5 text-left hover:-translate-y-0.5 transition">
              <div className="text-2xl">📷</div>
              <div className="mt-1 font-semibold">Rasmga olish</div>
              <div className="text-sm text-muted-foreground">Kamerani ochib sahifani suratga oling</div>
            </button>
            <button onClick={() => fileRef.current?.click()} className="card-surface p-5 text-left hover:-translate-y-0.5 transition">
              <div className="text-2xl">🖼️</div>
              <div className="mt-1 font-semibold">Rasm yuklash</div>
              <div className="text-sm text-muted-foreground">Galereyadan bir yoki bir nechta rasm</div>
            </button>
          </div>
        ) : (
          <div className="relative inline-block">
            <button
              onClick={() => setAddOpen((v) => !v)}
              disabled={images.length >= MAX_IMAGES}
              className="w-14 h-14 rounded-2xl border-2 border-dashed text-2xl font-bold disabled:opacity-40"
              aria-label="Rasm qo'shish"
            >
              +
            </button>
            {addOpen && (
              <div className="absolute z-10 mt-2 card-surface p-2 min-w-52">
                <button onClick={openCamera} className="block w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-muted">
                  📷 Rasmga olish
                </button>
                <button onClick={() => fileRef.current?.click()} className="block w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-muted">
                  🖼️ Rasm yuklash
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6">
        <label className="text-sm font-semibold">Tavsif (majburiy emas)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Masalan: 2-topshiriqni tushunmadim, qanday qilishni o'rgatib bering."
          className="mt-2 w-full rounded-2xl border p-3 bg-background"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Bo'sh qoldirsangiz — butun sahifani o'qib chiqib, qaysi topshiriqqa yordam kerakligini so'rayman.
        </p>
      </div>

      {err && <div className="mt-4 text-sm text-red-500">{err}</div>}

      <button onClick={send} disabled={images.length === 0} className="btn-primary w-full mt-6 disabled:opacity-40">
        Yuborish →
      </button>
    </div>
  );
}
