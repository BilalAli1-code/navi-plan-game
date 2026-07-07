import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PHASE_ORDER, PHASE_META, getScenarioMeta } from "@/lib/simulator/scenarios";
import type {
  Choice,
  Decision,
  Impact,
  KnowledgeArea,
  Metrics,
  PerfCategory,
  Scenario,
} from "@/lib/simulator/types";
import { useProjectState } from "@/lib/simulator/project-state";
import { KNOWLEDGE_AREAS } from "@/lib/simulator/performance";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/play")({
  head: () => ({
    meta: [
      { title: "ProjectSim — PMBOK Project Management Training Simulator" },
      {
        name: "description",
        content:
          "A flight simulator for project managers. Learn PMBOK 6, PMBOK 7 principles, and hybrid delivery by making live decisions with an AI PMP coach.",
      },
      { property: "og:title", content: "ProjectSim — PMBOK Training Simulator" },
      {
        property: "og:description",
        content:
          "Make project decisions under pressure. Get instant AI coaching grounded in PMBOK 6 & 7.",
      },
    ],
  }),
  component: Simulator,
});

type LevelInfo = { name: string; min: number; next: number | null };
function getLevel(xp: number): LevelInfo {
  if (xp < 60) return { name: "Junior PM", min: 0, next: 60 };
  if (xp < 140) return { name: "Associate PM", min: 60, next: 140 };
  if (xp < 220) return { name: "Senior PM", min: 140, next: 220 };
  if (xp < 300) return { name: "Lead PM", min: 220, next: 300 };
  return { name: "Expert PM", min: 300, next: null };
}

function clamp(n: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

function scheduleLabel(v: number) {
  if (v >= 15) return "Ahead";
  if (v <= -15) return "Behind";
  return "On Track";
}

function toneFor(v: number, invert = false) {
  const good = invert ? v <= 30 : v >= 65;
  const bad = invert ? v >= 65 : v <= 30;
  if (good) return "text-emerald-400";
  if (bad) return "text-rose-400";
  return "text-amber-300";
}

function progressTone(v: number, invert = false) {
  const good = invert ? v <= 30 : v >= 65;
  const bad = invert ? v >= 65 : v <= 30;
  if (good) return "bg-emerald-500";
  if (bad) return "bg-rose-500";
  return "bg-amber-400";
}

function Simulator() {
  const navigate = useNavigate();
  const {
    metrics,
    decisions,
    xp,
    streak,
    phaseIdx,
    current,
    finished,
    pendingChoice,
    coachText,
    coachLoading,
    consequenceNote,
    choose,
    advance,
    restart,
  } = useProjectState();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const level = getLevel(xp);
  const badges = useMemo(() => computeBadges(decisions, metrics), [decisions, metrics]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  async function handleChoose(choice: Choice) {
    await choose(choice, async () => {
      try {
        const res = await fetch("/api/coach", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            phase: PHASE_META[current.phase].label,
            scenario: `${current.title}. ${current.body}`,
            choiceLabel: choice.label,
            choiceRationale: choice.rationale,
            metrics: {
              budget: metrics.budget,
              schedule: scheduleLabel(metrics.schedule),
              scope: metrics.scope,
              risk: metrics.risk,
              stakeholders: metrics.stakeholders,
              morale: metrics.morale,
              quality: metrics.quality,
              businessValue: metrics.businessValue,
            },
          }),
        });
        if (res.ok) {
          const data = (await res.json()) as { text: string };
          return data.text;
        }
      } catch {
        // fall through
      }
      return "Coach is offline. Reflect on how this choice affects budget, schedule, scope, risk, stakeholders, team morale, quality, and business value.";
    });
  }

  useEffect(() => {
    if (!finished || saved) return;
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;
      const score = Math.round(
        metrics.budget * 0.15 +
          (50 + metrics.schedule / 2) * 0.1 +
          metrics.scope * 0.1 +
          (100 - metrics.risk) * 0.1 +
          metrics.stakeholders * 0.15 +
          metrics.morale * 0.1 +
          metrics.quality * 0.15 +
          metrics.businessValue * 0.15,
      );
      const { error: runErr } = await supabase.from("simulation_runs").insert({
        user_id: user.id,
        score,
        xp_earned: xp,
        metrics: metrics as never,
        badges: badges as never,
        decisions: decisions as never,
      });
      if (runErr) {
        toast.error("Couldn't save your run");
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("total_xp, runs_completed")
        .eq("id", user.id)
        .maybeSingle();
      await supabase
        .from("profiles")
        .update({
          total_xp: (prof?.total_xp ?? 0) + xp,
          runs_completed: (prof?.runs_completed ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
      setSaved(true);
      toast.success("Run saved to your profile");
    })();
  }, [finished, saved, metrics, xp, badges, decisions]);

  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-100">
      <Header xp={xp} level={level} streak={streak} userEmail={userEmail} onSignOut={signOut} />

      <main className="mx-auto grid max-w-[1400px] gap-4 px-4 pb-16 pt-6 lg:grid-cols-[240px_minmax(0,1fr)_320px]">
        <PhaseRail phaseIdx={phaseIdx} finished={finished} />

        <section className="min-w-0">
          {finished ? (
            <FinalReport
              metrics={metrics}
              decisions={decisions}
              xp={xp}
              badges={badges}
              onRestart={() => {
                restart();
                setSaved(false);
              }}
            />
          ) : (
            <ScenarioCard
              scenario={current}
              pendingChoice={pendingChoice}
              coachText={coachText}
              coachLoading={coachLoading}
              consequenceNote={consequenceNote}
              onChoose={handleChoose}
              onAdvance={advance}
              isLast={phaseIdx === PHASE_ORDER.length - 1 && current.kind === "phase"}
            />
          )}
        </section>

        <aside className="space-y-4">
          <MetricsPanel metrics={metrics} />
          <BadgesPanel badges={badges} />
          <DecisionLog decisions={decisions} />
        </aside>
      </main>
    </div>
  );
}

