export type Gender = "male" | "female";
export type LevelName = "past" | "orta" | "yaxshi";

export interface Profile {
  gender?: Gender;
  age?: number;
  levelChosen?: LevelName;
  placementScore?: number; // 0-100
  placementStars?: number; // 0-5
  streak?: number;
  lastVisit?: string; // ISO date
  mistakes?: MistakeItem[];
  theme?: "light" | "dark";
  onboardedProfile?: boolean; // gender+age done
}

export interface MistakeItem {
  questionId: string;
  wrongAnswer: string;
  correctAnswer: string;
  at: string;
}

// difficulty: 1 = eng oson, 5 = eng qiyin
export interface QItem {
  id: string;
  q: string; // savol matni (o'zbekcha izoh + inglizcha bo'sh joyli gap)
  choices: string[];
  answerIndex: number;
  explanation: string; // "Nega?" tugmasi uchun
  difficulty: 1 | 2 | 3 | 4 | 5;
  topic?: string;
}
