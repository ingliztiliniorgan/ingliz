export type Gender = "male" | "female";
export type LevelName = "past" | "orta" | "yaxshi";
export type Difficulty = "oson" | "orta" | "qiyin";

export interface Profile {
  name?: string;
  gender?: Gender;
  age?: number;
  levelChosen?: LevelName;
  placementScore?: number;
  placementStars?: number;
  placementCount?: number;
  streak?: number;
  lastVisit?: string;
  mistakes?: MistakeItem[];
  theme?: "light" | "dark";
  onboardedProfile?: boolean;
  linnyIntroSeen?: boolean;
  learnedWords?: string[];
  difficulty?: Difficulty;
  dailyChallengeDate?: string;
  dailyChallengeDone?: boolean;
  lastView?: string;
  email?: string;
  dailyGoal?: number;
  goalDate?: string;
  goalCount?: number;
  goalCorrect?: number;
  goalHistory?: { date: string; count: number }[];
}

export interface MistakeItem {
  questionId: string;
  wrongAnswer: string;
  correctAnswer: string;
  at: string;
  tag?: string;
  question?: string;
  explanation?: string;
}

export interface QItem {
  id: string;
  q: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  topic?: string;
}

export interface FlashcardItem {
  word: string;
  translation: string;
  emoji?: string;
  example: string;
  exampleUz: string;
  pronunciation: string;
  grammarNote?: string;
}
