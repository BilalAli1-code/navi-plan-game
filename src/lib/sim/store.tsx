import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCaseRef } from "./cases";
import {
  generateDecisions,
  generateDocuments,
  generateEmails,
  generateMeetings,
} from "./generator";
import { commitDecision } from "./engine";
import { scoreTailoring } from "./tailoring";
import { loadRun, saveRun, saveDecision, setRunStatus } from "./sim.functions";
import {
  listDailyProgress,
  completeDayActivity,
  setCurrentDay as setCurrentDayFn,
  saveReflection as saveReflectionFn,
  getReflection as getReflectionFn,
  type DailyProgressRow,
} from "./daily.functions";
import { applyMasteryUpdates } from "./mastery.functions";
import { syncEvents, updateEventStatus } from "./events.functions";
import {
  decisionMasteryDelta,
  tailoringMasteryDelta,
  reflectionMasteryDelta,
  dayCompletionMasteryDelta,
} from "./mastery";
import type { EventInput } from "./events.functions";
import { getDay } from "./days";
import type { DayActivityKey } from "./days";
import { DAILY_MINUTES, REQUIRED_ACTIVITIES } from "./days";
import type {
  Decision,
  DecisionOption,
  DeliveryApproach,
  SimState,
  TailoringAnswers,
} from "./types";
import { INITIAL_METRICS } from "./types";

// localStorage is now a *fallback only* — used when the network is down or the
// learner is signed out. Supabase is the source of truth once a run is created.
function storageKey(caseId: string) {
  return `projectsim.v2.${caseId}`;
}
function importedKey(caseId: string) {
  return `projectsim.imported.${caseId}`;
}

function bootstrap(caseId: string): SimState {
  const c = getCaseRef(caseId);
  const decisions = generateDecisions(c);
  return {
    caseId,
    phase: "Tailoring",
    metrics: INITIAL_METRICS,
    tailoring: null,
    tailoringScore: null,
    approach: null,
    emails: generateEmails(c, decisions),
    meetings: generateMeetings(c, decisions),
    documents: generateDocuments(c),
    decisions,
    activeDecisionId: null,
    log: [],
    xp: 0,
    createdAt: Date.now(),
    lastConsequence: null,
    currentDay: 1,
    completedMinutes: 0,
  };
}

function readLocal(caseId: string): SimState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey(caseId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SimState;
    return parsed && parsed.caseId === caseId ? parsed : null;
  } catch {
    return null;
  }
}

