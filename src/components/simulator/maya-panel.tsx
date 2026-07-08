import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import mayaAvatar from "@/assets/maya-avatar.jpg";
import type {
  Choice,
  KnowledgeArea,
  PerfCategory,
  PerfScores,
  Scenario,
} from "@/lib/simulator/types";
import { getScenarioMeta } from "@/lib/simulator/scenarios";
import { weakestCategories } from "@/lib/simulator/performance";

const PMBOK_REFERENCE: Record<KnowledgeArea, { processes: string[]; principle: string }> = {
  Integration: {
    processes: ["Develop Project Charter", "Perform Integrated Change Control", "Close Project or Phase"],
    principle: "PMBOK 7 · Stewardship + Systems Thinking — integrate across scope, cost, schedule, risk.",
  },
  Scope: {
    processes: ["Collect Requirements", "Define Scope", "Create WBS", "Validate & Control Scope"],
    principle: "Prevent scope creep through formal change control, not by saying yes/no ad hoc.",
  },
  Schedule: {
    processes: ["Define & Sequence Activities", "Estimate Durations", "Develop & Control Schedule"],
    principle: "Realistic estimates + reserves beat crashing/fast-tracking without analysis.",
  },
  Cost: {
    processes: ["Estimate Costs", "Determine Budget", "Control Costs (EVM)"],
    principle: "Ranges + management reserves > point estimates. Re-baseline via change control.",
  },
  Quality: {
    processes: ["Plan Quality Management", "Manage Quality", "Control Quality"],
    principle: "Prevention over inspection. Disclose defects; root-cause the trend.",
  },
  Resource: {
    processes: ["Plan Resource Management", "Acquire, Develop, Manage Team", "Control Resources"],
    principle: "Servant leadership + team empowerment. Facilitate; don't force.",
  },
  Communications: {
    processes: ["Plan Communications", "Manage Communications", "Monitor Communications"],
    principle: "Tailor cadence and format per stakeholder group. One-size-fits-all fails.",
  },
  Risk: {
    processes: ["Identify Risks", "Qualitative/Quantitative Analysis", "Plan Responses", "Monitor Risks"],
    principle: "Living register with owners + responses. A stale register manufactures false confidence.",
  },
  Procurement: {
    processes: ["Plan Procurements", "Conduct Procurements", "Control & Close Procurements"],
    principle: "Follow contract terms. Formal closure with scorecards protects the org.",
  },
  Stakeholder: {
    processes: ["Identify Stakeholders", "Plan/Manage/Monitor Stakeholder Engagement"],
    principle: "Engage, don't just inform. Analyze power/interest before choosing strategy.",
  },
};

type Props = {
  scenario: Scenario;
  chosen: Choice | null;
  coachText: string | null;
  coachLoading: boolean;
  perfScores: PerfScores;
};

