import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ExamAnswer,
  ExamReport,
  ExamSession,
  Gamification,
} from "./types";
import { composeExam, type ExamComposition } from "./question-service";
import { buildReport } from "./scoring";
import { evaluateAchievements, updateStreak, xpForReport } from "./gamification";

const SESSION_KEY = "pmp_exam_session_v1";
const HISTORY_KEY = "pmp_exam_history_v1";
const GAM_KEY = "pmp_gamification_v1";

const DEFAULT_GAM: Gamification = {
  xp: 0,
  achievements: [],
  streakDays: 0,
  lastStudyDate: null,
  studyDates: [],
};

interface ExamContextValue {
  session: ExamSession | null;
  history: ExamReport[];
  gamification: Gamification;
  startExam: (composition: ExamComposition, mode?: ExamSession["mode"]) => ExamSession;
  resumeExam: () => void;
  answerQuestion: (
    questionId: string,
    selectedOptionId: string | null,
    confidence?: ExamAnswer["confidence"],
  ) => void;
  toggleMark: (questionId: string) => void;
  goToIndex: (index: number) => void;
  startBreak: () => void;
  endBreak: () => void;
  submitExam: () => ExamReport | null;
  abandonExam: () => void;
  clearHistory: () => void;
}

const ExamContext = createContext<ExamContextValue | null>(null);

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function ExamStateProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ExamSession | null>(null);
  const [history, setHistory] = useState<ExamReport[]>([]);
  const [gamification, setGamification] = useState<Gamification>(DEFAULT_GAM);
  const questionEnterAt = useRef<number>(Date.now());

  // Hydrate from storage on mount (client only to avoid SSR mismatch).
  useEffect(() => {
    setSession(readJson<ExamSession | null>(SESSION_KEY, null));
    setHistory(readJson<ExamReport[]>(HISTORY_KEY, []));
    setGamification(readJson<Gamification>(GAM_KEY, DEFAULT_GAM));
  }, []);

  // Persist session as it changes.
  useEffect(() => {
    if (session) writeJson(SESSION_KEY, session);
    else if (typeof window !== "undefined")
      window.localStorage.removeItem(SESSION_KEY);
  }, [session]);
  useEffect(() => writeJson(HISTORY_KEY, history), [history]);
  useEffect(() => writeJson(GAM_KEY, gamification), [gamification]);

  // Timer tick — 1s. Only ticks while status is in_progress.
  useEffect(() => {
    if (!session || session.status !== "in_progress") return;
    const interval = setInterval(() => {
      setSession((prev) => {
        if (!prev || prev.status !== "in_progress") return prev;
        const now = Date.now();
        const delta = now - prev.lastTickAt;
        const remaining = Math.max(0, prev.remainingMs - delta);
        return { ...prev, remainingMs: remaining, lastTickAt: now };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [session?.status, session?.id]);

  const startExam = useCallback(
    (composition: ExamComposition, mode: ExamSession["mode"] = "full") => {
      const questions = composeExam(composition);
      const minutes = mode === "full" ? 230 : mode === "mini" ? 30 : 60;
      const now = Date.now();
      const newSession: ExamSession = {
        id: crypto.randomUUID(),
        startedAt: now,
        durationMs: minutes * 60_000,
        remainingMs: minutes * 60_000,
        questionIds: questions.map((q) => q.id),
        answers: {},
        currentIndex: 0,
        status: "in_progress",
        breakCount: 0,
        totalBreakMs: 0,
        lastTickAt: now,
        mode,
      };
      questionEnterAt.current = now;
      setSession(newSession);
      return newSession;
    },
    [],
  );

  const resumeExam = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      // Do not credit time elapsed while the app was closed.
      return { ...prev, status: "in_progress", lastTickAt: Date.now() };
    });
    questionEnterAt.current = Date.now();
  }, []);

  const recordTime = () => {
    const now = Date.now();
    const spent = now - questionEnterAt.current;
    questionEnterAt.current = now;
    return spent;
  };

  const answerQuestion = useCallback<ExamContextValue["answerQuestion"]>(
    (questionId, selectedOptionId, confidence) => {
      const spent = recordTime();
      setSession((prev) => {
        if (!prev) return prev;
        const existing = prev.answers[questionId];
        const answer: ExamAnswer = {
          questionId,
          selectedOptionId,
          markedForReview: existing?.markedForReview ?? false,
          timeSpentMs: (existing?.timeSpentMs ?? 0) + spent,
          confidence: confidence ?? existing?.confidence,
        };
        return {
          ...prev,
          answers: { ...prev.answers, [questionId]: answer },
        };
      });
    },
    [],
  );

  const toggleMark = useCallback((questionId: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      const existing = prev.answers[questionId];
      const answer: ExamAnswer = existing
        ? { ...existing, markedForReview: !existing.markedForReview }
        : {
            questionId,
            selectedOptionId: null,
            markedForReview: true,
            timeSpentMs: 0,
          };
      return { ...prev, answers: { ...prev.answers, [questionId]: answer } };
    });
  }, []);

  const goToIndex = useCallback((index: number) => {
    setSession((prev) => {
      if (!prev) return prev;
      const spent = Date.now() - questionEnterAt.current;
      questionEnterAt.current = Date.now();
      const currentId = prev.questionIds[prev.currentIndex];
      const existing = prev.answers[currentId];
      const nextAnswers = existing
        ? {
            ...prev.answers,
            [currentId]: {
              ...existing,
              timeSpentMs: existing.timeSpentMs + spent,
            },
          }
        : prev.answers;
      const bounded = Math.max(0, Math.min(prev.questionIds.length - 1, index));
      return { ...prev, currentIndex: bounded, answers: nextAnswers };
    });
  }, []);

  const startBreak = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      return { ...prev, status: "on_break", breakCount: prev.breakCount + 1 };
    });
  }, []);

  const endBreak = useCallback(() => {
    setSession((prev) => {
      if (!prev) return prev;
      return { ...prev, status: "in_progress", lastTickAt: Date.now() };
    });
    questionEnterAt.current = Date.now();
  }, []);

  const submitExam = useCallback<ExamContextValue["submitExam"]>(() => {
    let report: ExamReport | null = null;
    setSession((prev) => {
      if (!prev) return prev;
      report = buildReport({ ...prev, status: "submitted" });
      return null;
    });
    if (report) {
      const finalized = report;
      setHistory((prev) => [finalized, ...prev].slice(0, 50));
      setGamification((prev) => {
        const withStreak = updateStreak(prev);
        const newlyEarned = evaluateAchievements(
          finalized,
          withStreak.achievements,
        );
        return {
          ...withStreak,
          xp: withStreak.xp + xpForReport(finalized),
          achievements: [...withStreak.achievements, ...newlyEarned],
        };
      });
    }
    return report;
  }, []);

  const abandonExam = useCallback(() => setSession(null), []);
  const clearHistory = useCallback(() => setHistory([]), []);

  const value = useMemo<ExamContextValue>(
    () => ({
      session,
      history,
      gamification,
      startExam,
      resumeExam,
      answerQuestion,
      toggleMark,
      goToIndex,
      startBreak,
      endBreak,
      submitExam,
      abandonExam,
      clearHistory,
    }),
    [
      session,
      history,
      gamification,
      startExam,
      resumeExam,
      answerQuestion,
      toggleMark,
      goToIndex,
      startBreak,
      endBreak,
      submitExam,
      abandonExam,
      clearHistory,
    ],
  );

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
}

export function useExamState() {
  const ctx = useContext(ExamContext);
  if (!ctx) throw new Error("useExamState must be used within ExamStateProvider");
  return ctx;
}

export function formatDuration(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts = [
    h > 0 ? String(h).padStart(2, "0") : null,
    String(m).padStart(2, "0"),
    String(s).padStart(2, "0"),
  ].filter(Boolean);
  return parts.join(":");
}
