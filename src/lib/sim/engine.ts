// Pure reducer: applies a decision → new metrics + phase progression.

import type {
  Decision,
  DecisionLogEntry,
  DecisionOption,
  MetricImpact,
  ProjectMetrics,
  SimPhase,
  SimState,
} from "./types";
import { SIM_PHASE_ORDER } from "./types";

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function applyImpact(m: ProjectMetrics, impact: MetricImpact): ProjectMetrics {
  const next: ProjectMetrics = {
    ...m,
    budget: clamp(m.budget + (impact.budget ?? 0)),
    schedule: clamp(m.schedule + (impact.schedule ?? 0)),
    risk: clamp(m.risk + (impact.risk ?? 0)),
    morale: clamp(m.morale + (impact.morale ?? 0)),
    trust: clamp(m.trust + (impact.trust ?? 0)),
    quality: clamp(m.quality + (impact.quality ?? 0)),
    satisfaction: clamp(m.satisfaction + (impact.satisfaction ?? 0)),
  };
  next.health = Math.round(
    (next.budget + next.schedule + next.risk + next.morale + next.trust + next.quality + next.satisfaction) / 7,
  );
  return next;
}

export function nextPhaseAfter(current: SimPhase): SimPhase {
  const idx = SIM_PHASE_ORDER.indexOf(current);
  if (idx < 0 || idx >= SIM_PHASE_ORDER.length - 1) return "Complete";
  return SIM_PHASE_ORDER[idx + 1];
}

// Count decisions made per phase; when all in a phase are complete, advance.
export function shouldAdvancePhase(state: SimState): boolean {
  const inPhase = state.decisions.filter((d) => d.phase === state.phase);
  const done = state.log.filter((l) => l.atPhase === state.phase);
  return inPhase.length > 0 && done.length >= inPhase.length;
}

export function commitDecision(
  state: SimState,
  decision: Decision,
  option: DecisionOption,
): SimState {
  const metrics = applyImpact(state.metrics, option.impact);
  const entry: DecisionLogEntry = {
    decisionId: decision.id,
    optionId: option.id,
    quality: option.quality,
    correct: option.id === decision.correctOptionId,
    atPhase: state.phase,
    impact: option.impact,
    timestamp: Date.now(),
  };
  const xpDelta =
    option.quality === "excellent"
      ? 25
      : option.quality === "good"
        ? 15
        : option.quality === "risky"
          ? 5
          : 0;
  const nextState: SimState = {
    ...state,
    metrics,
    log: [...state.log, entry],
    xp: state.xp + xpDelta,
    activeDecisionId: decision.id,
    lastConsequence: option.consequence,
    emails: state.emails.map((e) =>
      e.unlocksDecisionId === decision.id ? { ...e, read: true } : e,
    ),
  };
  if (shouldAdvancePhase(nextState)) {
    return { ...nextState, phase: nextPhaseAfter(nextState.phase) };
  }
  return nextState;
}
