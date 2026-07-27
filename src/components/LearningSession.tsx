import { useState } from "react";
import type { Profile } from "@/lib/types";
import { updateProfile } from "@/lib/profile";
import { ageBandOf } from "@/lib/theme";
import AIQuiz from "./methods/AIQuiz";
import RulesMode from "./methods/RulesMode";
import SkillsMode from "./methods/SkillsMode";
import Flashcards from "./methods/Flashcards";
import Spelling from "./methods/Spelling";
import Translate from "./methods/Translate";
import Shadowing from "./methods/Shadowing";
import CodeExplainer from "./methods/CodeExplainer";
import Vocabulary from "./methods/Vocabulary";

interface Props {
  profile: Profile;
  onExit: () => void;
}

type Method =
  | "vocab" | "quiz" | "rules" | "skills" | "topics" | "flashcards"
  | "spelling" | "translate" | "shadowing" | "code";

const methods: { key: Method; title: string; desc: string; emoji: string }[] = [
  { key: "vocab", title: "Lug'at (kunlik)", desc: "Kuniga X so'z — yodlash + test tizimi", emoji: "📚" },
  { key: "quiz", title: "Savollar orqali", desc: "AI umumiy mavzudan turli savollar beradi", emoji: "❓" },
  { key: "rules", title: "Qoidalar bo'yicha", desc: "So'z/qoidani misollar bilan tushuntiradi", emoji: "📘" },
  { key: "skills", title: "Ko'nikmalar", desc: "Vocabulary, Grammar, Reading, Speaking", emoji: "🎯" },
  { key: "topics", title: "Mavzular", desc: "O'zingiz mavzu yozing — AI test tuzadi", emoji: "🧭" },
  { key: "flashcards", title: "Flashcards", desc: "Kartochkalar — so'z, tarjima, talaffuz", emoji: "🃏" },
  { key: "spelling", title: "Yozish", desc: "So'zni to'g'ri yozish mashqi", emoji: "✍️" },
  { key: "translate", title: "Tarjima", desc: "AI sizning tarjimangizni baholaydi", emoji: "🌍" },
  { key: "shadowing", title: "Talaffuz (Ovoz)", desc: "Eshiting va takrorlang — AI eshitadi", emoji: "🎧" },
  { key: "code", title: "Kod / Matn", desc: "Inglizcha kod yoki matnni tushuntiraman", emoji: "💻" },
];

const introFor = (p: Profile) => {
  const band = ageBandOf(p.age);
  const name = p.name ?? "do'stim";
  if (band === "kid") return `Salom, ${name}! Men Linny — sizga inglizchani o'yin qilib o'rgataman. Tayyormisan?`;
  if (band === "teen") return `Salom, ${name}! Men Linny — sening ingliz tili yordamching. Boshlaymizmi?`;
  return `Assalomu alaykum, ${name}. Men Linny — sizning shaxsiy ingliz tili o'qituvchingiz.`;
};

export default function LearningSession({ profile, onExit }: Props) {
  const [stage, setStage] = useState<"intro" | "method">(profile.linnyIntroSeen ? "method" : "intro");
  const [active, setActive] = useState<Method | null>(null);

  function proceedFromIntro() {
    updateProfile({ linnyIntroSeen: true });
    setStage("method");
  }

  if (stage === "intro") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-surface max-w-lg w-full p-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full gradient-brand flex items-center justify-center text-4xl">🦉</div>
          <h2 className="mt-4 text-2xl font-bold">Linny</h2>
          <p className="mt-3 text-muted-foreground">{introFor(profile)}</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={onExit} className="btn-ghost">Keyinroq</button>
            <button onClick={proceedFromIntro} className="btn-primary">Boshladik 🚀</button>
          </div>
        </div>
      </div>
    );
  }

  const back = () => setActive(null);
  if (active === "vocab") return <Vocabulary profile={profile} onBack={back} />;
  if (active === "quiz")
    return <AIQuiz profile={profile} askTopic={false} defaultTopic="umumiy ingliz tili" skill="general" title="Savollar orqali" intro="" onBack={back} />;
  if (active === "rules") return <RulesMode profile={profile} onBack={back} />;
  if (active === "skills") return <SkillsMode profile={profile} onBack={back} />;
  if (active === "topics")
    return <AIQuiz profile={profile} askTopic={true} skill="general" title="Mavzular"
      intro="Istalgan mavzuni yozing (futbol, dasturlash, Photoshop...) — AI real vaqtda test tuzadi." onBack={back} />;
  if (active === "flashcards") return <Flashcards profile={profile} onBack={back} />;
  if (active === "spelling") return <Spelling profile={profile} onBack={back} />;
  if (active === "translate") return <Translate profile={profile} onBack={back} />;
  if (active === "shadowing") return <Shadowing profile={profile} onBack={back} />;
  if (active === "code") return <CodeExplainer profile={profile} onBack={back} />;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">
      <button onClick={onExit} className="btn-ghost text-sm">← Panelga</button>
      <h2 className="mt-6 text-2xl md:text-3xl font-bold">Ingliz tilini qanday o'rganmoqchisiz?</h2>
      <p className="text-muted-foreground mt-1">Bittasini tanlang — har biri boshqacha ishlaydi.</p>

      <div className="mt-6 grid md:grid-cols-2 gap-3">
        {methods.map((m) => (
          <button key={m.key} onClick={() => setActive(m.key)}
            className="card-surface p-4 text-left transition-all hover:-translate-y-0.5">
            <div className="flex items-start gap-3">
              <div className="text-2xl">{m.emoji}</div>
              <div>
                <div className="font-semibold">{m.title}</div>
                <div className="text-sm text-muted-foreground">{m.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