function writeLocal(state: SimState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(state.caseId), JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

export type SaveStatus = "idle" | "saving" | "saved" | "error" | "offline";

type Ctx = {
  state: SimState;
  activeDecision: Decision | null;
  setActiveDecision: (id: string | null) => void;
  submitDecision: (option: DecisionOption) => void;
  submitTailoring: (answers: TailoringAnswers, approach: DeliveryApproach) => void;
  markEmailRead: (id: string) => void;
  reset: () => void;
  pause: () => void;
  saveStatus: SaveStatus;
  hydrating: boolean;
  // 7-day program
  runId: string | null;
  days: DailyProgressRow[];
  refreshDays: () => Promise<void>;
  completeActivity: (day: number, activity: DayActivityKey) => Promise<void>;
  goToDay: (day: number) => void;
  saveDayReflection: (
    day: number,
    payload: {
      whatWentWell?: string;
      whatWasChallenging?: string;
      whatWouldChange?: string;
      keyLearning?: string;
    },
  ) => Promise<void>;
  loadDayReflection: (day: number) => Promise<{
    what_went_well: string | null;
    what_was_challenging: string | null;
    what_would_change: string | null;
    key_learning: string | null;
  } | null>;
};

const SimContext = createContext<Ctx | null>(null);

export function SimProvider({ caseId, children }: { caseId: string; children: ReactNode }) {
  const [state, setState] = useState<SimState>(() => bootstrap(caseId));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [hydrating, setHydrating] = useState(true);
  const [runId, setRunId] = useState<string | null>(null);
  const [days, setDays] = useState<DailyProgressRow[]>([]);
  const runIdRef = useRef<string | null>(null);
  const pendingRef = useRef<SimState | null>(null);
  const savingRef = useRef(false);
  const lastDecisionKeyRef = useRef<string | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadRunFn = useServerFn(loadRun);
  const saveRunFn = useServerFn(saveRun);
  const saveDecisionFn = useServerFn(saveDecision);
  const setStatusFn = useServerFn(setRunStatus);
  const listDaysFn = useServerFn(listDailyProgress);
  const completeActivityFn = useServerFn(completeDayActivity);
  const setDayFn = useServerFn(setCurrentDayFn);
  const saveReflectionSrv = useServerFn(saveReflectionFn);
  const getReflectionSrv = useServerFn(getReflectionFn);
  const masteryFn = useServerFn(applyMasteryUpdates);
  const syncEventsFn = useServerFn(syncEvents);
  const updateEventStatusFn = useServerFn(updateEventStatus);

  const refreshDays = useCallback(
    async (rid: string) => {
      try {
        const res = await listDaysFn({ data: { runId: rid } });
        setDays(res.days);
        const done = res.days.filter((d) => d.status === "completed").length;
        // Derive completedMinutes from actual per-day totals.
        const minutes = res.days.reduce((sum, d) => sum + (d.completed_minutes ?? 0), 0);
        setState((s) =>
          s.completedMinutes === minutes ? s : { ...s, completedMinutes: minutes },
        );
        return { done, minutes };
      } catch {
        return null;
      }
    },
    [listDaysFn],
  );

  // Hydrate: try Supabase first, then localStorage as offline fallback, then bootstrap.
  // If Supabase is empty but a legacy localStorage snapshot exists, ask once whether
  // to import it — that becomes the initial cloud run.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setHydrating(true);
      try {
        const res = await loadRunFn({ data: { caseId } });
        if (cancelled) return;
        if (res.run?.snapshot) {
          runIdRef.current = res.run.id;
          setRunId(res.run.id);
          void refreshDays(res.run.id);
          setState(rehydrate(caseId, res.run.snapshot));
          setSaveStatus("saved");
          setHydrating(false);
          return;
        }
        // No cloud run yet — check for legacy localStorage progress.
        const local = readLocal(caseId);
        const alreadyImported =
          typeof window !== "undefined" && !!localStorage.getItem(importedKey(caseId));
        if (local && !alreadyImported && local.log.length > 0) {
          const wantImport = window.confirm(
            "We found simulation progress saved on this device that isn't in your account yet. Import it and continue in the cloud?",
          );
          if (typeof window !== "undefined") localStorage.setItem(importedKey(caseId), "1");
          if (wantImport) {
            const merged = rehydrate(caseId, local);
            setState(merged);
            pendingRef.current = merged; // will flush via the save effect below
            setHydrating(false);
            return;
          }
        }
        setState(bootstrap(caseId));
      } catch {
        // Supabase unreachable — fall back to local snapshot if any.
        const local = readLocal(caseId);
        setState(local ? rehydrate(caseId, local) : bootstrap(caseId));
        setSaveStatus("offline");
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  // Persist: on every state change, mirror to localStorage (always) and push to
  // Supabase (queued — coalesces rapid updates). One flight at a time.
  useEffect(() => {
    if (hydrating) return;
    writeLocal(state);
    pendingRef.current = state;
    void flush();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, hydrating]);

  const flush = useCallback(async () => {
    if (savingRef.current) return;
    const next = pendingRef.current;
    if (!next) return;
    pendingRef.current = null;
    savingRef.current = true;
    setSaveStatus("saving");
    try {
      const res = await saveRunFn({
        data: { runId: runIdRef.current, state: next },
      });
      const wasNew = runIdRef.current !== res.runId;
      runIdRef.current = res.runId;
      if (wasNew) {
        setRunId(res.runId);
        void refreshDays(res.runId);
        // First time we have a runId — publish generator content as events.
        void syncEventsFn({
          data: { runId: res.runId, events: eventsFromState(next) },
        }).catch(() => {});
      }
      setSaveStatus("saved");
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => {
        setSaveStatus((s) => (s === "saved" ? "idle" : s));
      }, 2000);
    } catch {
      setSaveStatus("offline");
      // Retry later — either on next state change, or after a short backoff.
      pendingRef.current = pendingRef.current ?? next;
      setTimeout(() => void flush(), 8000);
    } finally {
      savingRef.current = false;
      // If more state landed while we were saving, run again.
      if (pendingRef.current) void flush();
    }
  }, [saveRunFn]);

  const activeDecision = useMemo(
    () => state.decisions.find((d) => d.id === state.activeDecisionId) ?? null,
    [state.decisions, state.activeDecisionId],
  );

  const setActiveDecision = useCallback((id: string | null) => {
    setState((s) => ({ ...s, activeDecisionId: id }));
  }, []);

  const submitDecision = useCallback(
    (option: DecisionOption) => {
      setState((s) => {
        const dec = s.decisions.find((d) => d.id === s.activeDecisionId);
        if (!dec) return s;
        // Prevent duplicate submission: same decision id landing twice.
        if (s.log.some((l) => l.decisionId === dec.id)) return s;
        if (lastDecisionKeyRef.current === dec.id) return s;
        lastDecisionKeyRef.current = dec.id;
        const next = commitDecision(s, dec, option);
        const rid = runIdRef.current;
        if (rid) {
          // Persist the decision row.
          void saveDecisionFn({
            data: {
              runId: rid,
              decisionId: dec.id,
              phase: s.phase,
              selectedOptionId: option.id,
              selectedOptionText: option.label,
              metricImpacts: option.impact as Record<string, number>,
              mentorFeedback: {
                pmiPrinciple: option.pmiPrinciple,
                quality: option.quality,
                consequence: option.consequence,
              },
              eventId: dec.sourceId ?? null,
            },
          }).catch(() => {});
          // Update mastery via the shared service.
          void masteryFn({
            data: { updates: [decisionMasteryDelta(dec, option)] },
          }).catch(() => {});
          // Mark decision event as responded, and the source (email/meeting) too.
          void updateEventStatusFn({
            data: { runId: rid, eventKey: `decision:${dec.id}`, status: "responded" },
          }).catch(() => {});
          if (dec.source === "email") {
            void updateEventStatusFn({
              data: { runId: rid, eventKey: `email:${dec.id}`, status: "responded" },
            }).catch(() => {});
          } else if (dec.source === "meeting") {
            void updateEventStatusFn({
              data: { runId: rid, eventKey: `meeting:${dec.id}`, status: "responded" },
            }).catch(() => {});
          }
        }
        return next;
      });
    },
    [saveDecisionFn, masteryFn, updateEventStatusFn],
  );

  const submitTailoring = useCallback(
    (answers: TailoringAnswers, approach: DeliveryApproach) => {
      let percent = 0;
      setState((s) => {
        const c = getCaseRef(s.caseId);
        const score = scoreTailoring(answers, c.recommendedApproach);
        percent = score.percent;
        return {
          ...s,
          tailoring: answers,
          tailoringScore: score.percent,
          approach,
          phase: "Initiation",
          xp: s.xp + Math.round(score.percent / 4),
        };
      });
      // Mastery: record tailoring as a scored activity.
      void masteryFn({
        data: { updates: [tailoringMasteryDelta(percent)] },
      }).catch(() => {});
      const rid = runIdRef.current;
      if (rid) {
        void updateEventStatusFn({
          data: { runId: rid, eventKey: "activity:tailoring", status: "completed" },
        }).catch(() => {});
      }
    },
    [masteryFn, updateEventStatusFn],
  );

  const markEmailRead = useCallback(
    (id: string) => {
      setState((s) => ({
        ...s,
        emails: s.emails.map((e) => (e.id === id ? { ...e, read: true } : e)),
      }));
      const rid = runIdRef.current;
      if (rid) {
        // Email events use key `email:<decisionId>` (see eventsFromState).
        // Emails are keyed by their id; look up the unlocked decision id.
        const email = state.emails.find((e) => e.id === id);
        const key = email?.unlocksDecisionId
          ? `email:${email.unlocksDecisionId}`
          : `email:${id}`;
        void updateEventStatusFn({
          data: { runId: rid, eventKey: key, status: "viewed" },
        }).catch(() => {});
      }
    },
    [state.emails, updateEventStatusFn],
  );

  const reset = useCallback(() => {
    const fresh = bootstrap(caseId);
    setState(fresh);
    lastDecisionKeyRef.current = null;
    runIdRef.current = null; // saveRun will create a new run row
    setRunId(null);
    setDays([]);
    if (typeof window !== "undefined") localStorage.removeItem(storageKey(caseId));
  }, [caseId]);

  const pause = useCallback(() => {
    if (!runIdRef.current) return;
    void setStatusFn({ data: { runId: runIdRef.current, status: "paused" } }).catch(() => {});
  }, [setStatusFn]);

  const completeActivity = useCallback(
    async (day: number, activity: DayActivityKey) => {
      const rid = runIdRef.current;
      if (!rid) return;
      // Optimistic UI: bump completion locally, then reconcile from server.
      setDays((ds) =>
        ds.map((d) => {
          if (d.day_number !== day) return d;
          const flags: Record<DayActivityKey, boolean> = {
            briefing: d.briefing_completed,
            learning: d.learning_completed,
            workplace: d.workplace_activities_completed,
            decisions: d.decisions_completed,
            practice: d.practice_completed,
            reflection: d.reflection_completed,
          };
          if (flags[activity]) return d;
          flags[activity] = true;
          const completed = REQUIRED_ACTIVITIES.filter((a) => flags[a]).length;
          const allDone = completed === REQUIRED_ACTIVITIES.length;
          return {
            ...d,
            briefing_completed: flags.briefing,
            learning_completed: flags.learning,
            workplace_activities_completed: flags.workplace,
            decisions_completed: flags.decisions,
            practice_completed: flags.practice,
            reflection_completed: flags.reflection,
            completion_percentage: Math.round((completed / REQUIRED_ACTIVITIES.length) * 100),
            completed_minutes: Math.round((completed / REQUIRED_ACTIVITIES.length) * DAILY_MINUTES),
            status: allDone ? "completed" : "in_progress",
          };
        }),
      );
      try {
        await completeActivityFn({ data: { runId: rid, dayNumber: day, activity } });
      } catch {
        /* offline; day snapshot save will still capture progress */
      } finally {
        void refreshDays(rid);
      }
    },
    [completeActivityFn, refreshDays],
  );

  const goToDay = useCallback(
    (day: number) => {
      setState((s) => ({ ...s, currentDay: day }));
      const rid = runIdRef.current;
      if (rid) void setDayFn({ data: { runId: rid, dayNumber: day } }).catch(() => {});
    },
    [setDayFn],
  );

  const saveDayReflection = useCallback(
    async (
      day: number,
      payload: {
        whatWentWell?: string;
        whatWasChallenging?: string;
        whatWouldChange?: string;
        keyLearning?: string;
      },
    ) => {
      const rid = runIdRef.current;
      if (!rid) return;
      await saveReflectionSrv({ data: { runId: rid, dayNumber: day, ...payload } });
      await completeActivity(day, "reflection");
    },
    [saveReflectionSrv, completeActivity],
  );

  const loadDayReflection = useCallback(
    async (day: number) => {
      const rid = runIdRef.current;
      if (!rid) return null;
      try {
        const res = await getReflectionSrv({ data: { runId: rid, dayNumber: day } });
        return (res.reflection as {
          what_went_well: string | null;
          what_was_challenging: string | null;
          what_would_change: string | null;
          key_learning: string | null;
        } | null);
      } catch {
        return null;
      }
    },
    [getReflectionSrv],
  );

  const value: Ctx = {
    state,
    activeDecision,
    setActiveDecision,
    submitDecision,
    submitTailoring,
    markEmailRead,
    reset,
    pause,
    saveStatus,
    hydrating,
    runId,
    days,
    refreshDays: async () => {
      const rid = runIdRef.current;
      if (rid) await refreshDays(rid);
    },
    completeActivity,
    goToDay,
    saveDayReflection,
    loadDayReflection,
  };

  return <SimContext.Provider value={value}>{children}</SimContext.Provider>;
}

// Rebuild transient content (emails/meetings/documents/decisions) around any
// persisted snapshot. The decision log + metrics + tailoring are authoritative;
// generated collateral (which references stakeholder data etc.) is regenerated
// from the case so that pushing new case content doesn't wedge old snapshots.
function rehydrate(caseId: string, snapshot: SimState): SimState {
  const fresh = bootstrap(caseId);
  return {
    ...fresh,
    phase: snapshot.phase ?? fresh.phase,
    metrics: { ...fresh.metrics, ...(snapshot.metrics ?? {}) },
    tailoring: snapshot.tailoring ?? null,
    tailoringScore: snapshot.tailoringScore ?? null,
    approach: snapshot.approach ?? null,
    log: Array.isArray(snapshot.log) ? snapshot.log : [],
    xp: snapshot.xp ?? 0,
    lastConsequence: snapshot.lastConsequence ?? null,
    currentDay: snapshot.currentDay ?? 1,
    completedMinutes: snapshot.completedMinutes ?? 0,
    createdAt: snapshot.createdAt ?? fresh.createdAt,
    // mark emails that unlock decisions the learner already answered as read
    emails: fresh.emails.map((e) => {
      const done =
        e.unlocksDecisionId &&
        (snapshot.log ?? []).some((l) => l.decisionId === e.unlocksDecisionId);
      return done ? { ...e, read: true } : e;
    }),
  };
}

export function useSim(): Ctx {
  const c = useContext(SimContext);
  if (!c) throw new Error("useSim must be used inside <SimProvider>");
  return c;
}
