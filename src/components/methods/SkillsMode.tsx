import { useState } from "react";
import AIQuiz from "./AIQuiz";
import Vocabulary from "./Vocabulary";
import type { Profile } from "@/lib/types";

interface Props {
  profile: Profile;
  onBack: () => void;
}

type Skill = "vocabulary" | "grammar" | "reading" | "speaking";

const skills: { key: Skill; title: string; desc: string; emoji: string }[] = [
  { key: "vocabulary", title: "Vocabulary", desc: "Kunlik so'z yodlash tizimi", emoji: "📚" },
  { key: "grammar", title: "Grammar", desc: "Zamon, artikllar, predloglar", emoji: "🧩" },
  { key: "reading", title: "Reading", desc: "Qisqa matn va tushunish", emoji: "📖" },
  { key: "speaking", title: "Speaking", desc: "Talaffuz — qanday o'qiladi", emoji: "🗣️" },
];

export default function SkillsMode({ profile, onBack }: Props) {
  const [chosen, setChosen] = useState<Skill | null>(null);

  if (chosen === "vocabulary") {
    return <Vocabulary profile={profile} onBack={() => setChosen(null)} />;
  }

  if (chosen) {
    return (
      <AIQuiz
        profile={profile}
        askTopic={false}
        defaultTopic={
          chosen === "grammar"
            ? "asosiy inglizcha grammatika"
            : chosen === "reading"
              ? "qisqa matnni o'qib tushunish"
              : "so'zlarning to'g'ri talaffuzi"
        }
        skill={chosen}
        title={chosen}
        intro=""
        onBack={() => setChosen(null)}
      />
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <button onClick={onBack} className="btn-ghost text-sm">← Panelga</button>
      <h2 className="mt-6 text-2xl md:text-3xl font-bold">Ko'nikmalar</h2>
      <p className="text-muted-foreground mt-1">Qaysi ko'nikmani mashq qilamiz?</p>
      <div className="mt-6 grid md:grid-cols-2 gap-3">
        {skills.map((s) => (
          <button
            key={s.key}
            onClick={() => setChosen(s.key)}
            className="card-surface p-4 text-left hover:-translate-y-0.5 transition"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">{s.emoji}</div>
              <div>
                <div className="font-semibold">{s.title}</div>
                <div className="text-sm text-muted-foreground">{s.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
