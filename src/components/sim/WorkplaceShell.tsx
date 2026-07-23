import { useState, type ReactNode } from "react";
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
  MessageSquare,
  Activity,
  Bell,
  Briefcase,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useSim } from "@/lib/sim/store";
import { getCaseRef } from "@/lib/sim/cases";
import { visibleEmails } from "@/lib/sim/visibility";
import { cn } from "@/lib/utils";
import { Inbox } from "./Inbox";
import { Meetings } from "./Meetings";
import { Documents } from "./Documents";
import { Stakeholders } from "./Stakeholders";
import { Dashboard } from "./Dashboard";
import { DecisionPanel } from "./DecisionPanel";
import { TailoringWorkshop } from "./TailoringWorkshop";
import { CompetencyDashboard } from "./CompetencyDashboard";
import { MissionControl } from "./MissionControl";
import { ChatPanel } from "./ChatPanel";
import { ActivityFeed } from "./ActivityFeed";
import { PMToolsPanel } from "./PMToolsPanel";

type Tab =
  | "mission"
  | "tailoring"
  | "dashboard"
  | "mastery"
  | "inbox"
  | "chat"
  | "meetings"
  | "documents"
  | "stakeholders"
  | "activity"
  | "tools";

type NavGroup = {
  label: string;
  items: {
    id: Tab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }[];
};

