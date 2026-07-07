// Exam domain types. Question bank is JSON-driven so new banks can be dropped in.

export type ExamDomain = "People" | "Process" | "Business Environment";
export type Difficulty = "Easy" | "Medium" | "Hard" | "Expert";

export interface ExamOption {
  id: string; // "A" | "B" | "C" | "D"
  text: string;
  rationale: string; // why this option is right/wrong
}

export interface ExamQuestion {
  id: string;
  domain: ExamDomain;
  knowledgeArea: string; // e.g. "Risk Management"
  difficulty: Difficulty;
  question: string;
  options: ExamOption[];
  correctOptionId: string;
  mindset: string; // PMI mindset takeaway
  examStrategy?: string;
  tags?: string[];
}

export interface ExamAnswer {
  questionId: string;
  selectedOptionId: string | null;
  markedForReview: boolean;
  timeSpentMs: number;
  confidence?: 1 | 2 | 3 | 4 | 5;
}

export interface ExamSession {
  id: string;
  startedAt: number;
  durationMs: number; // total exam duration (e.g. 230 min)
  remainingMs: number; // updated on pause / break
  questionIds: string[];
  answers: Record<string, ExamAnswer>;
  currentIndex: number;
  status: "in_progress" | "on_break" | "submitted";
  breakCount: number;
  totalBreakMs: number;
  lastTickAt: number; // used to compute elapsed since last tick
  mode: "full" | "mini" | "custom";
}

export interface DomainScore {
  domain: ExamDomain;
  correct: number;
  total: number;
  percent: number;
}

export interface KAScore {
  knowledgeArea: string;
  correct: number;
  total: number;
  percent: number;
}

export interface ExamReport {
  id: string;
  sessionId: string;
  completedAt: number;
  durationTakenMs: number;
  totalQuestions: number;
  correctCount: number;
  overallPercent: number;
  readiness: "Not Ready" | "Building" | "Approaching" | "Ready" | "Exam Ready";
  passProbability: number; // 0-100
  domainScores: DomainScore[];
  knowledgeAreaScores: KAScore[];
  strongestTopics: string[];
  weakestTopics: string[];
  tooFast: string[]; // question IDs answered < 20s
  tooSlow: string[]; // question IDs answered > 3 min
  avgConfidence: number; // 1-5 or 0 if none captured
  avgTimePerQuestionMs: number;
  difficultyBreakdown: Record<Difficulty, { correct: number; total: number }>;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  earnedAt: number;
}

export const CAREER_LEVELS = [
  { name: "Intern", minXp: 0 },
  { name: "Project Coordinator", minXp: 150 },
  { name: "Junior PM", minXp: 400 },
  { name: "Project Manager", minXp: 800 },
  { name: "Senior PM", minXp: 1400 },
  { name: "Program Manager", minXp: 2200 },
  { name: "PMO Director", minXp: 3200 },
  { name: "Portfolio Manager", minXp: 4500 },
  { name: "PMP Master", minXp: 6000 },
] as const;

export interface Gamification {
  xp: number;
  achievements: Achievement[];
  streakDays: number;
  lastStudyDate: string | null; // YYYY-MM-DD
  studyDates: string[]; // sorted unique
}
