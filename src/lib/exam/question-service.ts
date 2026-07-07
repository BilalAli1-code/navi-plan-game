import questionBank from "./question-bank.json";
import type { Difficulty, ExamDomain, ExamQuestion } from "./types";

// Cast the JSON bank to typed questions. Any additional JSON files can be
// concatenated here to grow the bank without changing the app code.
export const QUESTION_BANK: ExamQuestion[] = questionBank as ExamQuestion[];

export function getQuestionById(id: string): ExamQuestion | undefined {
  return QUESTION_BANK.find((q) => q.id === id);
}

export interface ExamComposition {
  total: number;
  peopleRatio: number; // 0-1
  processRatio: number;
  businessRatio: number;
  difficultyProgression: boolean; // easy -> expert
}

// PMP domain mix: People 42%, Process 50%, Business 8%.
export const PMP_MIX: ExamComposition = {
  total: 180,
  peopleRatio: 0.42,
  processRatio: 0.5,
  businessRatio: 0.08,
  difficultyProgression: true,
};

export const MINI_MIX: ExamComposition = {
  total: 20,
  peopleRatio: 0.42,
  processRatio: 0.5,
  businessRatio: 0.08,
  difficultyProgression: true,
};

const DIFFICULTY_RANK: Record<Difficulty, number> = {
  Easy: 1,
  Medium: 2,
  Hard: 3,
  Expert: 4,
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickFromDomain(domain: ExamDomain, count: number): ExamQuestion[] {
  const pool = QUESTION_BANK.filter((q) => q.domain === domain);
  if (pool.length === 0) return [];
  const picked: ExamQuestion[] = [];
  // Cycle through pool if we need more than available (bank still small).
  const shuffled = shuffle(pool);
  for (let i = 0; i < count; i++) {
    picked.push(shuffled[i % shuffled.length]);
  }
  return picked;
}

export function composeExam(composition: ExamComposition): ExamQuestion[] {
  const p = Math.round(composition.total * composition.peopleRatio);
  const pr = Math.round(composition.total * composition.processRatio);
  const b = composition.total - p - pr;
  const combined = [
    ...pickFromDomain("People", p),
    ...pickFromDomain("Process", pr),
    ...pickFromDomain("Business Environment", b),
  ];
  const shuffled = shuffle(combined);
  if (composition.difficultyProgression) {
    // Sort so difficulty ramps up across the exam.
    return shuffled.sort(
      (a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty],
    );
  }
  return shuffled;
}

export const KNOWLEDGE_AREAS = Array.from(
  new Set(QUESTION_BANK.map((q) => q.knowledgeArea)),
).sort();
