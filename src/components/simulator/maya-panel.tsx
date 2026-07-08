import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Heart, BookOpen, BarChart3, Lightbulb, Send } from "lucide-react";
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
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (chosen) setTab("mindset");
    else setTab("hint");
    setExpanded(false);
  }, [chosen, scenario.id]);

  const { short: hintShort, more: hintMore } = buildHint(scenario, meta.knowledgeArea);
  const ref = PMBOK_REFERENCE[meta.knowledgeArea];
  const weak = weakestCategories(perfScores, 3);

  const tabs: { id: string; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "hint", label: "Hint", Icon: MapPin },
    { id: "mindset", label: "Mindset", Icon: Heart },
    { id: "pmbok", label: "PMBOK", Icon: BookOpen },
    { id: "insights", label: "Insights", Icon: BarChart3 },
    { id: "tip", label: "Exam Tip", Icon: Lightbulb },
  ];

  return (
    <div className="play-card p-6">
      <div className="mb-5 text-[18px] font-semibold text-foreground">AI Coach: Maya</div>

      <div className="flex flex-col items-center gap-3 pb-5">
        <div className="relative">
          <img
            src={mayaAvatar}
            alt="Maya, your PMP mentor"
            className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-[0_6px_18px_rgba(28,43,107,0.18)]"
          />
          <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-[color:var(--color-success)]" />
        </div>
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-[color:var(--color-success)]" />
          Online
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid h-auto w-full grid-cols-5 gap-1 rounded-xl bg-transparent p-0">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border-none bg-transparent px-1 py-2 text-[11px] font-medium text-muted-foreground",
                "data-[state=active]:bg-transparent data-[state=active]:text-accent data-[state=active]:shadow-none",
                "relative after:absolute after:-bottom-1 after:left-1/2 after:h-0.5 after:w-0 after:-translate-x-1/2 after:rounded-full after:bg-accent after:transition-all",
                "data-[state=active]:after:w-6",
              )}
            >
              <t.Icon className="h-4 w-4" />
              <span>{t.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab + scenario.id + (chosen ? "post" : "pre")}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <TabsContent value="hint" className="mt-5">
              <MayaCard>
                <div className="text-[15px] font-semibold text-foreground">Maya's Hint</div>
                <p className="mt-2 text-[15px] leading-relaxed text-foreground/85">
                  {chosen
                    ? "You've already committed — check Mindset to see how it lands."
                    : hintShort}
                </p>
                {!chosen && expanded && (
                  <p className="mt-3 text-[13px] italic leading-relaxed text-muted-foreground">
                    {hintMore}
                  </p>
                )}
                {!chosen && (
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="mt-4 w-full rounded-full bg-accent/10 py-2.5 text-[13px] font-semibold text-accent transition hover:bg-accent/15"
                  >
                    {expanded ? "Show less" : "Show more hint"}
                  </button>
                )}
              </MayaCard>
            </TabsContent>

            <TabsContent value="mindset" className="mt-5">
              <MayaCard>
                {chosen ? (
                  <>
                    <div className="text-[11px] font-semibold uppercase tracking-widest text-accent">
                      {chosen.id === meta.correctChoiceId ? "Well played" : "Let's unpack it"}
                    </div>
                    <p className="mt-2 text-[15px] leading-relaxed text-foreground/85">
                      {meta.explanation}
                    </p>
                    <p className="mt-3 text-[15px] italic leading-relaxed text-foreground/80">
                      {meta.pmMindset}
                    </p>
                  </>
                ) : (
                  <p className="text-[15px] text-muted-foreground">
                    Make a call, then I'll walk you through the PMI mindset.
                  </p>
                )}
              </MayaCard>
            </TabsContent>

            <TabsContent value="pmbok" className="mt-5">
              <MayaCard>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-accent">
                  {meta.processGroup} · {meta.knowledgeArea}
                </div>
                <div className="mt-3 space-y-1.5">
                  {ref.processes.map((p) => (
                    <div key={p} className="text-[15px] text-foreground/85">
                      • {p}
                    </div>
                  ))}
                </div>
                <p className="mt-4 rounded-xl bg-accent/8 p-3 text-[13px] italic leading-relaxed text-foreground/80">
                  {ref.principle}
                </p>
              </MayaCard>
            </TabsContent>

            <TabsContent value="insights" className="mt-5">
              <MayaCard>
                <div className="text-[15px] font-semibold text-foreground">
                  Performance Insights
                </div>
                <div className="mt-3 space-y-2.5">
                  {(Object.entries(perfScores) as [PerfCategory, number][])
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5)
                    .map(([cat, score]) => (
                      <PerfRow key={cat} label={cat} score={score} />
                    ))}
                </div>
                {weak.length > 0 && (
                  <p className="mt-4 text-[13px] text-[color:var(--color-warning)]">
                    Focus areas:{" "}
                    <span className="font-semibold">{weak.join(", ")}</span>
                  </p>
                )}
                {chosen && coachText && (
                  <div className="mt-4 rounded-xl bg-accent/8 p-3 text-[13px] text-foreground/85">
                    <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-accent">
                      Live coaching
                    </div>
                    <CoachMd text={coachText} />
                  </div>
                )}
                {chosen && coachLoading && !coachText && (
                  <div className="mt-4 animate-pulse text-[13px] text-accent">
                    Maya is analysing…
                  </div>
                )}
              </MayaCard>
            </TabsContent>

            <TabsContent value="tip" className="mt-5">
              <MayaCard>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-[color:var(--color-warning)]">
                  💡 Exam tip
                </div>
                <p className="mt-2 text-[15px] leading-relaxed text-foreground/85">
                  {meta.examTip}
                </p>
              </MayaCard>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>

      <AskMaya scenario={scenario} chosen={chosen} />
    </div>
  );
}

