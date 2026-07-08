import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Users,
  AlertTriangle,
  AlertOctagon,
  UserCircle2,
  BarChart3,
  Trophy,
  Settings,
  Send,
  Users2,
  FileSearch,
  FilePlus2,
  MessageCircle,
} from "lucide-react";
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
import { useExamWeaknesses } from "@/lib/exam/use-exam-weaknesses";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getScenarioNarrative } from "@/lib/simulator/narrative";
import { WorkplaceNarrative } from "@/components/simulator/workplace-narrative";
import { MayaPanel } from "@/components/simulator/maya-panel";

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
    perfScores,
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
    <div className="play-theme min-h-screen bg-background font-sans text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1440px] gap-6 p-6">
        <SideNav userEmail={userEmail} level={level} xp={xp} onSignOut={signOut} />

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <TopBar
            phaseIdx={phaseIdx}
            finished={finished}
            currentTitle={finished ? "Project Closeout" : current.title}
            metrics={metrics}
            streak={streak}
          />
          <ExamFocusBanner />

          <main className="grid min-w-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="min-w-0 space-y-6">
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
              <MetricsPanel metrics={metrics} />
              <BadgesPanel badges={badges} />
              <DecisionLog decisions={decisions} />
            </section>

            <aside className="space-y-6">
              {!finished && (
                <MayaPanel
                  scenario={current}
                  chosen={pendingChoice}
                  coachText={coachText}
                  coachLoading={coachLoading}
                  perfScores={perfScores}
                />
              )}
            </aside>
          </main>
        </div>
      </div>
    </div>
  );
}

