// Progression write-side mapping tests.
//
// Locks in the canonical mapping from LearnerAction kind → chapter activity
// flag and verifies that completing every required Day 1 action produces
// 100% progress, marks the chapter completed, and advances the current day.
//
// Every UI surface (Inbox, Meetings, Team/Stakeholder Chat, Decisions,
// Practice, Learning, Briefing, Reflection) MUST route completion through
// `dispatchLearnerAction` with one of these kinds; this test suite is the
// executable contract for that mapping.

import { describe, it, expect } from "vitest";
import {
  activityForActionKind,
  applyActivityCompletion,
  buildProgressionSnapshot,
  createInitialChapterProgress,
  type LearnerActionKind,
} from "../progression";
import { REQUIRED_ACTIVITIES, type DayActivityKey } from "../days";
import { INITIAL_METRICS, type SimState } from "../types";

function baseState(): SimState {
  return {
    caseId: "customer-portal",
    phase: "Initiation",
    metrics: INITIAL_METRICS,
    tailoring: null,
    tailoringScore: null,
    approach: "Predictive",
    emails: [],
    meetings: [],
    documents: [],
    decisions: [],
    activeDecisionId: null,
    log: [],
    xp: 0,
    createdAt: Date.now(),
    lastConsequence: null,
    currentDay: 1,
    completedMinutes: 0,
    chapterProgress: createInitialChapterProgress(),
  };
}

describe("activityForActionKind — canonical action→flag mapping", () => {
  const cases: Array<[LearnerActionKind, DayActivityKey | null]> = [
    ["decision.submit", "decisions"],
    ["email.read", "workplace"],
    ["meeting.open", "workplace"],
    ["chat.send", "workplace"],
    ["tab.open.learning", "learning"],
    ["briefing.acknowledge", "briefing"],
    ["practice.complete", "practice"],
    ["reflection.save", "reflection"],
    // Orthogonal / payload-carried:
    ["activity.complete", null],
    ["day.goTo", null],
    ["tailoring.submit", null],
    ["engine.action", null],
  ];

  it.each(cases)("maps %s → %s", (kind, expected) => {
    expect(activityForActionKind(kind)).toBe(expected);
  });

  it("informational email reads never map to the decisions flag", () => {
    // Guards Blueprint invariant: only decision.submit may flip `decisions`.
    expect(activityForActionKind("email.read")).not.toBe("decisions");
  });
});

describe("applyActivityCompletion — flag writes", () => {
  it.each(REQUIRED_ACTIVITIES)("sets %s flag on chapter 1", (activity) => {
    const next = applyActivityCompletion(baseState(), 1, activity);
    expect(next.chapterProgress?.[1]?.activities[activity]).toBe(true);
  });

  it("is idempotent — replaying the same activity keeps the flag true", () => {
    const once = applyActivityCompletion(baseState(), 1, "decisions");
    const twice = applyActivityCompletion(once, 1, "decisions");
    expect(twice.chapterProgress?.[1]?.activities.decisions).toBe(true);
  });

  it("touching only one activity keeps completion at 1/6 (~17%)", () => {
    const next = applyActivityCompletion(baseState(), 1, "briefing");
    const snap = buildProgressionSnapshot(next);
    const day1 = snap.chapters.find((c) => c.dayNumber === 1)!;
    expect(day1.completionPercentage).toBe(17);
    expect(day1.status).toBe("active");
  });
});

describe("Day 1 end-to-end completion", () => {
  // Day 1's ChapterAdvanceRule additionally requires Charter + Stakeholder
  // Register outputs (Blueprint §7.2). Seed them so the write-side test
  // exercises the full contract and not just activity flags.
  function withDay1Outputs(state: SimState): SimState {
    return {
      ...state,
      documents: [
        { id: "d1", title: "Project Charter", kind: "Charter" as SimState["documents"][number]["kind"], contentMd: "", createdAt: Date.now() },
        { id: "d2", title: "Stakeholder Register", kind: "Stakeholder Register" as SimState["documents"][number]["kind"], contentMd: "", createdAt: Date.now() },
      ],
    };
  }

  it("completing every required Day 1 action yields 100% and completes the chapter", () => {
    let state = withDay1Outputs(baseState());
    for (const a of REQUIRED_ACTIVITIES) {
      state = applyActivityCompletion(state, 1, a);
    }
    const snap = buildProgressionSnapshot(state);
    const day1 = snap.chapters.find((c) => c.dayNumber === 1)!;

    expect(day1.completionPercentage).toBe(100);
    expect(day1.allActivitiesDone).toBe(true);
    expect(day1.canAdvance).toBe(true);
    expect(day1.status).toBe("completed");
  });

  it("advances currentDay to the next open chapter once Day 1 finishes", () => {
    let state = withDay1Outputs(baseState());
    for (const a of REQUIRED_ACTIVITIES) {
      state = applyActivityCompletion(state, 1, a);
    }
    expect(state.currentDay).toBe(2);
  });

  it("rehydrating from the same chapterProgress preserves 100% completion", () => {
    let state = withDay1Outputs(baseState());
    for (const a of REQUIRED_ACTIVITIES) {
      state = applyActivityCompletion(state, 1, a);
    }
    const rehydrated: SimState = {
      ...withDay1Outputs(baseState()),
      chapterProgress: state.chapterProgress,
      currentDay: state.currentDay,
    };
    const snap = buildProgressionSnapshot(rehydrated);
    const day1 = snap.chapters.find((c) => c.dayNumber === 1)!;
    expect(day1.completionPercentage).toBe(100);
    expect(day1.status).toBe("completed");
  });
});
