import { motion } from "framer-motion";
import { Clock, Mail, CalendarDays, AlertTriangle, Zap, ChevronRight } from "lucide-react";
import { useSim } from "@/lib/sim/store";
import { getCaseRef, stakeholdersFor } from "@/lib/sim/cases";
import { getDay } from "@/lib/sim/days";
import { cn } from "@/lib/utils";

type ScenarioEvent = {
  id: string;
  time: string;
  type: "email" | "meeting" | "alert" | "milestone" | "event";
  title: string;
  from?: string;
  priority: "urgent" | "normal" | "info";
  actionTab?: string;
  read?: boolean;
};

const TYPE_ICON = {
  email: Mail,
  meeting: CalendarDays,
  alert: AlertTriangle,
  milestone: Zap,
  event: Clock,
};

const PRIORITY_STYLE = {
  urgent: {
    border: "border-[color:var(--color-destructive)]/30",
    bg: "bg-[color:var(--color-destructive)]/[0.05]",
    badge: "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]",
    icon: "text-[color:var(--color-destructive)]",
  },
  normal: {
    border: "border-white/10",
    bg: "bg-white/[0.02]",
    badge: "bg-accent/10 text-accent",
    icon: "text-accent",
  },
  info: {
    border: "border-white/[0.06]",
    bg: "bg-white/[0.01]",
    badge: "bg-white/[0.08] text-muted-foreground",
    icon: "text-muted-foreground",
  },
};

// Derive day-of-week label for current sim day
function getDayLabel(simDay: number): string {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return days[(simDay - 1) % 7];
}

// Generate scenario events from simulation state
function buildScenarioEvents(
  state: ReturnType<typeof useSim>["state"],
  caseRef: ReturnType<typeof getCaseRef>,
): ScenarioEvent[] {
  const stakes = stakeholdersFor(state.caseId);
  const dayLabel = getDayLabel(state.currentDay);
  const events: ScenarioEvent[] = [];

  // Day opening event
  const day = getDay(state.currentDay);
  events.push({
    id: `day-${state.currentDay}-open`,
    time: `${dayLabel} 8:00 AM`,
    type: "event",
    title: `Day ${state.currentDay}: ${day.title}`,
    priority: "info",
  });

  // Unread emails → urgent items
  const unreadEmails = state.emails.filter((e) => !e.read);
  unreadEmails.slice(0, 3).forEach((email) => {
    const sender = stakes.find((s) => s.id === email.from);
    const isUrgent =
      email.subject.toLowerCase().includes("urgent") ||
      email.subject.toLowerCase().includes("escalat") ||
      email.subject.toLowerCase().includes("critical") ||
      email.subject.toLowerCase().includes("concern");
    events.push({
      id: `email-${email.id}`,
      time: `${dayLabel} ${unreadEmails.indexOf(email) > 1 ? "9" : "8"}:${15 + unreadEmails.indexOf(email) * 12} AM`,
      type: "email",
      title: email.subject,
      from: sender?.name ?? "Unknown",
      priority: isUrgent ? "urgent" : "normal",
      actionTab: "inbox",
      read: email.read,
    });
  });

  // Upcoming meetings
  const upcomingMeetings = state.meetings.slice(0, 2);
  upcomingMeetings.forEach((mtg, i) => {
    events.push({
      id: `mtg-${mtg.id}`,
      time: `${dayLabel} ${10 + i}:00 AM`,
      type: "meeting",
      title: mtg.title,
      from: mtg.attendees
        .map((id) => stakes.find((s) => s.id === id)?.name.split(" ")[0] ?? id)
        .join(", "),
      priority: "normal",
      actionTab: "meetings",
    });
  });

  // Phase-based alerts
  if (state.metrics.risk < 55) {
    events.push({
      id: "alert-risk",
      time: `${dayLabel} 11:30 AM`,
      type: "alert",
      title: `Risk posture below threshold (${Math.round(state.metrics.risk)}%)`,
      priority: "urgent",
      actionTab: "tools",
    });
  }
  if (state.metrics.morale < 60) {
    events.push({
      id: "alert-morale",
      time: `${dayLabel} 2:00 PM`,
      type: "alert",
      title: "Team morale concern — engineers reported stress",
      priority: "urgent",
      actionTab: "stakeholders",
    });
  }
  if (state.metrics.budget < 65) {
    events.push({
      id: "alert-budget",
      time: `${dayLabel} 3:30 PM`,
      type: "alert",
      title: `Budget variance — ${caseRef.sponsor.split(",")[0]} requesting update`,
      priority: "urgent",
      actionTab: "reports",
    });
  }

  // Decisions pending
  const pendingDecisions = state.emails.filter((e) => e.unlocksDecisionId && !e.read);
  if (pendingDecisions.length > 0) {
    events.push({
      id: "pending-decisions",
      time: `${dayLabel} 4:15 PM`,
      type: "milestone",
      title: `${pendingDecisions.length} decision${pendingDecisions.length > 1 ? "s" : ""} awaiting your action`,
      priority: "normal",
      actionTab: "inbox",
    });
  }

  // Phase milestone
  if (state.phase !== "Tailoring" && state.phase !== "Complete") {
    const nextPhases: Record<string, string> = {
      Initiation: "Planning",
      Planning: "Execution",
      Execution: "Monitoring",
      Monitoring: "Closing",
      Closing: "Complete",
    };
    const next = nextPhases[state.phase];
    if (next) {
      events.push({
        id: `milestone-${state.phase}`,
        time: `${dayLabel} End of Day`,
        type: "milestone",
        title: `${state.phase} phase · Advance to ${next}`,
        priority: "info",
      });
    }
  }

  return events.slice(0, 8);
}

