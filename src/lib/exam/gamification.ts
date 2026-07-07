import type { Achievement, ExamReport, Gamification } from "./types";
import { CAREER_LEVELS } from "./types";

export function getLevel(xp: number) {
  let current = CAREER_LEVELS[0];
  let next: (typeof CAREER_LEVELS)[number] | null = null;
  for (let i = 0; i < CAREER_LEVELS.length; i++) {
    if (xp >= CAREER_LEVELS[i].minXp) {
      current = CAREER_LEVELS[i];
      next = CAREER_LEVELS[i + 1] ?? null;
    }
  }
  const progressPct = next
    ? Math.round(
        ((xp - current.minXp) / (next.minXp - current.minXp)) * 100,
      )
    : 100;
  return { current, next, progressPct };
}

export function xpForReport(report: ExamReport): number {
  // 1 xp per correct answer + bonus for readiness tier.
  const bonus =
    report.readiness === "Exam Ready"
      ? 100
      : report.readiness === "Ready"
        ? 60
        : report.readiness === "Approaching"
          ? 30
          : 10;
  return report.correctCount + bonus;
}

interface AchievementRule {
  id: string;
  name: string;
  description: string;
  qualifies: (report: ExamReport) => boolean;
}

const RULES: AchievementRule[] = [
  {
    id: "stakeholder_whisperer",
    name: "Stakeholder Whisperer",
    description: "≥ 85% accuracy in Stakeholder Engagement.",
    qualifies: (r) =>
      hasKaAtLeast(r, "Stakeholder Engagement", 85),
  },
  {
    id: "risk_slayer",
    name: "Risk Slayer",
    description: "≥ 85% accuracy in Risk Management.",
    qualifies: (r) => hasKaAtLeast(r, "Risk Management", 85),
  },
  {
    id: "scope_guardian",
    name: "Scope Guardian",
    description: "≥ 85% accuracy in Scope Management.",
    qualifies: (r) => hasKaAtLeast(r, "Scope Management", 85),
  },
  {
    id: "change_champion",
    name: "Change Control Champion",
    description: "≥ 85% accuracy in Change Control.",
    qualifies: (r) => hasKaAtLeast(r, "Change Control", 85),
  },
  {
    id: "schedule_saver",
    name: "Schedule Saver",
    description: "≥ 85% accuracy in Schedule Management.",
    qualifies: (r) => hasKaAtLeast(r, "Schedule Management", 85),
  },
  {
    id: "value_expert",
    name: "Business Value Expert",
    description: "≥ 85% accuracy in Business Value.",
    qualifies: (r) => hasKaAtLeast(r, "Business Value", 85),
  },
  {
    id: "exam_ready",
    name: "Exam Ready",
    description: "Achieve Exam Ready status on a full-length exam.",
    qualifies: (r) => r.readiness === "Exam Ready" && r.totalQuestions >= 100,
  },
];

function hasKaAtLeast(r: ExamReport, ka: string, pct: number) {
  const entry = r.knowledgeAreaScores.find((k) => k.knowledgeArea === ka);
  return !!entry && entry.total >= 1 && entry.percent >= pct;
}

export function evaluateAchievements(
  report: ExamReport,
  existing: Achievement[],
): Achievement[] {
  const earnedIds = new Set(existing.map((a) => a.id));
  const newlyEarned: Achievement[] = [];
  for (const rule of RULES) {
    if (earnedIds.has(rule.id)) continue;
    if (rule.qualifies(report)) {
      newlyEarned.push({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        earnedAt: Date.now(),
      });
    }
  }
  return newlyEarned;
}

export function updateStreak(gam: Gamification): Gamification {
  const today = new Date().toISOString().slice(0, 10);
  if (gam.lastStudyDate === today) return gam;
  const dates = new Set(gam.studyDates);
  dates.add(today);
  const sorted = Array.from(dates).sort();
  // Count consecutive days ending today.
  let streak = 0;
  const cursor = new Date(today);
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (dates.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return {
    ...gam,
    streakDays: streak,
    lastStudyDate: today,
    studyDates: sorted,
  };
}

export const ALL_ACHIEVEMENT_RULES = RULES.map(({ id, name, description }) => ({
  id,
  name,
  description,
}));
