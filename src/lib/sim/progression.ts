import { canAdvanceChapter } from "./chapter-contract";
import { DAILY_MINUTES, DAY_PLAN, REQUIRED_ACTIVITIES, TOTAL_DAYS, type DayActivityKey } from "./days";
import { SIM_PHASE_ORDER, type ChapterActivityState, type ChapterProgressState, type SimPhase, type SimState } from "./types";

/**
 * Canonical mapping from LearnerAction kind → chapter activity flag.
 *
 * Single source of truth for the write-side progression contract: every UI
 * surface (Inbox, Meetings, Chat, Decisions, Practice, Learning, Briefing,
 * Reflection) MUST route completion through `dispatchLearnerAction` with one
 * of these kinds so the correct flag is set on `chapterProgress.activities`.
 *
 * `null` means the action does not by itself complete an activity — either
 * because the activity is passed explicitly (`activity.complete`) or because
 * the action is orthogonal to Day completion (`day.goTo`, `tailoring.submit`,
 * `engine.action`).
 */
export type LearnerActionKind =
  | "decision.submit"
  | "email.read"
  | "meeting.open"
  | "chat.send"
  | "tab.open.learning"
  | "briefing.acknowledge"
  | "practice.complete"
  | "reflection.save"
  | "activity.complete"
  | "day.goTo"
  | "tailoring.submit"
  | "engine.action";

export function activityForActionKind(kind: LearnerActionKind): DayActivityKey | null {
  switch (kind) {
    case "decision.submit":
      return "decisions";
    case "email.read":
    case "meeting.open":
    case "chat.send":
      return "workplace";
    case "tab.open.learning":
      return "learning";
    case "briefing.acknowledge":
      return "briefing";
    case "practice.complete":
      return "practice";
    case "reflection.save":
      return "reflection";
    default:
      return null;
  }
}

export type ChapterProjection = {
  dayNumber: number;
  title: string;
  phase: SimPhase;
  status: "locked" | "available" | "active" | "completed";
  isCurrent: boolean;
  activities: ChapterActivityState;
  completionPercentage: number;
  completedMinutes: number;
  allActivitiesDone: boolean;
  canAdvance: boolean;
  advanceBlockers: string[];
  startedAt: string | null;
  completedAt: string | null;
};

export type ProgressionSnapshot = {
  chapters: ChapterProjection[];
  currentDay: ChapterProjection;
  totalCompletedMinutes: number;
  overallPct: number;
  daysDone: number;
  phase: {
    current: SimPhase;
    currentIndex: number;
    totalPhases: number;
    progressPct: number;
  };
};

export type LegacyDailyProgressSource = {
  day_number: number;
  briefing_completed: boolean;
  learning_completed: boolean;
  workplace_activities_completed: boolean;
  decisions_completed: boolean;
  practice_completed: boolean;
  reflection_completed: boolean;
  started_at: string | null;
  completed_at: string | null;
};

const EMPTY_ACTIVITIES: ChapterActivityState = {
  briefing: false,
  learning: false,
  workplace: false,
  decisions: false,
  practice: false,
  reflection: false,
};

function cloneActivities(activities?: Partial<ChapterActivityState> | null): ChapterActivityState {
  return {
    briefing: !!activities?.briefing,
    learning: !!activities?.learning,
    workplace: !!activities?.workplace,
    decisions: !!activities?.decisions,
    practice: !!activities?.practice,
    reflection: !!activities?.reflection,
  };
}

export function createInitialChapterProgress(): Record<number, ChapterProgressState> {
  return Object.fromEntries(
    DAY_PLAN.map((day) => [
      day.day,
      {
        activities: { ...EMPTY_ACTIVITIES },
        startedAt: null,
        completedAt: null,
      },
    ]),
  ) as Record<number, ChapterProgressState>;
}

export function normalizeChapterProgress(
  progress?: Record<number, ChapterProgressState>,
): Record<number, ChapterProgressState> {
  const initial = createInitialChapterProgress();
  if (!progress) return initial;
  for (const day of DAY_PLAN) {
    const existing = progress[day.day];
    if (!existing) continue;
    initial[day.day] = {
      activities: cloneActivities(existing.activities),
      startedAt: existing.startedAt ?? null,
      completedAt: existing.completedAt ?? null,
    };
  }
  return initial;
}

export function migrateChapterProgress(
  progress: Record<number, ChapterProgressState> | undefined,
  rows: LegacyDailyProgressSource[] = [],
): Record<number, ChapterProgressState> {
  if (progress) return normalizeChapterProgress(progress);
  const initial = createInitialChapterProgress();
  for (const row of rows) {
    initial[row.day_number] = {
      activities: {
        briefing: row.briefing_completed,
        learning: row.learning_completed,
        workplace: row.workplace_activities_completed,
        decisions: row.decisions_completed,
        practice: row.practice_completed,
        reflection: row.reflection_completed,
      },
      startedAt: row.started_at,
      completedAt: row.completed_at,
    };
  }
  return initial;
}

