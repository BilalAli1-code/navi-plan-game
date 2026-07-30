import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  CalendarDays,
  Target,
  Zap,
  ShieldAlert,
  Users,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Bell,
  Filter,
  Clock,
} from "lucide-react";
import { useSim } from "@/lib/sim/store";
import { getCaseRef, stakeholdersFor } from "@/lib/sim/cases";
import { cn } from "@/lib/utils";

type FeedEvent = {
  id: string;
  icon: React.ReactNode;
  title: string;
  body?: string;
  time: string;
  sortKey: number; // epoch ms for chronological sorting
  category: "decision" | "email" | "phase" | "metric" | "xp" | "meeting";
  color: string;
  urgent?: boolean;
};

function timeAgo(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ActivityFeed() {
  const { state } = useSim();
  const stakes = stakeholdersFor(state.caseId);
  const [filter, setFilter] = useState<"all" | "decisions" | "alerts" | "emails">("all");

  const events: FeedEvent[] = [];

  // Phase events
  const phaseOrder = [
    "Tailoring",
    "Initiation",
    "Planning",
    "Execution",
    "Monitoring",
    "Closing",
    "Complete",
  ];
  const currentPhaseIdx = phaseOrder.indexOf(state.phase);
  const now = Date.now();
  for (let i = 0; i <= Math.min(currentPhaseIdx, 5); i++) {
    const ph = phaseOrder[i];
    events.push({
      id: `phase-${ph}`,
      icon: <CheckCircle2 className="h-4 w-4" />,
      title: `${ph} phase ${i < currentPhaseIdx ? "completed" : "started"}`,
      body: i === 0 ? `Delivery approach: ${state.approach ?? "not yet selected"}` : undefined,
      time: `Day ${Math.min(i + 1, 7)}`,
      sortKey: now - (currentPhaseIdx - i) * 86_400_000,
      category: "phase",
      color: i < currentPhaseIdx ? "text-[color:var(--color-success)]" : "text-accent",
    });
  }

  // Decision log events
  state.log.slice(-10).forEach((l) => {
    const dec = state.decisions.find((d) => d.id === l.decisionId);
    const q = l.quality;
    events.push({
      id: `decision-${l.decisionId}`,
      icon: <Target className="h-4 w-4" />,
      title: `Decision: ${dec?.title ?? l.decisionId}`,
      body: `${l.quality} · ${l.correct ? "PMI-aligned" : "not aligned"} · ${l.atPhase}`,
      time: timeAgo(l.timestamp),
      sortKey: l.timestamp,
      category: "decision",
      color:
        q === "excellent"
          ? "text-accent"
          : q === "good"
            ? "text-[color:var(--color-success)]"
            : q === "risky"
              ? "text-[color:var(--color-warning)]"
              : "text-[color:var(--color-destructive)]",
    });
  });

  // Email activity
  state.emails
    .filter((e) => e.read)
    .slice(-5)
    .forEach((email) => {
      const sender = stakes.find((s) => s.id === email.from);
      events.push({
        id: `email-read-${email.id}`,
        icon: <Mail className="h-4 w-4" />,
        title: `Email read: ${email.subject}`,
        body: `From ${sender?.name ?? "Unknown"}`,
        time: email.receivedAt,
        sortKey: now - 3_600_000,
        category: "email",
        color: "text-blue-400",
      });
    });

  // XP milestones
  if (state.xp >= 25) {
    events.push({
      id: "xp-25",
      icon: <Zap className="h-4 w-4" />,
      title: "25 XP earned",
      body: "First excellent decision!",
      time: "Earlier",
      sortKey: now - 7_200_000,
      category: "xp",
      color: "text-accent",
    });
  }
  if (state.xp >= 100) {
    events.push({
      id: "xp-100",
      icon: <Zap className="h-4 w-4" />,
      title: "100 XP milestone reached",
      body: "PM Associate tier unlocked",
      time: "Earlier",
      sortKey: now - 7_100_000,
      category: "xp",
      color: "text-accent",
    });
  }

  // Metric alerts
  if (state.metrics.risk < 60) {
    events.push({
      id: "metric-risk",
      icon: <ShieldAlert className="h-4 w-4" />,
      title: "Risk posture alert",
      body: `Risk score dropped to ${Math.round(state.metrics.risk)}% — review risk register`,
      time: "Recent",
      sortKey: now,
      category: "metric",
      color: "text-[color:var(--color-destructive)]",
      urgent: true,
    });
  }
  if (state.metrics.morale < 65) {
    events.push({
      id: "metric-morale",
      icon: <Users className="h-4 w-4" />,
      title: "Team morale warning",
      body: `Morale at ${Math.round(state.metrics.morale)}% — team engagement needed`,
      time: "Recent",
      sortKey: now,
      category: "metric",
      color: "text-[color:var(--color-warning)]",
      urgent: true,
    });
  }
  if (state.metrics.budget < 65) {
    events.push({
      id: "metric-budget",
      icon: <AlertTriangle className="h-4 w-4" />,
      title: "Budget variance detected",
      body: `Budget health at ${Math.round(state.metrics.budget)}% — report needed`,
      time: "Recent",
      sortKey: now,
      category: "metric",
      color: "text-[color:var(--color-destructive)]",
      urgent: true,
    });
  }

  // Meeting activity
  state.meetings.slice(0, 3).forEach((mtg) => {
    events.push({
      id: `mtg-${mtg.id}`,
      icon: <CalendarDays className="h-4 w-4" />,
      title: mtg.title,
      body: `${mtg.attendees.length} attendees · ${mtg.agenda.length} agenda items`,
      time: mtg.time,
      sortKey: now - 1_800_000,
      category: "meeting",
      color: "text-purple-400",
    });
  });

  // Sort: urgent items first within each recency bucket, then by timestamp descending
  const sorted = events.sort((a, b) => {
    if (a.urgent && !b.urgent) return -1;
    if (b.urgent && !a.urgent) return 1;
    return b.sortKey - a.sortKey;
  });

  const filtered = sorted.filter((ev) => {
    if (filter === "decisions") return ev.category === "decision" || ev.category === "xp";
    if (filter === "alerts") return ev.category === "metric";
    if (filter === "emails") return ev.category === "email";
    return true;
  });

  const urgentCount = sorted.filter((ev) => ev.urgent).length;
  const categoryLabel: Record<FeedEvent["category"], string> = {
    decision: "Decision",
    email: "Email",
    phase: "Phase",
    metric: "Alert",
    xp: "Achievement",
    meeting: "Meeting",
  };
  const categoryBadgeCls: Record<FeedEvent["category"], string> = {
    decision: "bg-accent/10 text-accent",
    email: "bg-blue-500/10 text-blue-400",
    phase: "bg-[color:var(--color-success)]/10 text-[color:var(--color-success)]",
    metric: "bg-[color:var(--color-destructive)]/10 text-[color:var(--color-destructive)]",
    xp: "bg-yellow-500/10 text-yellow-400",
    meeting: "bg-purple-500/10 text-purple-400",
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-accent" />
          <span className="text-[13px] font-semibold text-foreground">
            Activity & Notifications
          </span>
        </div>
        {urgentCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-[color:var(--color-destructive)]/15 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--color-destructive)]">
            <AlertTriangle className="h-3 w-3" />
            {urgentCount} alerts
          </span>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground">{sorted.length} events</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
        {(["all", "alerts", "decisions", "emails"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-[11px] capitalize transition",
              filter === f
                ? "bg-accent/15 text-accent font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] py-12 text-center text-[12px] text-muted-foreground">
          <Bell className="mx-auto mb-3 h-6 w-6 opacity-30" />
          No activity in this category yet.
        </div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence initial={false}>
            {filtered.map((ev, i) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ delay: i * 0.02 }}
                className={cn(
                  "flex items-start gap-3 rounded-xl border px-4 py-3",
                  ev.urgent
                    ? "border-[color:var(--color-destructive)]/20 bg-[color:var(--color-destructive)]/[0.04]"
                    : "border-white/[0.06] bg-white/[0.02]",
                )}
              >
                <span className={cn("mt-0.5 shrink-0", ev.color)}>{ev.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[13px] font-medium text-foreground/90">{ev.title}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                        categoryBadgeCls[ev.category],
                      )}
                    >
                      {categoryLabel[ev.category]}
                    </span>
                    {ev.urgent && (
                      <span className="rounded-full bg-[color:var(--color-destructive)]/15 px-1.5 py-0.5 text-[9px] font-semibold text-[color:var(--color-destructive)]">
                        Urgent
                      </span>
                    )}
                  </div>
                  {ev.body && (
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{ev.body}</div>
                  )}
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">{ev.time}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
