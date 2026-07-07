import { useExamState } from "@/lib/exam/exam-state";
import type { ExamReport } from "@/lib/exam/types";

/**
 * Returns weakest knowledge areas across the learner's most recent exam
 * reports. The simulator uses this to bias scenario ordering so learners
 * practice the topics they underperform on.
 */
export function useExamWeaknesses(limit = 5): {
  latest: ExamReport | null;
  weakestKAs: string[];
  strongestKAs: string[];
  passProbability: number | null;
} {
  const { history } = useExamState();
  const latest = history[0] ?? null;
  const kaAgg = new Map<string, { correct: number; total: number }>();
  for (const r of history.slice(0, 3)) {
    for (const k of r.knowledgeAreaScores) {
      const cur = kaAgg.get(k.knowledgeArea) ?? { correct: 0, total: 0 };
      cur.correct += k.correct;
      cur.total += k.total;
      kaAgg.set(k.knowledgeArea, cur);
    }
  }
  const scored = Array.from(kaAgg.entries()).map(([ka, v]) => ({
    ka,
    percent: v.total ? Math.round((v.correct / v.total) * 100) : 0,
    total: v.total,
  }));
  scored.sort((a, b) => a.percent - b.percent);
  return {
    latest,
    weakestKAs: scored.slice(0, limit).map((s) => s.ka),
    strongestKAs: scored.slice(-limit).reverse().map((s) => s.ka),
    passProbability: latest?.passProbability ?? null,
  };
}