export function WorkplaceShell({ mayaSlot }: { mayaSlot?: ReactNode }) {
  const {
    state,
    activeDecision,
    setActiveDecision,
    submitTailoring,
    reset,
    saveStatus,
    hydrating,
    projection,
    dispatchLearnerAction,
  } = useSim();
  const c = getCaseRef(state.caseId);
  const [tab, setTab] = useState<Tab>("mission");

  function selectTab(next: Tab) {
    setTab(next);
    // Opening a Learning surface counts as completing the day's learning activity.
    if (next === "mastery" || next === "dashboard") {
      void dispatchLearnerAction({ type: "tab.open.learning" }).catch(() => {});
    }
  }
  const navigate = useNavigate();

  // Chapter-gated: only count emails available in the current chapter so the
  // sidebar badge stays honest with what the Inbox actually shows.
  const gatedEmails = visibleEmails(state);
  const unread = gatedEmails.filter((e) => !e.read).length;
  const urgentAlerts =
    (state.metrics.risk < 55 ? 1 : 0) +
    (state.metrics.morale < 60 ? 1 : 0) +
    (state.metrics.budget < 65 ? 1 : 0);

  const navGroups: NavGroup[] = [
    {
      label: "Workspace",
      items: [
        {
          id: "mission",
          label: "Mission Control",
          icon: LayoutDashboard,
          badge: urgentAlerts > 0 ? urgentAlerts : undefined,
        },
        { id: "inbox", label: "Inbox", icon: Mail, badge: unread || undefined },
        { id: "chat", label: "Team Chat", icon: MessageSquare },
        { id: "meetings", label: "Meetings", icon: CalendarDays },
        { id: "documents", label: "Documents", icon: FileText },
        { id: "stakeholders", label: "Stakeholders", icon: Users },
        { id: "tools", label: "PM Tools", icon: Briefcase },
        { id: "activity", label: "Notifications", icon: Bell },
      ],
    },
    {
      label: "Learning",
      items: [
        { id: "dashboard", label: "Project Metrics", icon: Activity },
        { id: "mastery", label: "PMBOK Mastery", icon: Sparkles },
      ],
    },
  ];

  function openDecision(id: string) {
    setActiveDecision(id);
  }
  const phaseIdx = projection.phase.currentIndex;
  const allTabs = navGroups.flatMap((g) => g.items);

  if (hydrating) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto flex min-h-screen max-w-[1800px] animate-pulse gap-0 lg:gap-4 lg:p-4">
          {/* Sidebar skeleton */}
          <aside className="hidden w-[220px] shrink-0 lg:block">
            <div className="sticky top-4 rounded-3xl border border-white/10 bg-white/[0.02] p-3 space-y-3">
              <div className="h-7 w-3/4 rounded-xl bg-white/[0.05]" />
              <div className="h-16 rounded-xl bg-white/[0.05]" />
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className="h-8 rounded-xl bg-white/[0.04]" />
              ))}
            </div>
          </aside>
          {/* Content skeleton */}
          <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-0">
            <div className="h-16 rounded-2xl border border-white/10 bg-white/[0.02]" />
            <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 rounded-2xl bg-white/[0.04]" />
                ))}
              </div>
              <div className="h-48 rounded-2xl bg-white/[0.04]" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-36 rounded-2xl bg-white/[0.04]" />
                <div className="h-36 rounded-2xl bg-white/[0.04]" />
              </div>
            </div>
          </div>
          {/* Right panel skeleton */}
          <aside className="hidden w-[340px] shrink-0 xl:block">
            <div className="sticky top-4 h-[500px] rounded-3xl border border-white/10 bg-white/[0.02]" />
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1800px] gap-0 lg:gap-4 lg:p-4">
        {/* ── Left Sidebar ─────────────────────────────────────────────── */}
        <aside className="hidden w-[220px] shrink-0 lg:block">
          <div className="sticky top-4 flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.02] p-3">
            <Link
              to="/play"
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-[11px] text-muted-foreground transition hover:bg-white/[0.05] hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All simulations
            </Link>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
              <div className="flex items-center gap-2">
                <div className="text-[22px]">{c.emoji}</div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold text-foreground">
                    {c.projectName}
                  </div>
                  <div className="truncate text-[10px] text-muted-foreground">{c.industry}</div>
                </div>
              </div>
              <div className="mt-2 space-y-1 text-[10px]">
                <div className="flex justify-between text-muted-foreground">
                  <span>Sponsor</span>
                  <span className="text-foreground/80">{c.sponsor.split(",")[0]}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Budget</span>
                  <span className="text-foreground/80">{c.budget}</span>
                </div>
                {state.approach && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Approach</span>
                    <span className="text-accent">{state.approach}</span>
                  </div>
                )}
              </div>
            </div>

            {navGroups.map((group) => (
              <div key={group.label}>
                <div className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectTab(item.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[12px] transition",
                        tab === item.id
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground/65 hover:bg-white/[0.05] hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-full bg-[color:var(--color-destructive)] px-1.5 text-[9px] font-bold text-white">
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="border-t border-white/[0.06] pt-2">
              <button
                onClick={() => {
                  reset();
                  setTab("mission");
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-[11px] text-muted-foreground transition hover:bg-white/[0.05] hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restart simulation
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main Content ──────────────────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 lg:p-0">
          {/* Top command bar */}
          <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-background/90 px-4 py-3 backdrop-blur-xl lg:top-4 lg:rounded-3xl">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-accent">
                  Phase {Math.max(0, phaseIdx)} · {projection.phase.current}
                </div>
                <SaveIndicator status={hydrating ? "saving" : saveStatus} />
              </div>
              <h1 className="mt-0.5 truncate text-[18px] font-bold text-foreground lg:text-[20px]">
                {c.projectName}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <HealthPill value={state.metrics.health} />
              <span className="hidden items-center gap-1 rounded-full bg-accent/15 px-3 py-1.5 text-[11px] font-semibold text-accent sm:inline-flex">
                <Sparkles className="h-3 w-3" />
                {state.xp} XP
              </span>
              {unread > 0 && (
                <button
                  onClick={() => setTab("inbox")}
                  className="flex items-center gap-1.5 rounded-full bg-[color:var(--color-destructive)]/15 px-3 py-1.5 text-[11px] font-semibold text-[color:var(--color-destructive)] transition hover:bg-[color:var(--color-destructive)]/25"
                >
                  <Mail className="h-3 w-3" />
                  {unread} unread
                </button>
              )}
            </div>

            <div className="flex w-full gap-1">
              {["Tailoring", "Initiation", "Planning", "Execution", "Monitoring", "Closing"].map(
                (p, i) => (
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
                    title={p}
                  />
                ),
              )}
            </div>
          </header>

          {/* Mobile nav */}
          <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] p-1 lg:hidden">
            {allTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-2 text-[11px]",
                  tab === t.id ? "bg-accent text-accent-foreground" : "text-foreground/65",
                )}
              >
                <t.icon className="h-3 w-3" />
                {t.label}
                {t.badge ? (
                  <span className="rounded-full bg-[color:var(--color-destructive)] px-1 text-[9px] text-white">
                    {t.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {/* Main panel */}
          <main className="min-h-[540px] rounded-2xl border border-white/10 bg-white/[0.02] p-4 lg:rounded-3xl lg:p-5">
            {state.phase === "Complete" ? (
              <CompleteView />
            ) : (

              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                >
                  {tab === "mission" && (
                    <MissionControl
                      onOpenTab={(t) => setTab(t as Tab)}
                      onOpenDecision={openDecision}
                    />
                  )}
                  {tab === "dashboard" && <Dashboard onOpenDecision={openDecision} />}
                  {tab === "mastery" && <CompetencyDashboard />}
                  {tab === "inbox" && <Inbox onOpenDecision={openDecision} />}
                  {tab === "chat" && <ChatPanel onOpenDecision={openDecision} />}
                  {tab === "meetings" && <Meetings onOpenDecision={openDecision} />}
                  {tab === "documents" && <Documents />}
                  {tab === "stakeholders" && <Stakeholders />}
                  {tab === "activity" && <ActivityFeed />}
                  {tab === "tools" && <PMToolsPanel />}
                </motion.div>
              </AnimatePresence>
            )}
          </main>

          {activeDecision && (
            <div className="rounded-2xl lg:rounded-3xl">
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

        {/* ── Right Maya Panel (desktop) ────────────────────────────────── */}
        <aside className="hidden w-[340px] shrink-0 xl:block">{mayaSlot}</aside>
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
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold",
        tone,
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {label} · {value}%
    </span>
  );
}

function CompleteView() {
  const { state, reset, projection } = useSim();
  const c = getCaseRef(state.caseId);
  const { total, correct } = projection.decisions;
  return (
    <div className="text-center">
      <div className="text-5xl">🎉</div>
      <h2 className="mt-3 text-[26px] font-bold">Project closed: {c.projectName}</h2>
      <p className="mt-2 text-muted-foreground">
        You made {total} decisions ({correct} PMI-aligned) and earned {state.xp} XP.
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
