import type {
  Difficulty,
  DomainScore,
  ExamAnswer,
  ExamDomain,
  ExamQuestion,
  ExamReport,
  ExamSession,
  KAScore,
} from "./types";
import { getQuestionById } from "./question-service";

const TOO_FAST_MS = 20_000;
const TOO_SLOW_MS = 180_000;

export function buildReport(session: ExamSession): ExamReport {
  const questions = session.questionIds
    .map((id) => getQuestionById(id))
    .filter((q): q is ExamQuestion => Boolean(q));

  const byDomain: Record<ExamDomain, { correct: number; total: number }> = {
    People: { correct: 0, total: 0 },
    Process: { correct: 0, total: 0 },
    "Business Environment": { correct: 0, total: 0 },
  };

  const byKA = new Map<string, { correct: number; total: number }>();
  const byDifficulty: Record<Difficulty, { correct: number; total: number }> = {
    Easy: { correct: 0, total: 0 },
    Medium: { correct: 0, total: 0 },
    Hard: { correct: 0, total: 0 },
    Expert: { correct: 0, total: 0 },
  };

  const tooFast: string[] = [];
  const tooSlow: string[] = [];
  let correctCount = 0;
  let totalTime = 0;
  let confidenceSum = 0;
  let confidenceCount = 0;
  let answeredCount = 0;

  for (const q of questions) {
    const ans: ExamAnswer | undefined = session.answers[q.id];
    const isCorrect = ans?.selectedOptionId === q.correctOptionId;
    byDomain[q.domain].total += 1;
    byDifficulty[q.difficulty].total += 1;
    const ka = byKA.get(q.knowledgeArea) ?? { correct: 0, total: 0 };
    ka.total += 1;
    if (isCorrect) {
      correctCount += 1;
      byDomain[q.domain].correct += 1;
      byDifficulty[q.difficulty].correct += 1;
      ka.correct += 1;
    }
    byKA.set(q.knowledgeArea, ka);
    if (ans) {
      answeredCount += 1;
      totalTime += ans.timeSpentMs;
      if (ans.confidence) {
        confidenceSum += ans.confidence;
        confidenceCount += 1;
      }
      if (ans.selectedOptionId && ans.timeSpentMs < TOO_FAST_MS) {
        tooFast.push(q.id);
      }
      if (ans.timeSpentMs > TOO_SLOW_MS) {
        tooSlow.push(q.id);
      }
    }
  }

  const overallPercent = questions.length
    ? Math.round((correctCount / questions.length) * 100)
    : 0;

  const domainScores: DomainScore[] = (Object.keys(byDomain) as ExamDomain[]).map(
    (d) => ({
      domain: d,
      correct: byDomain[d].correct,
      total: byDomain[d].total,
      percent: byDomain[d].total
        ? Math.round((byDomain[d].correct / byDomain[d].total) * 100)
        : 0,
    }),
  );

  const kaScores: KAScore[] = Array.from(byKA.entries())
    .map(([knowledgeArea, v]) => ({
      knowledgeArea,
      correct: v.correct,
      total: v.total,
      percent: v.total ? Math.round((v.correct / v.total) * 100) : 0,
    }))
    .sort((a, b) => b.percent - a.percent);

  const strongestTopics = kaScores.slice(0, 3).map((k) => k.knowledgeArea);
  const weakestTopics = kaScores.slice(-3).reverse().map((k) => k.knowledgeArea);

  const readiness = readinessLabel(overallPercent);
  const passProbability = estimatePassProbability(overallPercent, domainScores);

  return {
    id: crypto.randomUUID(),
    sessionId: session.id,
    completedAt: Date.now(),
    durationTakenMs: session.durationMs - session.remainingMs,
    totalQuestions: questions.length,
    correctCount,
    overallPercent,
    readiness,
    passProbability,
    domainScores,
    knowledgeAreaScores: kaScores,
    strongestTopics,
    weakestTopics,
    tooFast,
    tooSlow,
    avgConfidence: confidenceCount ? confidenceSum / confidenceCount : 0,
    avgTimePerQuestionMs: answeredCount ? totalTime / answeredCount : 0,
    difficultyBreakdown: byDifficulty,
  };
}

function readinessLabel(pct: number): ExamReport["readiness"] {
  if (pct < 45) return "Not Ready";
  if (pct < 60) return "Building";
  if (pct < 72) return "Approaching";
  if (pct < 82) return "Ready";
  return "Exam Ready";
}

function estimatePassProbability(overall: number, domains: DomainScore[]) {
  // Weighted: overall score with a floor from the weakest domain.
  const weakest = domains.reduce(
    (min, d) => (d.percent < min ? d.percent : min),
    100,
  );
  const raw = overall * 0.75 + weakest * 0.25;
  return Math.max(0, Math.min(99, Math.round(raw)));
}