export function MayaPanel({ scenario, chosen, coachText, coachLoading, perfScores }: Props) {
  const meta = useMemo(() => getScenarioMeta(scenario), [scenario]);
  const [tab, setTab] = useState<string>("hint");

  // When a decision is made, jump to Mindset tab.
  useEffect(() => {
    if (chosen) setTab("mindset");
    else setTab("hint");
  }, [chosen, scenario.id]);

  const hint = buildHint(scenario, meta.knowledgeArea);
  const ref = PMBOK_REFERENCE[meta.knowledgeArea];
  const weak = weakestCategories(perfScores, 3);

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-surface/60 p-4 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={mayaAvatar}
            alt="Maya, your PMP mentor"
            width={44}
            height={44}
            loading="lazy"
            className="h-11 w-11 rounded-full border-2 border-primary/50 object-cover"
          />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-400" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">Maya</div>
          <div className="truncate text-[11px] text-muted-foreground">
            Senior PM · PMP · Your live mentor
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-3">
        <TabsList className="grid w-full grid-cols-5 bg-surface/60">
          <TabsTrigger value="hint" className="text-[10px]">Hint</TabsTrigger>
          <TabsTrigger value="mindset" className="text-[10px]">Mindset</TabsTrigger>
          <TabsTrigger value="pmbok" className="text-[10px]">PMBOK</TabsTrigger>
          <TabsTrigger value="perf" className="text-[10px]">Insights</TabsTrigger>
          <TabsTrigger value="tip" className="text-[10px]">Exam Tip</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab + scenario.id + (chosen ? "post" : "pre")}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <TabsContent value="hint" className="mt-3">
              <MayaBubble>
                <p className="text-sm">
                  {chosen
                    ? "You've already committed on this one — head over to Mindset to see how it lands."
                    : hint}
                </p>
                <p className="mt-2 text-[11px] italic text-muted-foreground">
                  I won't hand you the answer — I'll point you at the right lens.
                </p>
              </MayaBubble>
            </TabsContent>

            <TabsContent value="mindset" className="mt-3">
              <MayaBubble>
                {chosen ? (
                  <>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
                      {chosen.id === meta.correctChoiceId ? "Well played" : "Let's unpack it"}
                    </div>
                    <p className="text-sm">{meta.explanation}</p>
                    <p className="mt-2 text-sm italic text-foreground/85">{meta.pmMindset}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Make a call, then I'll walk you through the PMI mindset behind the strongest option.
                  </p>
                )}
              </MayaBubble>
            </TabsContent>

            <TabsContent value="pmbok" className="mt-3">
              <MayaBubble>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                  {meta.processGroup} · {meta.knowledgeArea}
                </div>
                <div className="mt-2 space-y-1.5">
                  {ref.processes.map((p) => (
                    <div key={p} className="text-sm text-foreground/90">• {p}</div>
                  ))}
                </div>
                <p className="mt-3 rounded-md border border-primary/20 bg-primary/[0.06] p-2 text-xs italic text-foreground/85">
                  {ref.principle}
                </p>
              </MayaBubble>
            </TabsContent>

            <TabsContent value="perf" className="mt-3">
              <MayaBubble>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                  Performance Insights
                </div>
                <div className="mt-2 space-y-1.5">
                  {(Object.entries(perfScores) as [PerfCategory, number][])
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([cat, score]) => (
                      <PerfRow key={cat} label={cat} score={score} />
                    ))}
                </div>
                {weak.length > 0 && (
                  <p className="mt-3 text-xs text-amber-200">
                    Focus areas: <span className="font-semibold">{weak.join(", ")}</span>
                  </p>
                )}
                {chosen && coachText && (
                  <div className="mt-3 rounded-md border border-primary/20 bg-primary/5 p-2 text-xs text-foreground/85">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
                      Live coaching
                    </div>
                    <CoachMd text={coachText} />
                  </div>
                )}
                {chosen && coachLoading && !coachText && (
                  <div className="mt-3 animate-pulse text-xs text-primary/70">Maya is analysing…</div>
                )}
              </MayaBubble>
            </TabsContent>

            <TabsContent value="tip" className="mt-3">
              <MayaBubble>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-amber-200">
                  💡 Exam tip
                </div>
                <p className="mt-1 text-sm text-foreground/90">{meta.examTip}</p>
              </MayaBubble>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}

function MayaBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface/70 p-3 text-foreground">
      {children}
    </div>
  );
}

function PerfRow({ label, score }: { label: string; score: number }) {
  const tone = score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-rose-500";
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-foreground/85">{label}</span>
        <span className="text-muted-foreground">{Math.round(score)}</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-surface-strong">
        <motion.div
          initial={false}
          animate={{ width: `${Math.max(0, Math.min(100, score))}%` }}
          transition={{ duration: 0.5 }}
          className={cn("h-full rounded-full", tone)}
        />
      </div>
    </div>
  );
}

function CoachMd({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="text-primary">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </p>
  );
}

function buildHint(scenario: Scenario, ka: KnowledgeArea): string {
  const hints: Record<KnowledgeArea, string> = {
    Integration: "Think integrated: what process governs this change? Charter, change control, or closure?",
    Scope: "Ask: is this a scope conversation? If yes, the answer usually routes through the CCB.",
    Schedule: "Reserves and realistic estimates over heroics. Which option protects both?",
    Cost: "Look for the option that uses ranges and reserves, and re-baselines through change control.",
    Quality: "Prevention beats inspection. Disclose, don't hide. Root-cause the trend.",
    Resource: "Servant leadership. Facilitate the decision, don't force it. Preserve ownership.",
    Communications: "Tailored cadence to the audience beats a broadcast every time.",
    Risk: "Which option updates the register, assigns owners, and picks a response strategy?",
    Procurement: "The contract exists for exactly this moment — use its clauses.",
    Stakeholder: "Analyze power/interest first. Engagement strategy follows classification.",
  };
  const eventNudge =
    scenario.kind === "event"
      ? " Unplanned events still go through the PMBOK process — resist the urge to react."
      : "";
  return hints[ka] + eventNudge;
}