function AskMaya({ scenario, chosen }: { scenario: Scenario; chosen: Choice | null }) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prompts = [
    "Who owns this decision?",
    "What should I pay attention to?",
    "What PMI principle applies?",
  ];

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setAnswer("");
    try {
      const res = await fetch("/api/maya-ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: trimmed,
          scenarioTitle: scenario.title,
          scenarioSummary: scenario.body,
          phase: scenario.phase,
          chosenLabel: chosen?.label ?? null,
        }),
      });
      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => "Coach unavailable");
        throw new Error(msg || `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setAnswer((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coach unavailable");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <div className="mb-3 text-[15px] font-semibold text-foreground">Ask Maya</div>
      <div className="flex flex-col gap-2">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => {
              setQ(p);
              void ask(p);
            }}
            disabled={loading}
            className="rounded-xl border border-black/[0.06] bg-white px-4 py-2.5 text-left text-[13px] font-medium text-foreground/80 transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-accent/[0.04] hover:text-accent disabled:opacity-60"
          >
            {p}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(q);
        }}
        className="mt-3 flex items-center gap-2 rounded-full border border-black/[0.06] bg-white pl-4 pr-1.5 shadow-sm"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 bg-transparent py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !q.trim()}
          className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
          aria-label="Send question"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {(loading || answer || error) && (
        <div className="mt-3 rounded-2xl border border-black/[0.06] bg-white p-4 text-[13px] leading-relaxed text-foreground/85 shadow-sm">
          {error ? (
            <div className="text-[color:var(--color-destructive)]">{error}</div>
          ) : (
            <div className="whitespace-pre-wrap">
              {answer || (loading ? "Maya is thinking…" : "")}
              {loading && answer && <span className="ml-0.5 animate-pulse">▍</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MayaCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/[0.05] bg-[color:var(--color-surface-strong)] p-5">
      {children}
    </div>
  );
}

function PerfRow({ label, score }: { label: string; score: number }) {
  const tone =
    score >= 70
      ? "bg-[color:var(--color-success)]"
      : score >= 50
        ? "bg-[color:var(--color-warning)]"
        : "bg-[color:var(--color-destructive)]";
  return (
    <div>
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-foreground/85">{label}</span>
        <span className="text-muted-foreground">{Math.round(score)}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
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
          <strong key={i} className="text-accent">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </p>
  );
}

function buildHint(scenario: Scenario, ka: KnowledgeArea): { short: string; more: string } {
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
  const short =
    scenario.kind === "event"
      ? "This is an unplanned event — resist the urge to react. PMI still expects you to run it through the process."
      : "PMI expects you to focus on understanding the situation before jumping into planning or documentation.";
  return { short, more: hints[ka] };
}
