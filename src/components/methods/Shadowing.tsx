import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { genTranslateSet } from "@/lib/ai.functions";
import type { Profile } from "@/lib/types";

interface Props { profile: Profile; onBack: () => void }

// Web Speech API types (browser)
interface SR extends EventTarget {
  lang: string;
  interimResults: boolean;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
type Win = Window & { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };

export default function Shadowing({ profile, onBack }: Props) {
  const gen = useServerFn(genTranslateSet);
  const [items, setItems] = useState<{ source: string; ideal: string }[]>([]);
  const [idx, setIdx] = useState(0);
  const [heard, setHeard] = useState("");
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<SR | null>(null);

  useEffect(() => {
    (async () => {
      const data = await gen({ data: { age: profile.age ?? 20, direction: "en-uz", topic: "kundalik", count: 6 } });
      setItems(data);
    })();
  }, []); // eslint-disable-line

  useEffect(() => {
    const w = window as Win;
    const R = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!R) { setSupported(false); return; }
    const rec = new R();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (e) => {
      const t = e.results[0]?.[0]?.transcript ?? "";
      setHeard(t);
      setRecording(false);
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    recRef.current = rec;
  }, []);

  function speak(t: string) {
    const u = new SpeechSynthesisUtterance(t);
    u.lang = "en-US";
    window.speechSynthesis.speak(u);
  }
  function record() {
    setHeard("");
    setRecording(true);
    recRef.current?.start();
  }

  if (items.length === 0) {
    return <div className="min-h-screen flex items-center justify-center"><div className="card-surface p-8">🎧 Yuklanmoqda...</div></div>;
  }

  const it = items[idx];
  const clean = (s: string) => s.toLowerCase().replace(/[^a-z ]/g, "").trim();
  const match = heard && clean(heard) === clean(it.source);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost text-sm">← Panelga</button>
        <div className="text-xs text-muted-foreground">{idx + 1}/{items.length}</div>
      </div>
      <div className="card-surface p-6 md:p-8 mt-6 text-center">
        <div className="text-xs uppercase text-muted-foreground">Tinglang, keyin takrorlang</div>
        <div className="text-2xl md:text-3xl font-bold mt-3">{it.source}</div>
        <div className="text-sm text-muted-foreground mt-2">{it.ideal}</div>

        <div className="mt-6 flex justify-center gap-3 flex-wrap">
          <button onClick={() => speak(it.source)} className="btn-ghost">🔊 Eshitish</button>
          {supported ? (
            <button onClick={record} disabled={recording} className="btn-primary disabled:opacity-40">
              {recording ? "🎙️ Yozilmoqda..." : "🎙️ Takrorlash"}
            </button>
          ) : (
            <div className="text-xs text-red-500">Sizning brauzeringiz mikrofonni qo'llab-quvvatlamaydi.</div>
          )}
        </div>

        {heard && (
          <div className={`mt-6 p-4 rounded-xl ${match ? "bg-green-500/10 border border-green-500" : "bg-red-500/10 border border-red-500"}`}>
            <div className="text-xs uppercase">Siz aytdingiz</div>
            <div className="text-lg mt-1">{heard}</div>
            <div className="mt-2 text-2xl">{match ? "🎉 Zo'r!" : "🔁 Yana urinib ko'ring"}</div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={() => { setIdx(Math.max(0, idx - 1)); setHeard(""); }} className="btn-ghost">← Oldingi</button>
          <button onClick={() => { setIdx(Math.min(items.length - 1, idx + 1)); setHeard(""); }} className="btn-primary">Keyingi →</button>
        </div>
      </div>
    </div>
  );
}
