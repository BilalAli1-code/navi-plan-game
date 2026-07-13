import { useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Mail,
  CalendarDays,
  FileText,
  Users,
  Sparkles,
  RotateCcw,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useSim } from "@/lib/sim/store";
import { getCaseRef } from "@/lib/sim/cases";
import { cn } from "@/lib/utils";
import { Inbox } from "./Inbox";
import { Meetings } from "./Meetings";
import { Documents } from "./Documents";
import { Stakeholders } from "./Stakeholders";
import { Dashboard } from "./Dashboard";
import { DecisionPanel } from "./DecisionPanel";
import { TailoringWorkshop } from "./TailoringWorkshop";
import { DayDashboard } from "./DayDashboard";

type Tab = "program" | "dashboard" | "inbox" | "meetings" | "documents" | "stakeholders";

export function WorkplaceShell({ mayaSlot }: { mayaSlot?: ReactNode }) {
  const { state, activeDecision, setActiveDecision, submitTailoring, reset, saveStatus, hydrating, completeActivity, days } = useSim();
  const c = getCaseRef(state.caseId);
  const [tab, setTab] = useState<Tab>("program");
  const navigate = useNavigate();

  const unread = state.emails.filter((e) => !e.read).length;

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: "program", label: "Program", icon: GraduationCap },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inbox", label: "Inbox", icon: Mail, badge: unread },
    { id: "meetings", label: "Meetings", icon: CalendarDays },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "stakeholders", label: "Stakeholders", icon: Users },
  ];

  // Auto-mark activities from behavioral signals so learners aren't forced to
  // check boxes for things they've clearly done.
  const currentDayRow = days.find((d) => d.day_number === state.currentDay);
  useEffect(() => {
    if (!currentDayRow) return;
    // Reading any email marks the workplace-review activity.
    if (!currentDayRow.workplace_activities_completed && state.emails.some((e) => e.read)) {
      void completeActivity(state.currentDay, "workplace");
    }
    // Any decision in the log satisfies the decisions activity.
    if (!currentDayRow.decisions_completed && state.log.some((l) => l.atPhase === state.phase)) {
      void completeActivity(state.currentDay, "decisions");
    }
    // Completing Tailoring on Day 1 also satisfies the learning activity.
    if (state.currentDay === 1 && !currentDayRow.learning_completed && state.approach) {
      void completeActivity(1, "learning");
    }
  }, [currentDayRow, state.emails, state.log, state.phase, state.currentDay, state.approach, completeActivity]);


  function openDecision(id: string) {
    setActiveDecision(id);
  }

  const phaseIdx = ["Tailoring", "Initiation", "Planning", "Execution", "Monitoring", "Closing", "Complete"].indexOf(state.phase);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-4 p-4 lg:p-6">
        {/* Sidebar */}
        <aside className="hidden w-[240px] shrink-0 flex-col rounded-3xl border border-white/10 bg-white/[0.02] p-4 lg:flex">
          <Link to="/play" className="mb-4 flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            All simulations
          </Link>
          <div className="mb-2 flex items-center gap-2">
            <div className="text-[24px]">{c.emoji}</div>
            <div className="min-w-0">
              <div className="truncate text-[14px] font-bold text-foreground">{c.projectName}</div>
              <div className="truncate text-[11px] text-muted-foreground">{c.industry}</div>
            </div>
          </div>
          <div className="mt-2 rounded-xl bg-white/[0.04] p-3 text-[11px]">
            <div className="flex justify-between text-muted-foreground">
              <span>Sponsor</span>
              <span className="text-foreground/80">{c.sponsor.split(",")[0]}</span>
            </div>
            <div className="mt-1 flex justify-between text-muted-foreground">
              <span>Budget</span>
              <span className="text-foreground/80">{c.budget}</span>
            </div>
            <div className="mt-1 flex justify-between text-muted-foreground">
              <span>Duration</span>
              <span className="text-foreground/80">{c.duration}</span>
            </div>
            {state.approach && (
              <div className="mt-1 flex justify-between text-muted-foreground">
                <span>Approach</span>
                <span className="text-accent">{state.approach}</span>
              </div>
            )}
          </div>

          <nav className="mt-4 space-y-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[13px] transition",
                  tab === t.id
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground/70 hover:bg-white/[0.05] hover:text-foreground",
                )}
              >
                <t.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{t.label}</span>
                {t.badge ? (
                  <span className="rounded-full bg-[color:var(--color-destructive)] px-1.5 text-[10px] font-bold text-white">
                    {t.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-1 border-t border-white/10 pt-3">
            <button
              onClick={() => {
                reset();
                setTab("program");
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[12px] text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restart simulation
            </button>
          </div>
        </aside>

        {/* Main + Maya */}
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {/* Top bar */}
            <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:flex sm:items-center">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-accent">
                  Phase {Math.max(0, phaseIdx)} · {state.phase}
                </div>
                <h1 className="mt-0.5 truncate text-[22px] font-bold text-foreground">{c.projectName}</h1>
              </div>
              <div className="flex items-center gap-3">
                <SaveIndicator status={hydrating ? "saving" : saveStatus} />
                <HealthPill value={state.metrics.health} />
                <span className="hidden items-center gap-1 rounded-full bg-accent/15 px-3 py-1.5 text-[12px] font-semibold text-accent sm:inline-flex">
                  <Sparkles className="h-3.5 w-3.5" />
                  {state.xp} XP
                </span>
              </div>
              <div className="col-span-2 flex w-full gap-1">
                {["Tailoring", "Initiation", "Planning", "Execution", "Monitoring", "Closing"].map((p, i) => (
                  <div
                    key={p}
                    className={cn(
                      "h-1 flex-1 rounded-full",
                      i < phaseIdx
                        ? "bg-[color:var(--color-success)]"
                        : i === phaseIdx
                          ? "bg-accent"
                          : "bg-white/10",
                    )}
                  />
                ))}
              </div>
            </header>

            {/* Mobile tabs */}
            <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1 lg:hidden">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[12px]",
                    tab === t.id ? "bg-accent text-accent-foreground" : "text-foreground/70",
                  )}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                  {t.badge ? <span className="rounded-full bg-[color:var(--color-destructive)] px-1 text-[9px] text-white">{t.badge}</span> : null}
                </button>
              ))}
            </div>

            <main className="min-h-[540px] rounded-3xl border border-white/10 bg-white/[0.02] p-5">
              {state.phase === "Complete" ? (
                <CompleteView />
              ) : state.phase === "Tailoring" && tab !== "program" ? (
                <TailoringWorkshop
                  recommendedApproach={c.recommendedApproach}
                  industryName={c.industry}
                  projectName={c.projectName}
                  onSubmit={submitTailoring}
                />
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                  >
                    {tab === "program" && <DayDashboard onOpenTab={(t) => setTab(t)} />}
                    {tab === "dashboard" && <Dashboard />}
                    {tab === "inbox" && <Inbox onOpenDecision={openDecision} />}
                    {tab === "meetings" && <Meetings onOpenDecision={openDecision} />}
                    {tab === "documents" && <Documents />}
                    {tab === "stakeholders" && <Stakeholders />}
                  </motion.div>
                </AnimatePresence>
              )}
            </main>

            {activeDecision && (
              <div className="rounded-3xl">
                <DecisionPanel decision={activeDecision} />
              </div>
            )}

            {state.lastConsequence && !activeDecision && (
              <motion.div
                key={state.lastConsequence}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-accent/30 bg-accent/[0.08] p-4 text-[13px] text-foreground/85"
              >
                <span className="mr-2 font-semibold text-accent">Consequence:</span>
                {state.lastConsequence}
              </motion.div>
            )}
          </div>

          {/* Maya (desktop) */}
          <aside className="hidden w-[360px] shrink-0 xl:block">{mayaSlot}</aside>
        </div>
      </div>
    </div>
  );
}

