import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getCaseRef } from "./cases";
import {
  generateDecisions,
  generateDocuments,
  generateEmails,
  generateMeetings,
} from "./generator";
import { commitDecision } from "./engine";
import { scoreTailoring } from "./tailoring";
import type {
  Decision,
  DecisionOption,
  DeliveryApproach,
  SimState,
  TailoringAnswers,
} from "./types";
import { INITIAL_METRICS } from "./types";

function storageKey(caseId: string) {
  return `projectsim.v2.${caseId}`;
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
  };
}

function loadOrInit(caseId: string): SimState {
  if (typeof window === "undefined") return bootstrap(caseId);
  try {
    const raw = localStorage.getItem(storageKey(caseId));
    if (raw) {
      const parsed = JSON.parse(raw) as SimState;
      if (parsed && parsed.caseId === caseId) return parsed;
    }
  } catch {
    // fall through to fresh
  }
  return bootstrap(caseId);
}

type Ctx = {
  state: SimState;
  activeDecision: Decision | null;
  setActiveDecision: (id: string | null) => void;
  submitDecision: (option: DecisionOption) => void;
  submitTailoring: (answers: TailoringAnswers, approach: DeliveryApproach) => void;
  markEmailRead: (id: string) => void;
  reset: () => void;
};

const SimContext = createContext<Ctx | null>(null);

export function SimProvider({ caseId, children }: { caseId: string; children: ReactNode }) {
  const [state, setState] = useState<SimState>(() => bootstrap(caseId));

  // hydrate from localStorage on client mount only
  useEffect(() => {
    setState(loadOrInit(caseId));
  }, [caseId]);

  // persist
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(storageKey(caseId), JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state, caseId]);

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
        // if already logged, no-op
        if (s.log.some((l) => l.decisionId === dec.id)) return s;
        return commitDecision(s, dec, option);
      });
    },
    [],
  );

  const submitTailoring = useCallback(
    (answers: TailoringAnswers, approach: DeliveryApproach) => {
      setState((s) => {
        const c = getCaseRef(s.caseId);
        const score = scoreTailoring(answers, c.recommendedApproach);
        return {
          ...s,
          tailoring: answers,
          tailoringScore: score.percent,
          approach,
          phase: "Initiation",
          xp: s.xp + Math.round(score.percent / 4),
        };
      });
    },
    [],
  );

  const markEmailRead = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      emails: s.emails.map((e) => (e.id === id ? { ...e, read: true } : e)),
    }));
  }, []);

  const reset = useCallback(() => {
    setState(bootstrap(caseId));
    if (typeof window !== "undefined") localStorage.removeItem(storageKey(caseId));
  }, [caseId]);

  const value: Ctx = {
    state,
    activeDecision,
    setActiveDecision,
    submitDecision,
    submitTailoring,
    markEmailRead,
    reset,
  };

  return <SimContext.Provider value={value}>{children}</SimContext.Provider>;
}

export function useSim(): Ctx {
  const c = useContext(SimContext);
  if (!c) throw new Error("useSim must be used inside <SimProvider>");
  return c;
}
