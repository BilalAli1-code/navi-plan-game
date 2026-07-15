import { motion } from "framer-motion";
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
  category: "decision" | "email" | "phase" | "metric" | "xp" | "meeting";
  color: string;
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
  const c = getCaseRef(state.caseId);

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
  for (let i = 0; i <= Math.min(currentPhaseIdx, 5); i++) {
    const ph = phaseOrder[i];
    events.push({
      id: `phase-${ph}`,
      icon: <CheckCircle2 className="h-4 w-4" />,
      title: `${ph} phase ${i < currentPhaseIdx ? "completed" : "started"}`,
      body: i === 0 ? `Delivery approach: ${state.approach ?? "not yet selected"}` : undefined,
      time: `Day ${Math.min(i + 1, 7)}`,
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
      category: "metric",
      color: "text-[color:var(--color-destructive)]",
    });
  }
  if (state.metrics.morale < 65) {
    events.push({
      id: "metric-morale",
      icon: <Users className="h-4 w-4" />,
      title: "Team morale warning",
      body: `Morale at ${Math.round(state.metrics.morale)}% — team engagement needed`,
      time: "Recent",
      category: "metric",
      color: "text-[color:var(--color-warning)]",
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
      category: "meeting",
      color: "text-purple-400",
    });
  });

  // Sort by recency (decisions with timestamps first, then others)
  const sorted = events.sort((a, b) => {
    if (a.category === "decision" && b.category !== "decision") return -1;
    if (b.category === "decision" && a.category !== "decision") return 1;
    return 0;
  });

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
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-accent" />
        <span className="text-[13px] font-semibold text-foreground">Live Activity Feed</span>
        <span className="ml-auto text-[11px] text-muted-foreground">{sorted.length} events</span>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] py-12 text-center text-[12px] text-muted-foreground">
          No activity yet. Start making decisions to see events appear here.
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((ev, i) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
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
                </div>
                {ev.body && (
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{ev.body}</div>
                )}
              </div>
              <span className="shrink-0 text-[10px] text-muted-foreground">{ev.time}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