function SaveIndicator({ status }: { status: "idle" | "saving" | "saved" | "error" | "offline" }) {
  if (status === "idle") return null;
  const map = {
    saving: { label: "Saving…", cls: "text-muted-foreground" },
    saved: { label: "Saved", cls: "text-[color:var(--color-success)]" },
    offline: { label: "Offline — will retry", cls: "text-[color:var(--color-warning)]" },
    error: { label: "Save failed", cls: "text-[color:var(--color-destructive)]" },
  } as const;
  const s = map[status];
  return <span className={cn("hidden text-[11px] font-medium sm:inline", s.cls)}>{s.label}</span>;
}

function HealthPill({ value }: { value: number }) {
  const tone =
    value >= 70
      ? "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]"
      : value >= 50
        ? "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]"
        : "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]";
  const label = value >= 70 ? "Healthy" : value >= 50 ? "Watch" : "At risk";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold", tone)}>
      <span className="h-2 w-2 rounded-full bg-current" />
      {label} · {value}%
    </span>
  );
}

function CompleteView() {
  const { state, reset } = useSim();
  const c = getCaseRef(state.caseId);
  const correct = state.log.filter((l) => l.correct).length;
  return (
    <div className="text-center">
      <div className="text-5xl">🎉</div>
      <h2 className="mt-3 text-[26px] font-bold">Project closed: {c.projectName}</h2>
      <p className="mt-2 text-muted-foreground">
        You made {state.log.length} decisions ({correct} PMI-aligned) and earned {state.xp} XP.
      </p>
      <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3 text-left">
        {(["health", "budget", "schedule", "quality", "trust", "morale"] as const).map((k) => (
          <div key={k} className="rounded-xl bg-white/[0.05] p-3">
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{k}</div>
            <div className="text-[20px] font-bold text-foreground">{state.metrics[k]}%</div>
          </div>
        ))}
      </div>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-accent px-6 py-3 text-[13px] font-semibold text-accent-foreground hover:opacity-90"
      >
        Run this simulation again
      </button>
    </div>
  );
}
