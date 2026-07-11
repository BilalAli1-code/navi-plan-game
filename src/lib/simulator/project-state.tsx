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
  PerfScores,
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
import {
  applyPerfImpact,
  initialPerfScores,
  knowledgeAreasFor,
  perfImpactFor,
  weakestCategories,
} from "./performance";
import { DEFAULT_INDUSTRY_ID, getIndustry, type IndustryCase } from "./industries";

// Overlay an industry-specific business case onto the shared BUSINESS_CASE
// template so the same choice engine plays across industries.
function businessCaseFor(industry: IndustryCase): Scenario {
  return {
    ...BUSINESS_CASE,
    title: `Approve the Business Case — ${industry.projectName}`,
    body: industry.body,
  };
}

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

// Adaptive: reorder a phase's remaining scenarios so ones matching the
// learner's weakest perf categories come first.
function adaptivePhaseOrder(
  phaseScenarios: Scenario[],
  perf: PerfScores,
): Scenario[] {
  const weak = new Set<string>();
  for (const cat of weakestCategories(perf, 3)) {
    for (const ka of knowledgeAreasFor(cat)) weak.add(ka);
  }
  return [...phaseScenarios].sort((a, b) => {
    const aWeak = weak.has(getScenarioMeta(a).knowledgeArea) ? 0 : 1;
    const bWeak = weak.has(getScenarioMeta(b).knowledgeArea) ? 0 : 1;
    return aWeak - bWeak;
  });
}

function pickAdaptiveEvent(
  eligible: Scenario[],
  perf: PerfScores,
): Scenario {
  const weakKAs = new Set<string>();
  for (const cat of weakestCategories(perf, 3)) {
    for (const ka of knowledgeAreasFor(cat)) weakKAs.add(ka);
  }
  const preferred = eligible.filter((e) => weakKAs.has(getScenarioMeta(e).knowledgeArea));
  const pool = preferred.length ? preferred : eligible;
  return pool[Math.floor(Math.random() * pool.length)];
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
  perfScores: PerfScores;
  perfImpactPreview: Partial<Record<import("./types").PerfCategory, number>> | null;
  industry: IndustryCase;
  // actions
  choose: (choice: Choice, coach: (text: string | null) => Promise<string> | string) => Promise<void>;
  advance: () => void;
  restart: () => void;
  setIndustry: (id: string) => void;
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
  const [industryId, setIndustryId] = useState<string>(DEFAULT_INDUSTRY_ID);
  const industry = useMemo(() => getIndustry(industryId), [industryId]);
  const [current, setCurrent] = useState<Scenario>(() => businessCaseFor(getIndustry(DEFAULT_INDUSTRY_ID)));
  const [businessCaseDone, setBusinessCaseDone] = useState(false);
  const [pendingChoice, setPendingChoice] = useState<Choice | null>(null);
  const [coachText, setCoachText] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [perfScores, setPerfScores] = useState<PerfScores>(() => initialPerfScores());
  const [perfImpactPreview, setPerfImpactPreview] = useState<
    Partial<Record<import("./types").PerfCategory, number>> | null
  >(null);
  const eventsFired = useRef<Set<string>>(new Set());
  // Freeze the adaptive order for the current phase to avoid re-shuffling mid-phase.
  const phaseOrderRef = useRef<Scenario[] | null>(null);

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
      const perfImpact = perfImpactFor(current, choice);
      setPerfImpactPreview(perfImpact);
      setPerfScores((prev) => applyPerfImpact(prev, perfImpact));

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
    setPerfImpactPreview(null);

    if (!businessCaseDone) {
      setBusinessCaseDone(true);
      const list = adaptivePhaseOrder(scenariosForPhase("initiation"), perfScores);
      phaseOrderRef.current = list;
      setCurrent(list[0]);
      setPhaseIdx(0);
      setPhaseStep(0);
      return;
    }

    if (current.kind === "event") {
      const list = phaseOrderRef.current ?? scenariosForPhase(phase);
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
    // Adaptive random event: higher chance when the learner has a weak
    // category and an eligible event targets it.
    const weak = weakestCategories(perfScores, 2);
    const hasWeakEvent = eligible.some((e) => {
      const ka = getScenarioMeta(e).knowledgeArea;
      return weak.some((c) => knowledgeAreasFor(c).includes(ka));
    });
    const eventChance = hasWeakEvent ? 0.7 : 0.4;
    if (
      (phase === "execution" || phase === "monitoring") &&
      eligible.length > 0 &&
      Math.random() < eventChance &&
      current.kind !== "event" &&
      phaseStep < QUESTIONS_PER_PHASE
    ) {
      const ev = pickAdaptiveEvent(eligible, perfScores);
      eventsFired.current.add(ev.id);
      setCurrent(ev);
      return;
    }

    const nextStep = phaseStep + 1;
    if (nextStep < QUESTIONS_PER_PHASE) {
      const list = phaseOrderRef.current ?? scenariosForPhase(phase);
      setPhaseStep(nextStep);
      setCurrent(list[nextStep]);
      return;
    }

    if (phaseIdx + 1 >= PHASE_ORDER.length) {
      setFinished(true);
      return;
    }
    const nextIdx = phaseIdx + 1;
    const list = adaptivePhaseOrder(
      scenariosForPhase(PHASE_ORDER[nextIdx]),
      perfScores,
    );
    phaseOrderRef.current = list;
    setPhaseIdx(nextIdx);
    setPhaseStep(0);
    setCurrent(list[0]);
  }, [businessCaseDone, current, phase, phaseIdx, phaseStep, perfScores]);

  const restart = useCallback(() => {
    setMetrics(INITIAL_METRICS);
    setPhaseIdx(0);
    setPhaseStep(0);
    setDecisions([]);
    setXp(0);
    setStreak(0);
    setCurrent(businessCaseFor(industry));
    setBusinessCaseDone(false);
    setPendingChoice(null);
    setCoachText(null);
    setFinished(false);
    setPerfScores(initialPerfScores());
    setPerfImpactPreview(null);
    eventsFired.current = new Set();
    phaseOrderRef.current = null;
  }, [industry]);

  const setIndustry = useCallback((id: string) => {
    setIndustryId(id);
    // Only reframe the opening business case if the run hasn't advanced yet.
    setCurrent((cur) =>
      cur.id === "biz-case" ? businessCaseFor(getIndustry(id)) : cur,
    );
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
    perfScores,
    perfImpactPreview,
    choose,
    advance,
    restart,
    setCoach,
  };

  return (
    <ProjectStateCtx.Provider value={value}>{children}</ProjectStateCtx.Provider>
  );
}