export function ScenarioTimeline({ onOpenTab }: { onOpenTab?: (tab: string) => void }) {
  const { state } = useSim();
  const caseRef = getCaseRef(state.caseId);
  const events = buildScenarioEvents(state, caseRef);
  const dayLabel = getDayLabel(state.currentDay);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-accent" />
          <span className="text-[13px] font-semibold text-foreground">Scenario Feed</span>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-muted-foreground">
            {dayLabel}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {events.filter((e) => e.priority === "urgent").length} urgent items
        </span>
      </div>

      <div className="relative space-y-1.5 pl-2">
        {/* Timeline line */}
        <div className="absolute left-0 top-2 bottom-2 w-px bg-white/[0.06]" />

        {events.map((ev, i) => {
          const Icon = TYPE_ICON[ev.type];
          const style = PRIORITY_STYLE[ev.priority];

          return (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                "relative ml-3 flex items-start gap-3 rounded-xl border px-3 py-2.5 transition",
                style.border,
                style.bg,
                onOpenTab && ev.actionTab ? "cursor-pointer hover:brightness-110" : "",
              )}
              onClick={() => onOpenTab && ev.actionTab && onOpenTab(ev.actionTab)}
            >
              {/* Timeline dot */}
              <span
                className={cn(
                  "absolute -left-[18px] top-3.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                  ev.priority === "urgent"
                    ? "bg-[color:var(--color-destructive)]"
                    : ev.priority === "normal"
                      ? "bg-accent"
                      : "bg-white/20",
                )}
              />

              <span className={cn("mt-0.5 shrink-0", style.icon)}>
                <Icon className="h-3.5 w-3.5" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-[10px] text-muted-foreground tabular-nums">{ev.time}</span>
                  {ev.from && (
                    <span className="text-[10px] text-foreground/60">from {ev.from}</span>
                  )}
                </div>
                <div className="mt-0.5 text-[12px] font-medium text-foreground/90">{ev.title}</div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {ev.priority === "urgent" && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                      style.badge,
                    )}
                  >
                    Urgent
                  </span>
                )}
                {onOpenTab && ev.actionTab && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
            </motion.div>
          );
        })}

        {events.length === 0 && (
          <p className="py-4 text-center text-[12px] text-muted-foreground">
            No events today. Check back as the simulation progresses.
          </p>
        )}
      </div>
    </div>
  );
}