export function buildProgressionSnapshot(state: SimState): ProgressionSnapshot {
  const chapterProgress = normalizeChapterProgress(state.chapterProgress);
  const decisionIdsLogged = new Set((state.log ?? []).map((entry) => entry.decisionId));
  const documentKindsPresent = new Set((state.documents ?? []).map((doc) => doc.kind));

  const rawChapters = DAY_PLAN.map((day) => {
    const stored = chapterProgress[day.day];
    const activities = cloneActivities(stored.activities);
    const completedCount = REQUIRED_ACTIVITIES.filter((activity) => activities[activity]).length;
    const completionPercentage = Math.round((completedCount / REQUIRED_ACTIVITIES.length) * 100);
    const completedMinutes = Math.round((completedCount / REQUIRED_ACTIVITIES.length) * DAILY_MINUTES);
    const advance = canAdvanceChapter(day, {
      chapter: day.day,
      activityFlags: activities,
      decisionIdsLogged,
      documentKindsPresent,
    });
    const allActivitiesDone = completedCount === REQUIRED_ACTIVITIES.length;
    const isCompleted = allActivitiesDone && advance.canAdvance;

    return {
      dayNumber: day.day,
      title: day.title,
      phase: day.phase,
      activities,
      completionPercentage,
      completedMinutes,
      allActivitiesDone,
      canAdvance: advance.canAdvance,
      advanceBlockers: advance.canAdvance ? [] : advance.reasons,
      startedAt: stored.startedAt,
      completedAt: isCompleted ? stored.completedAt : null,
      isCompleted,
    };
  });

  const firstOpenDay = rawChapters.find((chapter) => !chapter.isCompleted)?.dayNumber ?? TOTAL_DAYS;
  const currentDay = Math.max(1, Math.min(TOTAL_DAYS, state.currentDay ?? 1));
  const chapters: ChapterProjection[] = rawChapters.map((chapter) => {
    let status: ChapterProjection["status"];
    if (chapter.isCompleted) status = "completed";
    else if (chapter.dayNumber === firstOpenDay) status = chapter.dayNumber === currentDay ? "active" : "available";
    else status = chapter.dayNumber < firstOpenDay ? "completed" : "locked";

    return {
      dayNumber: chapter.dayNumber,
      title: chapter.title,
      phase: chapter.phase,
      status,
      isCurrent: chapter.dayNumber === currentDay,
      activities: chapter.activities,
      completionPercentage: chapter.completionPercentage,
      completedMinutes: chapter.completedMinutes,
      allActivitiesDone: chapter.allActivitiesDone,
      canAdvance: chapter.canAdvance,
      advanceBlockers: chapter.advanceBlockers,
      startedAt: chapter.startedAt,
      completedAt: chapter.completedAt,
    };
  });

  const selectedDay = chapters.find((chapter) => chapter.dayNumber === currentDay) ?? chapters[0];
  const totalCompletedMinutes = chapters.reduce((sum, chapter) => sum + chapter.completedMinutes, 0);
  const overallPct = Math.round((totalCompletedMinutes / (TOTAL_DAYS * DAILY_MINUTES)) * 100);
  const daysDone = chapters.filter((chapter) => chapter.status === "completed").length;
  const phaseOrder = SIM_PHASE_ORDER.filter((phase) => phase !== "Complete");
  const phaseIndex = Math.max(0, phaseOrder.indexOf(state.phase === "Complete" ? "Closing" : state.phase));

  return {
    chapters,
    currentDay: selectedDay,
    totalCompletedMinutes,
    overallPct,
    daysDone,
    phase: {
      current: state.phase,
      currentIndex: phaseIndex,
      totalPhases: phaseOrder.length,
      progressPct:
        phaseOrder.length > 1 ? Math.round((phaseIndex / (phaseOrder.length - 1)) * 100) : 0,
    },
  };
}

export function applyActivityCompletion(
  state: SimState,
  dayNumber: number,
  activity: DayActivityKey,
  now = new Date().toISOString(),
): SimState {
  const chapterProgress = normalizeChapterProgress(state.chapterProgress);
  const current = chapterProgress[dayNumber];
  if (!current) return state;
  if (current.activities[activity]) {
    const snapshot = buildProgressionSnapshot({ ...state, chapterProgress });
    return {
      ...state,
      chapterProgress,
      completedMinutes: snapshot.totalCompletedMinutes,
    };
  }

  const nextChapterProgress = {
    ...chapterProgress,
    [dayNumber]: {
      ...current,
      activities: {
        ...current.activities,
        [activity]: true,
      },
      startedAt: current.startedAt ?? now,
    },
  };

  let nextState: SimState = { ...state, chapterProgress: nextChapterProgress };
  let snapshot = buildProgressionSnapshot(nextState);
  const nextDay = snapshot.chapters.find((chapter) => chapter.dayNumber === dayNumber);
  if (!nextDay) return state;

  nextChapterProgress[dayNumber] = {
    ...nextChapterProgress[dayNumber],
    completedAt:
      nextDay.status === "completed"
        ? nextChapterProgress[dayNumber].completedAt ?? now
        : null,
  };

  if (nextDay.status === "completed" && state.currentDay === dayNumber) {
    const nextOpen = snapshot.chapters.find(
      (chapter) => chapter.dayNumber > dayNumber && chapter.status !== "locked",
    );
    if (nextOpen) nextState = { ...nextState, currentDay: nextOpen.dayNumber };
  }

  snapshot = buildProgressionSnapshot({ ...nextState, chapterProgress: nextChapterProgress });
  return {
    ...nextState,
    chapterProgress: nextChapterProgress,
    completedMinutes: snapshot.totalCompletedMinutes,
  };
}