function SideNav({
  userEmail,
  level,
  xp,
  onSignOut,
}: {
  userEmail: string | null;
  level: LevelInfo;
  xp: number;
  onSignOut: () => void;
}) {
  const items: {
    to: string;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { to: "/play", label: "Dashboard", Icon: LayoutDashboard },
    { to: "/play", label: "Timeline", Icon: CalendarDays },
    { to: "/exam", label: "Documents", Icon: FileText },
    { to: "/performance", label: "Stakeholders", Icon: Users },
    { to: "/analytics", label: "Risks", Icon: AlertTriangle },
    { to: "/exam/history", label: "Issues", Icon: AlertOctagon },
    { to: "/performance", label: "Team", Icon: UserCircle2 },
    { to: "/analytics", label: "Reports", Icon: BarChart3 },
    { to: "/performance", label: "Achievements", Icon: Trophy },
    { to: "/pricing", label: "Settings", Icon: Settings },
  ];
  const pct =
    level.next === null
      ? 100
      : Math.round(((xp - level.min) / (level.next - level.min)) * 100);
  return (
    <aside className="sticky top-6 hidden h-[calc(100vh-3rem)] w-[260px] shrink-0 flex-col overflow-hidden rounded-[18px] bg-sidebar text-sidebar-foreground shadow-[0_10px_30px_rgba(0,0,0,0.06)] lg:flex">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent font-black text-accent-foreground">
          PS
        </div>
        <div className="min-w-0">
          <div className="text-base font-semibold text-white">ProjectSim</div>
          <div className="mt-0.5 truncate text-[11px] text-white/55">
            Customer Portal Modernization
          </div>
        </div>
      </div>

      <nav className="mt-1 flex-1 space-y-1 px-3">
        {items.map((it, i) => {
          const selected = it.label === "Timeline";
          return (
            <Link
              key={i}
              to={it.to}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition",
                selected
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-white/70 hover:bg-white/5 hover:text-white",
              )}
            >
              <it.Icon className="h-4 w-4" />
              <span className="truncate">{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-widest text-white/50">
          <span>{level.name}</span>
          <span>{xp} XP</span>
        </div>
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-accent/30 text-xs font-bold text-white">
            {(userEmail?.[0] ?? "N").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-white">
              {userEmail ? userEmail.split("@")[0] : "NovaLink"}
            </div>
            <div className="text-[11px] text-white/50">{level.name}</div>
          </div>
          <button
            onClick={onSignOut}
            className="rounded-md px-2 py-1 text-[10px] text-white/50 transition hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}

function TopBar({
  phaseIdx,
  finished,
  currentTitle,
  metrics,
  streak,
}: {
  phaseIdx: number;
  finished: boolean;
  currentTitle: string;
  metrics: Metrics;
  streak: number;
}) {
  const phaseLabel = finished
    ? "Closeout"
    : PHASE_META[PHASE_ORDER[phaseIdx]].label;
  const health = Math.round(
    (metrics.budget +
      (50 + metrics.schedule / 2) +
      metrics.scope +
      (100 - metrics.risk) +
      metrics.stakeholders +
      metrics.quality) /
      6,
  );
  const healthLabel = health >= 70 ? "Good" : health >= 50 ? "Watch" : "At Risk";
  const healthTone =
    health >= 70
      ? "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]"
      : health >= 50
      ? "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]"
      : "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]";
  return (
    <header className="flex flex-wrap items-center gap-4">
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium uppercase tracking-widest text-muted-foreground">
          Phase {phaseIdx + 1} · {phaseLabel}
        </div>
        <h1 className="mt-1 flex items-center gap-2 truncate text-[30px] font-bold tracking-tight text-foreground">
          <CalendarDays className="h-6 w-6 text-accent" />
          {currentTitle}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-medium text-muted-foreground">
          Project Health
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-semibold",
            healthTone,
          )}
        >
          <span className="h-2 w-2 rounded-full bg-current" />
          {healthLabel} · {health}%
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-warning)]/15 px-3 py-1.5 text-[13px] font-semibold text-[color:var(--color-warning)]">
          🔥 {streak}
        </span>
      </div>
      <div className="flex w-full gap-1">
        {PHASE_ORDER.map((p, i) => (
          <div
            key={p}
            title={PHASE_META[p].label}
            className={cn(
              "h-1 flex-1 rounded-full transition",
              finished || i < phaseIdx
                ? "bg-[color:var(--color-success)]"
                : i === phaseIdx
                ? "bg-accent"
                : "bg-black/[0.06]",
            )}
          />
        ))}
      </div>
    </header>
  );
}


function ExamFocusBanner() {
  const { latest, weakestKAs, passProbability } = useExamWeaknesses(3);
  if (!latest || weakestKAs.length === 0) return null;
  return (
    <div className="play-card flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-[13px]">
      <div className="text-foreground/80">
        <span className="mr-2 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-accent">
          Exam-tuned
        </span>
        Focusing scenarios on your weakest areas:{" "}
        <span className="font-medium text-accent">{weakestKAs.join(" · ")}</span>
        {passProbability !== null && (
          <span className="ml-2 text-muted-foreground">
            (last exam pass probability {passProbability}%)
          </span>
        )}
      </div>
      <Link to="/exam" className="text-accent hover:underline">
        Take another exam →
      </Link>
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
    <header className="border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto grid max-w-[1400px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary font-black text-primary-foreground">
            PS
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
              ProjectSim
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              PMBOK Project Management Training Simulator
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden text-right sm:block">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Level</div>
            <div className="text-sm font-semibold">{level.name}</div>
          </div>
          <div className="min-w-[120px]">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{xp} XP</span>
              <span>{level.next ? `${level.next} XP` : "MAX"}</span>
            </div>
            <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-surface-strong">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          <Link
            to="/performance"
            className="hidden rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-surface-strong sm:inline-block"
          >
            Performance →
          </Link>
          <Badge className="border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/10">
            🔥 {streak}
          </Badge>
          {userEmail && (
            <div className="hidden text-right md:block">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Signed in</div>
              <div className="max-w-[160px] truncate text-xs text-foreground">{userEmail}</div>
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={onSignOut}
            className="border-border bg-surface text-foreground hover:bg-surface-strong"
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
      <div className="rounded-2xl border border-border/60 bg-surface/60 p-3">
        <div className="mb-2 px-2 text-[11px] uppercase tracking-widest text-muted-foreground">
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
                  active && "bg-primary/15 ring-1 ring-primary/30",
                  !active && "hover:bg-surface/60",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                    done && "bg-emerald-500/90 text-primary-foreground",
                    active && "bg-primary text-primary-foreground",
                    !done && !active && "bg-surface-strong text-foreground/80",
                  )}
                >
                  {done ? "✓" : i + 1}
                </div>
                <div className="min-w-0">
                  <div className={cn("text-sm font-medium", active ? "text-white" : "text-foreground")}>
                    {PHASE_META[p].label}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
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

const CHOICE_ICONS: {
  Icon: React.ComponentType<{ className?: string }>;
  tone: string;
}[] = [
  { Icon: Users2, tone: "bg-[color:var(--color-success)]/12 text-[color:var(--color-success)]" },
  { Icon: FileSearch, tone: "bg-accent/12 text-accent" },
  { Icon: FilePlus2, tone: "bg-[color:var(--color-primary)]/10 text-[color:var(--color-primary)]" },
  { Icon: MessageCircle, tone: "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]" },
];

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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Reset staged selection when scenario changes or a choice is committed
  useEffect(() => {
    setSelectedId(null);
  }, [scenario.id, pendingChoice?.id]);

  const submit = () => {
    const c = scenario.choices.find((x) => x.id === selectedId);
    if (c) onChoose(c);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        <motion.article
          key={scenario.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="play-card overflow-hidden p-6"
        >
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                isEvent
                  ? "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]"
                  : "bg-accent/10 text-accent",
              )}
            >
              {isEvent ? "Random Event" : PHASE_META[scenario.phase].label}
            </span>
            <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] text-foreground/70">
              {meta.processGroup}
            </span>
            <span className="rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] text-foreground/70">
              {meta.knowledgeArea}
            </span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                meta.difficulty === "easy" && "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]",
                meta.difficulty === "medium" && "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]",
                meta.difficulty === "hard" && "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]",
              )}
            >
              {meta.difficulty.toUpperCase()}
            </span>
          </div>
          <h2 className="sr-only">{scenario.title}</h2>
          <WorkplaceNarrative narrative={getScenarioNarrative(scenario)} />

          {consequenceNote && (
            <div className="mt-4 rounded-2xl border border-[color:var(--color-warning)]/25 bg-[color:var(--color-warning)]/8 p-3 text-[13px] text-foreground/85">
              <span className="mr-1 font-semibold uppercase tracking-wider text-[color:var(--color-warning)]">
                Project memory:
              </span>
              {consequenceNote}
            </div>
          )}

          <h3 className="mt-6 text-[18px] font-semibold text-foreground">
            What would you like to do first?
          </h3>

          <div className="mt-4 grid gap-3">
            {scenario.choices.map((c, i) => {
              const committed = pendingChoice?.id === c.id;
              const staged = !pendingChoice && selectedId === c.id;
              const isCorrect = c.id === meta.correctChoiceId;
              const dimmed = pendingChoice && !committed;
              const iconMeta = CHOICE_ICONS[i % CHOICE_ICONS.length];
              const active = committed || staged;
              return (
                <motion.button
                  key={c.id}
                  whileHover={!pendingChoice ? { y: -2 } : undefined}
                  disabled={!!pendingChoice}
                  onClick={() => setSelectedId(c.id)}
                  className={cn(
                    "group flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition",
                    active
                      ? "border-accent bg-accent/[0.08] shadow-[0_6px_20px_rgba(108,99,255,0.12)]"
                      : "border-black/[0.06] bg-white hover:border-accent/50 hover:bg-accent/[0.03]",
                    pendingChoice && isCorrect && !committed &&
                      "border-[color:var(--color-success)]/50 bg-[color:var(--color-success)]/8",
                    dimmed && "opacity-60",
                    !pendingChoice && "cursor-pointer",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition",
                      active
                        ? "border-accent bg-accent"
                        : "border-black/20 bg-white",
                    )}
                  >
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <div
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                      iconMeta.tone,
                    )}
                  >
                    <iconMeta.Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-[15px] font-semibold text-foreground">
                        {c.label}
                      </div>
                      {pendingChoice && isCorrect && (
                        <span className="rounded-full bg-[color:var(--color-success)]/15 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--color-success)]">
                          CORRECT
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[13px] text-muted-foreground">
                      {c.rationale}
                    </div>
                    {committed && <ImpactChips impact={c.impact} />}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {!pendingChoice && (
            <div className="mt-6 flex justify-center">
              <motion.button
                whileHover={selectedId ? { scale: 1.02 } : undefined}
                whileTap={selectedId ? { scale: 0.98 } : undefined}
                onClick={submit}
                disabled={!selectedId}
                className={cn(
                  "rounded-full px-8 py-3 text-[15px] font-semibold transition",
                  selectedId
                    ? "bg-accent text-accent-foreground shadow-[0_10px_25px_rgba(108,99,255,0.35)] hover:opacity-95"
                    : "cursor-not-allowed bg-accent/25 text-accent-foreground/70",
                )}
              >
                Submit Decision
              </motion.button>
            </div>
          )}
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
    <div className="space-y-4 rounded-2xl border border-border bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5">
      {/* Header + verdict */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
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
        <span className="ml-auto rounded-full bg-surface-strong px-2 py-0.5 text-[11px] text-foreground/80">
          +{chosen.xp} XP
        </span>
      </div>

      {/* Correct answer highlight */}
      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-200">
          ✅ Correct Answer — Option {meta.correctChoiceId.toUpperCase()}
        </div>
        <div className="text-sm font-medium text-foreground">{correctChoice.label}</div>
      </div>

      {/* PMI Mindset */}
      <ReviewSection label="PMI Mindset" tone="indigo">
        <p className="text-sm leading-relaxed text-foreground">{meta.explanation}</p>
        <p className="mt-2 text-sm italic leading-relaxed text-foreground/90">
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
                      ? "bg-emerald-400 text-primary-foreground"
                      : c.quality === "poor"
                      ? "bg-rose-500/70 text-primary-foreground"
                      : c.quality === "risky"
                      ? "bg-amber-400 text-primary-foreground"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  {c.id.toUpperCase()}
                </span>
                <span className="font-medium text-foreground">
                  {analysisLead(c, c.id === meta.correctChoiceId)}
                </span>
              </div>
              <p className="ml-7 mt-0.5 text-xs leading-relaxed text-muted-foreground">
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
          <div className="animate-pulse text-sm text-primary/70">
            Analyzing your decision against PMBOK principles…
          </div>
        ) : coachText ? (
          <CoachMarkdown text={coachText} />
        ) : (
          <p className="text-sm text-muted-foreground">Coach is offline — review the analysis above.</p>
        )}
      </ReviewSection>

      {!coachLoading && (
        <div className="flex justify-end">
          <Button
            onClick={onAdvance}
            className="bg-primary text-primary-foreground hover:opacity-90"
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
    indigo: "border-primary/20 bg-primary/[0.04]",
    cyan: "border-primary/20 bg-primary/5",
    amber: "border-amber-400/20 bg-amber-400/[0.05]",
    slate: "border-border bg-surface/60",
  } as const;
  const labelTone = {
    indigo: "text-primary",
    cyan: "text-primary",
    amber: "text-amber-200",
    slate: "text-foreground/80",
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
              ? "border-primary/60 bg-primary/20 font-semibold text-primary"
              : "border-border bg-surface/40 text-muted-foreground",
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
    <div className="space-y-2 text-sm leading-relaxed text-foreground">
      {blocks.map((b, i) => {
        const parts = b.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((p, j) =>
              p.startsWith("**") && p.endsWith("**") ? (
                <strong key={j} className="text-primary">
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
    { label: "Budget", value: metrics.budget, display: `${Math.round(metrics.budget)}%` },
    {
      label: "Schedule",
      value: 50 + metrics.schedule / 2,
      display: scheduleLabel(metrics.schedule),
    },
    { label: "Scope", value: metrics.scope, display: `${Math.round(metrics.scope)}%` },
    {
      label: "Risk",
      value: metrics.risk,
      display: `${Math.round(metrics.risk)}%`,
      invert: true,
    },
    {
      label: "Stakeholders",
      value: metrics.stakeholders,
      display: `${Math.round(metrics.stakeholders)}%`,
    },
    { label: "Team", value: metrics.morale, display: `${Math.round(metrics.morale)}%` },
    { label: "Quality", value: metrics.quality, display: `${Math.round(metrics.quality)}%` },
    {
      label: "Value",
      value: metrics.businessValue,
      display: `${Math.round(metrics.businessValue)}%`,
    },
  ];
  return (
    <div className="play-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[15px] font-semibold text-[color:var(--color-success)]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--color-success)]" />
          Live Project Health
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {items.map((m) => {
          const good = m.invert ? m.value <= 30 : m.value >= 65;
          const bad = m.invert ? m.value >= 65 : m.value <= 30;
          const barColor = good
            ? "bg-[color:var(--color-success)]"
            : bad
              ? "bg-[color:var(--color-destructive)]"
              : "bg-[color:var(--color-warning)]";
          const valueColor = good
            ? "text-[color:var(--color-success)]"
            : bad
              ? "text-[color:var(--color-destructive)]"
              : "text-[color:var(--color-warning)]";
          return (
            <div key={m.label}>
              <div className="text-[13px] font-medium text-muted-foreground">
                {m.label}
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/[0.06]">
                <motion.div
                  initial={false}
                  animate={{ width: `${clamp(m.value)}%` }}
                  transition={{ duration: 0.6 }}
                  className={cn("h-full rounded-full", barColor)}
                />
              </div>
              <div className={cn("mt-1.5 text-[15px] font-bold", valueColor)}>
                {m.display}
              </div>
            </div>
          );
        })}
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
    <div className="rounded-2xl border border-border/60 bg-surface/60 p-4">
      <div className="mb-3 text-[11px] uppercase tracking-widest text-muted-foreground">Badges</div>
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
                  : "border-border/60 bg-surface/40 text-muted-foreground/70 grayscale",
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
    <div className="rounded-2xl border border-border/60 bg-surface/60 p-4">
      <div className="mb-3 text-[11px] uppercase tracking-widest text-muted-foreground">Decision Log</div>
      <ol className="space-y-2">
        {decisions.slice(-6).reverse().map((d, i) => (
          <li key={`${d.scenarioId}-${i}`} className="flex items-start gap-2 text-xs">
            <span
              className={cn(
                "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                d.quality === "excellent" && "bg-emerald-400",
                d.quality === "good" && "bg-primary",
                d.quality === "risky" && "bg-amber-400",
                d.quality === "poor" && "bg-rose-500",
              )}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-foreground">{d.scenarioTitle}</span>
                {d.correct && (
                  <span className="rounded bg-emerald-400/15 px-1 text-[9px] font-semibold text-emerald-200">
                    ✓
                  </span>
                )}
              </div>
              <div className="truncate text-muted-foreground">{d.choiceLabel}</div>
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
      className="overflow-hidden rounded-2xl border border-border bg-surface/60 p-8"
    >
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-[0.3em] text-primary">
          Certification of Simulation
        </div>
        <h2 className="mt-2 text-3xl font-black tracking-tight">Project Simulation Complete</h2>
        <p className="mt-1 text-foreground/80">
          Level achieved: <strong className="text-white">{level}</strong>
        </p>
        <div className="mx-auto mt-6 grid h-40 w-40 place-items-center rounded-full border-4 border-primary/40 bg-primary-soft">
          <div>
            <div className="text-5xl font-black text-white">{score}</div>
            <div className="text-xs text-foreground/80">out of 100</div>
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
          <ul className="space-y-1 text-sm text-foreground">
            {went_well.map((w) => (
              <li key={w}>✓ {w}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-4">
          <div className="mb-2 text-sm font-semibold text-rose-200">Areas for improvement</div>
          <ul className="space-y-1 text-sm text-foreground">
            {went_wrong.map((w) => (
              <li key={w}>• {w}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          onClick={onRestart}
          className="bg-primary px-6 text-primary-foreground hover:opacity-90"
        >
          Run another project →
        </Button>
      </div>
    </motion.div>
  );
}

function ReportBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 text-[11px] uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ReportRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground/80">{k}</span>
      <span className="font-semibold text-white">{v}</span>
    </div>
  );
}

// Silence unused import warnings when the tree-shaker is aggressive.
void Progress;
void Link;
