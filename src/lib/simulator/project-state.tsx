import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  Choice,
  ConsequenceFlag,
  Decision,
  Impact,
  Metrics,
  PhaseId,
  Scenario,
} from "./types";
import {
  BUSINESS_CASE,
  PHASE_ORDER,
  PHASE_SCENARIOS,
  QUESTIONS_PER_PHASE,
  RANDOM_EVENTS,
  getScenarioMeta,
} from "./scenarios";

export const INITIAL_METRICS: Metrics = {
  budget: 100,
  schedule: 0,
  scope: 80,
  risk: 20,
  stakeholders: 70,
  morale: 75,
  quality: 75,
  businessValue: 70,
};

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

export function applyImpact(m: Metrics, impact: Impact): Metrics {
  return {
    budget: clamp((m.budget ?? 0) + (impact.budget ?? 0)),
    schedule: clamp((m.schedule ?? 0) + (impact.schedule ?? 0), -100, 100),
    scope: clamp((m.scope ?? 0) + (impact.scope ?? 0)),
    risk: clamp((m.risk ?? 0) + (impact.risk ?? 0)),
    stakeholders: clamp((m.stakeholders ?? 0) + (impact.stakeholders ?? 0)),
    morale: clamp((m.morale ?? 0) + (impact.morale ?? 0)),
    quality: clamp((m.quality ?? 0) + (impact.quality ?? 0)),
    businessValue: clamp(
      (m.businessValue ?? 0) + (impact.businessValue ?? 0),
    ),
  };
}

// Derive consequence flags from prior decisions. Used to surface follow-up
// context on later scenarios so the simulation feels like one continuous project.
export function computeConsequences(
  decisions: Decision[],
  metrics: Metrics,
): ConsequenceFlag[] {
  const flags = new Set<ConsequenceFlag>();
  for (const d of decisions) {
    const i = d.choiceImpact;
    if ((d.phase === "initiation" || d.phase === "planning") && (i.stakeholders ?? 0) < 0) {
      flags.add("neglected-stakeholders-early");
    }
    if (d.phase === "planning" && d.knowledgeArea === "Risk" && d.quality === "poor") {
      flags.add("skipped-risk-planning");
    }
    if ((i.scope ?? 0) <= -10) flags.add("scope-uncontrolled");
    if ((i.budget ?? 0) <= -10) flags.add("budget-overcommitted");
    if ((i.morale ?? 0) <= -10) flags.add("team-morale-hit");
    if ((i.quality ?? 0) < 0 && d.quality !== "excellent") flags.add("quality-shortcut");
    if ((i.businessValue ?? 0) < 0) flags.add("value-focus-lost");
  }
  // metric-derived reinforcement
  if (metrics.stakeholders < 55) flags.add("neglected-stakeholders-early");
  if (metrics.risk > 55) flags.add("skipped-risk-planning");
  if (metrics.scope < 55) flags.add("scope-uncontrolled");
  if (metrics.budget < 55) flags.add("budget-overcommitted");
  if (metrics.morale < 55) flags.add("team-morale-hit");
  if (metrics.quality < 55) flags.add("quality-shortcut");
  if (metrics.businessValue < 55) flags.add("value-focus-lost");
  return Array.from(flags);
}

const CONSEQUENCE_TEXT: Record<ConsequenceFlag, { keywords: RegExp; note: string }> = {
  "neglected-stakeholders-early": {
    keywords: /stakeholder|sponsor|client|communi/i,
    note: "Earlier in the project you deprioritized stakeholder engagement — expect that debt to surface here.",
  },
  "skipped-risk-planning": {
    keywords: /risk|issue|contingen|reserve/i,
    note: "Your risk register has been thin from Planning onward — you're now reacting rather than responding.",
  },
  "scope-uncontrolled": {
    keywords: /scope|change|require|deliverable/i,
    note: "Scope has drifted from earlier uncontrolled changes — this scenario is harder because of it.",
  },
  "budget-overcommitted": {
    keywords: /budget|cost|finance|spend|reserve/i,
    note: "Prior spending decisions have thinned your reserves — fewer options are affordable now.",
  },
  "team-morale-hit": {
    keywords: /team|morale|engineer|conflict|resign/i,
    note: "Team morale took a hit earlier — the team's capacity to absorb this is reduced.",
  },
  "quality-shortcut": {
    keywords: /quality|defect|test|qa|acceptance/i,
    note: "Quality shortcuts taken earlier are compounding — technical/process debt is now visible.",
  },
  "value-focus-lost": {
    keywords: /value|benefit|outcome|sponsor|business case/i,
    note: "The business-value thread has been weakening — sponsors are watching benefit realization closely.",
  },
};

export function consequenceNoteFor(
  scenario: Scenario,
  flags: ConsequenceFlag[],
): string | null {
  const text = `${scenario.title} ${scenario.body}`;
  for (const flag of flags) {
    const c = CONSEQUENCE_TEXT[flag];
    if (c.keywords.test(text)) return c.note;
  }
  return null;
}

function scenariosForPhase(p: PhaseId): Scenario[] {
  return PHASE_SCENARIOS.filter((s) => s.phase === p).slice(0, QUESTIONS_PER_PHASE);
}

// ---------- Context ----------