function Header({
  xp,
  level,
  streak,
  userEmail,
  onSignOut,
}: {
  xp: number;
  level: LevelInfo;
  streak: number;
  userEmail: string | null;
  onSignOut: () => void;
}) {
  const pct =
    level.next === null
      ? 100
      : Math.round(((xp - level.min) / (level.next - level.min)) * 100);
  return (
    <header className="border-b border-white/5 bg-[#0b1020]/80 backdrop-blur">
      <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 font-black text-slate-950">
            PS
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
              ProjectSim
            </h1>
            <p className="truncate text-xs text-slate-400">
              PMBOK Project Management Training Simulator
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden text-right sm:block">
            <div className="text-[11px] uppercase tracking-widest text-slate-400">Level</div>
            <div className="text-sm font-semibold">{level.name}</div>
          </div>
          <div className="min-w-[120px]">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{xp} XP</span>
              <span>{level.next ? `${level.next} XP` : "MAX"}</span>
            </div>
            <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-cyan-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <Link
            to="/performance"
            className="hidden rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-white/[0.08] sm:inline-block"
          >
            Performance →
          </Link>
          <Badge className="border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/10">
            🔥 {streak}
          </Badge>
          {userEmail && (
            <div className="hidden text-right md:block">
              <div className="text-[11px] uppercase tracking-widest text-slate-400">Signed in</div>
              <div className="max-w-[160px] truncate text-xs text-slate-200">{userEmail}</div>
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={onSignOut}
            className="border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]"
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}

function PhaseRail({ phaseIdx, finished }: { phaseIdx: number; finished: boolean }) {
  return (
    <aside className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
      <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
        <div className="mb-2 px-2 text-[11px] uppercase tracking-widest text-slate-400">
          Project Lifecycle
        </div>
        <ol className="space-y-1">
          {PHASE_ORDER.map((p, i) => {
            const active = !finished && i === phaseIdx;
            const done = finished || i < phaseIdx;
            return (
              <li
                key={p}
                className={cn(
                  "flex items-start gap-3 rounded-xl px-3 py-2.5 transition",
                  active && "bg-indigo-500/15 ring-1 ring-indigo-400/30",
                  !active && "hover:bg-white/[0.03]",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                    done && "bg-emerald-500/90 text-slate-950",
                    active && "bg-indigo-400 text-slate-950",
                    !done && !active && "bg-white/10 text-slate-300",
                  )}
                >
                  {done ? "✓" : i + 1}
                </div>
                <div className="min-w-0">
                  <div className={cn("text-sm font-medium", active ? "text-white" : "text-slate-200")}>
                    {PHASE_META[p].label}
                  </div>
                  <div className="truncate text-xs text-slate-400">
                    {PHASE_META[p].blurb}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}

const IMPACT_LABEL: Record<keyof Metrics, string> = {
  budget: "Budget",
  schedule: "Schedule",
  scope: "Scope",
  risk: "Risk",
  stakeholders: "Stakeholders",
  morale: "Morale",
  quality: "Quality",
  businessValue: "Value",
};

function ImpactChips({ impact }: { impact: Impact }) {
  const entries = Object.entries(impact).filter(([, v]) => v !== undefined && v !== 0) as [
    keyof Metrics,
    number,
  ][];
  if (entries.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {entries.map(([k, v]) => {
        // For "risk", negative is good.
        const good = k === "risk" ? v < 0 : v > 0;
        return (
          <span
            key={k}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              good
                ? "bg-emerald-400/15 text-emerald-200"
                : "bg-rose-400/15 text-rose-200",
            )}
          >
            {v > 0 ? "+" : ""}
            {v} {IMPACT_LABEL[k]}
          </span>
        );
      })}
    </div>
  );
}

function ScenarioCard({
  scenario,
  pendingChoice,
  coachText,
  coachLoading,
  consequenceNote,
  onChoose,
  onAdvance,
  isLast,
}: {
  scenario: Scenario;
  pendingChoice: Choice | null;
  coachText: string | null;
  coachLoading: boolean;
  consequenceNote: string | null;
  onChoose: (c: Choice) => void;
  onAdvance: () => void;
  isLast: boolean;
}) {
  const isEvent = scenario.kind === "event";
  const meta = getScenarioMeta(scenario);
  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        <motion.article
          key={scenario.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className={cn(
            "overflow-hidden rounded-2xl border bg-gradient-to-br p-6",
            isEvent
              ? "border-amber-400/30 from-amber-500/10 to-rose-500/5"
              : "border-white/5 from-white/[0.05] to-white/[0.02]",
          )}
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                isEvent
                  ? "bg-amber-400/20 text-amber-200"
                  : "bg-indigo-400/15 text-indigo-200",
              )}
            >
              {isEvent ? "Random Event" : PHASE_META[scenario.phase].label}
            </span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
              {meta.processGroup}
            </span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
              {meta.knowledgeArea}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                meta.difficulty === "easy" && "bg-emerald-400/15 text-emerald-200",
                meta.difficulty === "medium" && "bg-amber-400/15 text-amber-200",
                meta.difficulty === "hard" && "bg-rose-400/15 text-rose-200",
              )}
            >
              {meta.difficulty.toUpperCase()}
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{scenario.title}</h2>
          <p className="mt-2 text-slate-300">{scenario.body}</p>

          {consequenceNote && (
            <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-3 text-xs text-amber-100">
              <span className="mr-1 font-semibold uppercase tracking-wider text-amber-200">
                Project memory:
              </span>
              {consequenceNote}
            </div>
          )}

          <div className="mt-5 grid gap-3">
            {scenario.choices.map((c) => {
              const isChosen = pendingChoice?.id === c.id;
              const dimmed = pendingChoice && !isChosen;
              const isCorrect = c.id === meta.correctChoiceId;
              return (
                <button
                  key={c.id}
                  disabled={!!pendingChoice}
                  onClick={() => onChoose(c)}
                  className={cn(
                    "group flex items-start gap-3 rounded-xl border p-4 text-left transition",
                    "border-white/10 bg-white/[0.03] hover:border-indigo-400/40 hover:bg-indigo-500/10",
                    isChosen &&
                      "border-indigo-400/60 bg-indigo-500/15 ring-2 ring-indigo-400/40",
                    pendingChoice && isCorrect && !isChosen &&
                      "border-emerald-400/40 bg-emerald-500/10",
                    dimmed && "opacity-60",
                    !pendingChoice && "cursor-pointer",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-bold",
                      isChosen
                        ? "bg-indigo-400 text-slate-950"
                        : "bg-white/10 text-slate-200 group-hover:bg-indigo-400 group-hover:text-slate-950",
                    )}
                  >
                    {c.id.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-slate-100">{c.label}</div>
                      {pendingChoice && isCorrect && (
                        <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                          CORRECT
                        </span>
                      )}
                    </div>
                    {isChosen && (
                      <>
                        <div className="mt-2 text-xs text-indigo-200/80">{c.rationale}</div>
                        <ImpactChips impact={c.impact} />
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.article>
      </AnimatePresence>

      <AnimatePresence>
        {pendingChoice && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <LearningReview
              scenario={scenario}
              chosen={pendingChoice}
              coachText={coachText}
              coachLoading={coachLoading}
              onAdvance={onAdvance}
              isLast={isLast}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LearningReview({
  scenario,
  chosen,
  coachText,
  coachLoading,
  onAdvance,
  isLast,
}: {
  scenario: Scenario;
  chosen: Choice;
  coachText: string | null;
  coachLoading: boolean;
  onAdvance: () => void;
  isLast: boolean;
}) {
  const meta = getScenarioMeta(scenario);
  const correctChoice = scenario.choices.find((c) => c.id === meta.correctChoiceId)!;
  const wasCorrect = chosen.id === meta.correctChoiceId;

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5">
      {/* Header + verdict */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-cyan-400/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-cyan-200">
          Learning Review
        </span>
        {wasCorrect ? (
          <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
            ✓ Correct — {chosen.id.toUpperCase()}
          </span>
        ) : (
          <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
            Best answer was {meta.correctChoiceId.toUpperCase()}
          </span>
        )}
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-slate-300">
          +{chosen.xp} XP
        </span>
      </div>

      {/* Correct answer highlight */}
      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-200">
          ✅ Correct Answer — Option {meta.correctChoiceId.toUpperCase()}
        </div>
        <div className="text-sm font-medium text-slate-100">{correctChoice.label}</div>
      </div>

      {/* PMI Mindset */}
      <ReviewSection label="PMI Mindset" tone="indigo">
        <p className="text-sm leading-relaxed text-slate-200">{meta.explanation}</p>
        <p className="mt-2 text-sm italic leading-relaxed text-indigo-100">
          {meta.pmMindset}
        </p>
      </ReviewSection>

      {/* Decision Analysis */}
      <ReviewSection label="Decision Analysis" tone="slate">
        <ul className="space-y-2.5">
          {scenario.choices.map((c) => (
            <li key={c.id} className="text-sm">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid h-5 w-5 place-items-center rounded text-[10px] font-bold",
                    c.id === meta.correctChoiceId
                      ? "bg-emerald-400 text-slate-950"
                      : c.quality === "poor"
                      ? "bg-rose-500/70 text-slate-950"
                      : c.quality === "risky"
                      ? "bg-amber-400 text-slate-950"
                      : "bg-cyan-400 text-slate-950",
                  )}
                >
                  {c.id.toUpperCase()}
                </span>
                <span className="font-medium text-slate-100">
                  {analysisLead(c, c.id === meta.correctChoiceId)}
                </span>
              </div>
              <p className="ml-7 mt-0.5 text-xs leading-relaxed text-slate-400">
                {c.rationale}
              </p>
            </li>
          ))}
        </ul>
      </ReviewSection>

      {/* Exam Tip */}
      <ReviewSection label="Exam Tip" tone="amber">
        <p className="text-sm leading-relaxed text-amber-100">💡 {meta.examTip}</p>
      </ReviewSection>

      {/* Knowledge Area strip */}
      <ReviewSection label="Knowledge Area" tone="slate">
        <KnowledgeAreaStrip active={meta.knowledgeArea} />
      </ReviewSection>

      {/* AI coach narrative (kept as optional deeper coaching) */}
      <ReviewSection label="Senior PM Coach" tone="cyan">
        {coachLoading && !coachText ? (
          <div className="animate-pulse text-sm text-cyan-100/70">
            Analyzing your decision against PMBOK principles…
          </div>
        ) : coachText ? (
          <CoachMarkdown text={coachText} />
        ) : (
          <p className="text-sm text-slate-400">Coach is offline — review the analysis above.</p>
        )}
      </ReviewSection>

      {!coachLoading && (
        <div className="flex justify-end">
          <Button
            onClick={onAdvance}
            className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 hover:opacity-90"
          >
            {isLast ? "Close project →" : "Continue →"}
          </Button>
        </div>
      )}
    </div>
  );
}

function analysisLead(c: Choice, isCorrect: boolean): string {
  if (isCorrect) return "Best answer — strongest PMBOK alignment.";
  switch (c.quality) {
    case "excellent":
      return "Also strong — a valid alternative in this situation.";
    case "good":
      return "Reasonable, but incomplete for the exam.";
    case "risky":
      return "Risky — trades a short-term win for downstream cost.";
    case "poor":
    default:
      return "Incorrect — violates PMBOK process.";
  }
}

function ReviewSection({
  label,
  tone,
  children,
}: {
  label: string;
  tone: "indigo" | "cyan" | "amber" | "slate";
  children: React.ReactNode;
}) {
  const toneMap = {
    indigo: "border-indigo-400/20 bg-indigo-400/[0.04]",
    cyan: "border-cyan-400/20 bg-cyan-400/[0.05]",
    amber: "border-amber-400/20 bg-amber-400/[0.05]",
    slate: "border-white/10 bg-white/[0.03]",
  } as const;
  const labelTone = {
    indigo: "text-indigo-200",
    cyan: "text-cyan-200",
    amber: "text-amber-200",
    slate: "text-slate-300",
  } as const;
  return (
    <div className={cn("rounded-xl border p-4", toneMap[tone])}>
      <div className={cn("mb-2 text-[11px] font-semibold uppercase tracking-widest", labelTone[tone])}>
        {label}
      </div>
      {children}
    </div>
  );
}

function KnowledgeAreaStrip({ active }: { active: KnowledgeArea }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {KNOWLEDGE_AREAS.map((ka) => (
        <span
          key={ka}
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-[11px] transition",
            ka === active
              ? "border-cyan-400/60 bg-cyan-400/20 font-semibold text-cyan-100"
              : "border-white/10 bg-white/[0.02] text-slate-500",
          )}
        >
          {ka}
        </span>
      ))}
    </div>
  );
}

function CoachMarkdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-100">
      {blocks.map((b, i) => {
        const parts = b.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((p, j) =>
              p.startsWith("**") && p.endsWith("**") ? (
                <strong key={j} className="text-cyan-200">
                  {p.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{p}</span>
              ),
            )}
          </p>
        );
      })}
    </div>
  );
}

function MetricsPanel({ metrics }: { metrics: Metrics }) {
  const items: { label: string; value: number; display: string; invert?: boolean }[] = [
    { label: "Budget remaining", value: metrics.budget, display: `${Math.round(metrics.budget)}%` },
    { label: "Schedule", value: 50 + metrics.schedule / 2, display: scheduleLabel(metrics.schedule) },
    { label: "Scope stability", value: metrics.scope, display: `${Math.round(metrics.scope)}%` },
    { label: "Risk level", value: metrics.risk, display: `${Math.round(metrics.risk)}%`, invert: true },
    { label: "Stakeholders", value: metrics.stakeholders, display: `${Math.round(metrics.stakeholders)}%` },
    { label: "Team morale", value: metrics.morale, display: `${Math.round(metrics.morale)}%` },
    { label: "Quality", value: metrics.quality, display: `${Math.round(metrics.quality)}%` },
    { label: "Business value", value: metrics.businessValue, display: `${Math.round(metrics.businessValue)}%` },
  ];
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-widest text-slate-400">
          Live Project Dashboard
        </div>
        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
      </div>
      <div className="space-y-3">
        {items.map((m) => (
          <div key={m.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">{m.label}</span>
              <span className={cn("font-semibold", toneFor(m.value, m.invert))}>{m.display}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={false}
                animate={{ width: `${clamp(m.value)}%` }}
                transition={{ duration: 0.5 }}
                className={cn("h-full rounded-full", progressTone(m.value, m.invert))}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const BADGE_META: Record<string, { label: string; emoji: string; desc: string }> = {
  "risk-manager": { label: "Risk Manager", emoji: "🛡️", desc: "Kept risk under control" },
  "scope-controller": { label: "Scope Controller", emoji: "🎯", desc: "Preserved scope stability" },
  "stakeholder-expert": { label: "Stakeholder Expert", emoji: "🤝", desc: "Kept sponsors happy" },
  "budget-hawk": { label: "Budget Hawk", emoji: "💰", desc: "Protected the budget" },
  "delivery-star": { label: "Delivery Star", emoji: "⭐", desc: "Multiple excellent calls" },
  "quality-champion": { label: "Quality Champion", emoji: "✨", desc: "Held the quality line" },
  "value-driver": { label: "Value Driver", emoji: "🚀", desc: "Protected business value" },
};

function computeBadges(decisions: Decision[], metrics: Metrics): string[] {
  const badges: string[] = [];
  const excellent = decisions.filter((d) => d.quality === "excellent").length;
  if (excellent >= 3) badges.push("delivery-star");
  if (metrics.risk <= 30) badges.push("risk-manager");
  if (metrics.scope >= 75) badges.push("scope-controller");
  if (metrics.stakeholders >= 80) badges.push("stakeholder-expert");
  if (metrics.budget >= 75) badges.push("budget-hawk");
  if (metrics.quality >= 80) badges.push("quality-champion");
  if (metrics.businessValue >= 80) badges.push("value-driver");
  return badges;
}

function BadgesPanel({ badges }: { badges: string[] }) {
  const all = Object.keys(BADGE_META);
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
      <div className="mb-3 text-[11px] uppercase tracking-widest text-slate-400">Badges</div>
      <div className="grid grid-cols-4 gap-2">
        {all.map((b) => {
          const earned = badges.includes(b);
          const meta = BADGE_META[b];
          return (
            <div
              key={b}
              title={`${meta.label} — ${meta.desc}`}
              className={cn(
                "grid aspect-square place-items-center rounded-xl border text-lg transition",
                earned
                  ? "border-amber-300/40 bg-amber-300/10 text-amber-200"
                  : "border-white/5 bg-white/[0.02] text-slate-600 grayscale",
              )}
            >
              {meta.emoji}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DecisionLog({ decisions }: { decisions: Decision[] }) {
  if (decisions.length === 0) return null;
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
      <div className="mb-3 text-[11px] uppercase tracking-widest text-slate-400">Decision Log</div>
      <ol className="space-y-2">
        {decisions.slice(-6).reverse().map((d, i) => (
          <li key={`${d.scenarioId}-${i}`} className="flex items-start gap-2 text-xs">
            <span
              className={cn(
                "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                d.quality === "excellent" && "bg-emerald-400",
                d.quality === "good" && "bg-cyan-400",
                d.quality === "risky" && "bg-amber-400",
                d.quality === "poor" && "bg-rose-500",
              )}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-slate-200">{d.scenarioTitle}</span>
                {d.correct && (
                  <span className="rounded bg-emerald-400/15 px-1 text-[9px] font-semibold text-emerald-200">
                    ✓
                  </span>
                )}
              </div>
              <div className="truncate text-slate-500">{d.choiceLabel}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function FinalReport({
  metrics,
  decisions,
  xp,
  badges,
  onRestart,
}: {
  metrics: Metrics;
  decisions: Decision[];
  xp: number;
  badges: string[];
  onRestart: () => void;
}) {
  const excellent = decisions.filter((d) => d.quality === "excellent").length;
  const poor = decisions.filter((d) => d.quality === "poor").length;
  const correct = decisions.filter((d) => d.correct).length;
  const score = Math.round(
    metrics.budget * 0.15 +
      (50 + metrics.schedule / 2) * 0.1 +
      metrics.scope * 0.1 +
      (100 - metrics.risk) * 0.1 +
      metrics.stakeholders * 0.15 +
      metrics.morale * 0.1 +
      metrics.quality * 0.15 +
      metrics.businessValue * 0.15,
  );
  const level = score >= 85 ? "Advanced" : score >= 65 ? "Intermediate" : "Beginner";
  const went_well: string[] = [];
  const went_wrong: string[] = [];
  if (metrics.stakeholders >= 70) went_well.push("Maintained strong stakeholder trust");
  if (metrics.risk <= 35) went_well.push("Effective risk response strategy");
  if (metrics.scope >= 70) went_well.push("Held the line on scope through change control");
  if (metrics.budget >= 70) went_well.push("Kept spending under baseline + reserves");
  if (metrics.morale >= 70) went_well.push("Preserved team morale and psychological safety");
  if (metrics.quality >= 70) went_well.push("Sustained delivery quality");
  if (metrics.businessValue >= 70) went_well.push("Protected business value / benefits realization");
  if (metrics.stakeholders < 50) went_wrong.push("Stakeholder engagement suffered");
  if (metrics.risk > 60) went_wrong.push("Risk exposure grew unchecked");
  if (metrics.scope < 55) went_wrong.push("Scope drifted — change control was bypassed");
  if (metrics.budget < 50) went_wrong.push("Budget overrun");
  if (metrics.morale < 50) went_wrong.push("Team morale dropped");
  if (metrics.quality < 55) went_wrong.push("Quality standards slipped");
  if (metrics.businessValue < 55) went_wrong.push("Business value drifted from the sponsor's intent");
  if (went_well.length === 0) went_well.push("You completed a full project lifecycle");
  if (went_wrong.length === 0) went_wrong.push("No major process failures");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-white/[0.03] to-cyan-400/10 p-8"
    >
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-[0.3em] text-cyan-300">
          Certification of Simulation
        </div>
        <h2 className="mt-2 text-3xl font-black tracking-tight">Project Simulation Complete</h2>
        <p className="mt-1 text-slate-300">
          Level achieved: <strong className="text-white">{level}</strong>
        </p>
        <div className="mx-auto mt-6 grid h-40 w-40 place-items-center rounded-full border-4 border-cyan-400/40 bg-gradient-to-br from-indigo-500/30 to-cyan-400/20">
          <div>
            <div className="text-5xl font-black text-white">{score}</div>
            <div className="text-xs text-slate-300">out of 100</div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <ReportBox title="Final Metrics">
          <ReportRow k="Budget remaining" v={`${Math.round(metrics.budget)}%`} />
          <ReportRow k="Schedule" v={scheduleLabel(metrics.schedule)} />
          <ReportRow k="Scope stability" v={`${Math.round(metrics.scope)}%`} />
          <ReportRow k="Risk level" v={`${Math.round(metrics.risk)}%`} />
          <ReportRow k="Stakeholder satisfaction" v={`${Math.round(metrics.stakeholders)}%`} />
          <ReportRow k="Team morale" v={`${Math.round(metrics.morale)}%`} />
          <ReportRow k="Quality" v={`${Math.round(metrics.quality)}%`} />
          <ReportRow k="Business value" v={`${Math.round(metrics.businessValue)}%`} />
        </ReportBox>
        <ReportBox title="Learning Summary">
          <ReportRow k="Decisions made" v={String(decisions.length)} />
          <ReportRow k="Correct answers" v={`${correct} / ${decisions.length}`} />
          <ReportRow k="Excellent calls" v={String(excellent)} />
          <ReportRow k="Poor calls" v={String(poor)} />
          <ReportRow k="XP earned" v={`${xp}`} />
          <ReportRow k="Badges" v={badges.length ? badges.map((b) => BADGE_META[b].emoji).join(" ") : "—"} />
        </ReportBox>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
          <div className="mb-2 text-sm font-semibold text-emerald-200">What went well</div>
          <ul className="space-y-1 text-sm text-slate-200">
            {went_well.map((w) => (
              <li key={w}>✓ {w}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-4">
          <div className="mb-2 text-sm font-semibold text-rose-200">Areas for improvement</div>
          <ul className="space-y-1 text-sm text-slate-200">
            {went_wrong.map((w) => (
              <li key={w}>• {w}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          onClick={onRestart}
          className="bg-gradient-to-r from-indigo-500 to-cyan-400 px-6 text-slate-950 hover:opacity-90"
        >
          Run another project →
        </Button>
      </div>
    </motion.div>
  );
}

function ReportBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 text-[11px] uppercase tracking-widest text-slate-400">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ReportRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-300">{k}</span>
      <span className="font-semibold text-white">{v}</span>
    </div>
  );
}

// Silence unused import warnings when the tree-shaker is aggressive.
void Progress;
void Link;