type ProjectStateValue = {
  metrics: Metrics;
  decisions: Decision[];
  xp: number;
  streak: number;
  phaseIdx: number;
  phaseStep: number;
  phase: PhaseId;
  current: Scenario;
  businessCaseDone: boolean;
  finished: boolean;
  pendingChoice: Choice | null;
  coachText: string | null;
  coachLoading: boolean;
  consequences: ConsequenceFlag[];
  consequenceNote: string | null;
  // actions
  choose: (choice: Choice, coach: (text: string | null) => Promise<string> | string) => Promise<void>;
  advance: () => void;
  restart: () => void;
  setCoach: (text: string | null, loading: boolean) => void;
};

const ProjectStateCtx = createContext<ProjectStateValue | null>(null);

export function useProjectState(): ProjectStateValue {
  const v = useContext(ProjectStateCtx);
  if (!v) throw new Error("useProjectState must be used inside ProjectStateProvider");
  return v;
}

export function ProjectStateProvider({ children }: { children: ReactNode }) {
  const [metrics, setMetrics] = useState<Metrics>(INITIAL_METRICS);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseStep, setPhaseStep] = useState(0);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [current, setCurrent] = useState<Scenario>(() => BUSINESS_CASE);
  const [businessCaseDone, setBusinessCaseDone] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<Choice | null>(null);
  const [coachText, setCoachText] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const eventsFired = useRef<Set<string>>(new Set());

  const phase: PhaseId = PHASE_ORDER[phaseIdx];
  const consequences = useMemo(
    () => computeConsequences(decisions, metrics),
    [decisions, metrics],
  );
  const consequenceNote = useMemo(
    () => consequenceNoteFor(current, consequences),
    [current, consequences],
  );

  const choose = useCallback<ProjectStateValue["choose"]>(
    async (choice, coach) => {
      if (pendingChoice) return;
      setPendingChoice(choice);
      setCoachText(null);
      setCoachLoading(true);

      const nextMetrics = applyImpact(metrics, choice.impact);
      setMetrics(nextMetrics);
      setXp((x) => x + choice.xp);
      setStreak((s) =>
        choice.quality === "excellent" || choice.quality === "good" ? s + 1 : 0,
      );

      const meta = getScenarioMeta(current);
      const correct = choice.id === meta.correctChoiceId;
      const decision: Decision = {
        scenarioId: current.id,
        scenarioTitle: current.title,
        phase: current.phase,
        processGroup: meta.processGroup,
        knowledgeArea: meta.knowledgeArea,
        choiceId: choice.id,
        choiceLabel: choice.label,
        choiceImpact: choice.impact,
        quality: choice.quality,
        correct,
        xp: choice.xp,
        coachText: null,
      };

      let text: string | null = null;
      try {
        const maybe = coach(null);
        text = typeof maybe === "string" ? maybe : await maybe;
      } catch {
        text = null;
      }
      setCoachText(text);
      setCoachLoading(false);
      setDecisions((prev) => [...prev, { ...decision, coachText: text }]);
    },
    [pendingChoice, metrics, current],
  );

  const advance = useCallback(() => {
    setPendingChoice(null);
    setCoachText(null);

    if (!businessCaseDone) {
      setBusinessCaseDone(true);
      setCurrent(scenariosForPhase("initiation")[0]);
      setPhaseIdx(0);
      setPhaseStep(0);
      return;
    }

    if (current.kind === "event") {
      const list = scenariosForPhase(phase);
      const next = list[phaseStep];
      if (next) {
        setCurrent(next);
        return;
      }
    }

    const eligible = RANDOM_EVENTS.filter(
      (e) =>
        !eventsFired.current.has(e.id) &&
        (e.phase === phase || (phase === "execution" && e.phase === "monitoring")),
    );
    if (
      (phase === "execution" || phase === "monitoring") &&
      eligible.length > 0 &&
      Math.random() < 0.5 &&
      current.kind !== "event" &&
      phaseStep < QUESTIONS_PER_PHASE
    ) {
      const ev = eligible[Math.floor(Math.random() * eligible.length)];
      eventsFired.current.add(ev.id);
      setCurrent(ev);
      return;
    }

    const nextStep = phaseStep + 1;
    if (nextStep < QUESTIONS_PER_PHASE) {
      const list = scenariosForPhase(phase);
      setPhaseStep(nextStep);
      setCurrent(list[nextStep]);
      return;
    }

    if (phaseIdx + 1 >= PHASE_ORDER.length) {
      setFinished(true);
      return;
    }
    const nextIdx = phaseIdx + 1;
    setPhaseIdx(nextIdx);
    setPhaseStep(0);
    setCurrent(scenariosForPhase(PHASE_ORDER[nextIdx])[0]);
  }, [businessCaseDone, current, phase, phaseIdx, phaseStep]);

  const restart = useCallback(() => {
    setMetrics(INITIAL_METRICS);
    setPhaseIdx(0);
    setPhaseStep(0);
    setDecisions([]);
    setXp(0);
    setStreak(0);
    setCurrent(BUSINESS_CASE);
    setBusinessCaseDone(false);
    setPendingChoice(null);
    setCoachText(null);
    setFinished(false);
    eventsFired.current = new Set();
  }, []);

  const setCoach = useCallback((text: string | null, loading: boolean) => {
    setCoachText(text);
    setCoachLoading(loading);
  }, []);

  const value: ProjectStateValue = {
    metrics,
    decisions,
    xp,
    streak,
    phaseIdx,
    phaseStep,
    phase,
    current,
    businessCaseDone,
    finished,
    pendingChoice,
    coachText,
    coachLoading,
    consequences,
    consequenceNote,
    choose,
    advance,
    restart,
    setCoach,
  };

  return (
    <ProjectStateCtx.Provider value={value}>{children}</ProjectStateCtx.Provider>
  );
}
