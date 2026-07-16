import { motion } from "framer-motion";
import {
  Activity,
  DollarSign,
  CalendarRange,
  ShieldAlert,
  HeartHandshake,
  Users,
  Sparkles,
  Smile,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Bell,
} from "lucide-react";
import { useSim } from "@/lib/sim/store";
import { getCaseRef, stakeholdersFor } from "@/lib/sim/cases";
import { getDay, TOTAL_DAYS, TOTAL_MINUTES } from "@/lib/sim/days";
import { cn } from "@/lib/utils";
import { ScenarioTimeline } from "./ScenarioTimeline";

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  icon,
  trend,
  color,
  sub,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  trend?: "up" | "down" | "flat";
  color: "success" | "warning" | "destructive" | "accent";
  sub?: string;
  onClick?: () => void;
}) {
  const colorMap = {
    success: {
      bg: "bg-[color:var(--color-success)]/10",
      border: "border-[color:var(--color-success)]/20",
      text: "text-[color:var(--color-success)]",
      iconBg: "bg-[color:var(--color-success)]/15",
    },
    warning: {
      bg: "bg-[color:var(--color-warning)]/10",
      border: "border-[color:var(--color-warning)]/20",
      text: "text-[color:var(--color-warning)]",
      iconBg: "bg-[color:var(--color-warning)]/15",
    },
    destructive: {
      bg: "bg-[color:var(--color-destructive)]/10",
      border: "border-[color:var(--color-destructive)]/20",
      text: "text-[color:var(--color-destructive)]",
      iconBg: "bg-[color:var(--color-destructive)]/15",
    },
    accent: {
      bg: "bg-accent/10",
      border: "border-accent/20",
      text: "text-accent",
      iconBg: "bg-accent/15",
    },
  };
  const c = colorMap[color];
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { y: -2 } : undefined}
      className={cn(
        "w-full text-left rounded-2xl border p-4 transition",
        c.bg,
        c.border,
        onClick ? "cursor-pointer hover:brightness-110" : "cursor-default",
      )}
    >
      <div className="flex items-start justify-between">
        <div className={cn("grid h-9 w-9 place-items-center rounded-xl", c.iconBg, c.text)}>
          {icon}
        </div>
        {trend && <TrendIcon className={cn("h-4 w-4", c.text)} />}
      </div>
      <motion.div
        key={value}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("mt-3 text-[28px] font-bold tabular-nums", c.text)}
      >
        {value}%
      </motion.div>
      <div className="mt-0.5 text-[12px] font-medium text-foreground/80">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </motion.button>
  );
}

// ─── Status Bar (thin progress bars per metric) ──────────────────────────────

function MetricBar({
  label,
  value,
  invert = false,
}: {
  label: string;
  value: number;
  invert?: boolean;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const good = invert ? v <= 30 : v >= 70;
  const bad = invert ? v >= 70 : v <= 40;
  const barCls = good
    ? "bg-[color:var(--color-success)]"
    : bad
      ? "bg-[color:var(--color-destructive)]"
      : "bg-[color:var(--color-warning)]";
  const textCls = good
    ? "text-[color:var(--color-success)]"
    : bad
      ? "text-[color:var(--color-destructive)]"
      : "text-[color:var(--color-warning)]";

  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-semibold tabular-nums", textCls)}>{v}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
        <motion.div
          initial={false}
          animate={{ width: `${v}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className={cn("h-full rounded-full", barCls)}
        />
      </div>
    </div>
  );
}

// ─── Achievement Badge ────────────────────────────────────────────────────────

function AchievementBadge({ label, earned }: { label: string; earned: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium",
        earned ? "bg-accent/15 text-accent" : "bg-white/[0.04] text-muted-foreground/60",
      )}
    >
      <Star
        className={cn("h-3 w-3", earned ? "text-accent fill-accent" : "text-muted-foreground/40")}
      />
      {label}
    </div>
  );
}

// ─── Today's Mission ─────────────────────────────────────────────────────────

function TodaysMission({ onOpenTab }: { onOpenTab?: (tab: string) => void }) {
  const { state, days } = useSim();
  const day = getDay(state.currentDay);
  const dayRow = days.find((d) => d.day_number === state.currentDay);
  const completedPct = dayRow?.completion_percentage ?? 0;

  return (
    <div className="rounded-2xl border border-accent/20 bg-accent/[0.06] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/20">
            <Target className="h-4 w-4 text-accent" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-accent">
              Today's Mission
            </div>
            <div className="text-[14px] font-bold text-foreground">
              Day {state.currentDay} · {day.title}
            </div>
          </div>
        </div>
        <div className="text-right text-[11px] text-muted-foreground">
          <div className="text-[18px] font-bold text-accent">{completedPct}%</div>
          <div>complete</div>
        </div>
      </div>
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={false}
          animate={{ width: `${completedPct}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
          className="h-full rounded-full bg-accent"
        />
      </div>
      <p className="mb-3 text-[12px] text-foreground/75">{day.focus}</p>
      <ul className="space-y-1.5">
        {day.objectives.slice(0, 3).map((o) => (
          <li key={o} className="flex items-start gap-2 text-[12px] text-foreground/80">
            <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
            {o}
          </li>
        ))}
      </ul>
      {onOpenTab && (
        <button
          onClick={() => onOpenTab("inbox")}
          className="mt-3 flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-[12px] font-semibold text-accent-foreground transition hover:opacity-90"
        >
          <Zap className="h-3.5 w-3.5" />
          Start today's work
        </button>
      )}
    </div>
  );
}

// ─── Stakeholder Health Row ──────────────────────────────────────────────────

function StakeholderHealthRow({ onOpenTab }: { onOpenTab?: (tab: string) => void }) {
  const { state } = useSim();
  const stakes = stakeholdersFor(state.caseId);

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] p-4",
        onOpenTab && "cursor-pointer transition hover:bg-white/[0.05]",
      )}
      onClick={onOpenTab ? () => onOpenTab("stakeholders") : undefined}
    >
      <div className="mb-3 flex items-center gap-2">
        <HeartHandshake className="h-4 w-4 text-accent" />
        <span className="text-[13px] font-semibold text-foreground">Stakeholder Health</span>
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold",
            state.metrics.trust >= 70
              ? "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]"
              : state.metrics.trust >= 50
                ? "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]"
                : "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]",
          )}
        >
          Trust {Math.round(state.metrics.trust)}%
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {stakes.slice(0, 6).map((s) => {
          // Derive stakeholder-specific health from overall trust + satisfaction
          const baseScore = Math.round((state.metrics.trust + state.metrics.satisfaction) / 2);
          const variance = (s.id.charCodeAt(0) % 20) - 10;
          const score = Math.max(20, Math.min(100, baseScore + variance));
          const tone = score >= 70 ? "success" : score >= 50 ? "warning" : "destructive";
          const toneCls =
            tone === "success"
              ? "text-[color:var(--color-success)] bg-[color:var(--color-success)]/10"
              : tone === "warning"
                ? "text-[color:var(--color-warning)] bg-[color:var(--color-warning)]/10"
                : "text-[color:var(--color-destructive)] bg-[color:var(--color-destructive)]/10";

          return (
            <div key={s.id} className="flex items-center gap-2 rounded-xl bg-white/[0.03] p-2">
              <div
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white",
                  s.color,
                )}
              >
                {s.avatarInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-medium text-foreground">
                  {s.name.split(" ")[0]}
                </div>
                <div className="truncate text-[9px] text-muted-foreground">{s.role}</div>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  toneCls,
                )}
              >
                {score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AI Recommendations Panel ────────────────────────────────────────────────

function AIRecommendationsPanel() {
  const { state } = useSim();
  const m = state.metrics;
  const c = getCaseRef(state.caseId);

  const recommendations: {
    icon: React.ReactNode;
    title: string;
    body: string;
    urgency: "high" | "medium" | "low";
  }[] = [];

  if (m.risk < 60) {
    recommendations.push({
      icon: <ShieldAlert className="h-4 w-4" />,
      title: "Risk posture needs attention",
      body: `Your risk score is ${Math.round(m.risk)}. Review your risk register and identify mitigation strategies before next phase.`,
      urgency: "high",
    });
  }
  if (m.morale < 65) {
    recommendations.push({
      icon: <Users className="h-4 w-4" />,
      title: "Team morale declining",
      body: "Schedule a team check-in. Recognize recent wins and address workload concerns proactively.",
      urgency: "high",
    });
  }
  if (m.budget < 70) {
    recommendations.push({
      icon: <DollarSign className="h-4 w-4" />,
      title: "Budget variance detected",
      body: "Budget health is below threshold. Prepare a variance analysis and forecast for your sponsor.",
      urgency: "medium",
    });
  }
  if (m.trust < 65) {
    recommendations.push({
      icon: <HeartHandshake className="h-4 w-4" />,
      title: "Stakeholder trust needs rebuilding",
      body: "Increase communication cadence with key stakeholders. Send status updates and proactively share good news.",
      urgency: "medium",
    });
  }
  if (state.phase === "Planning") {
    recommendations.push({
      icon: <CheckCircle2 className="h-4 w-4" />,
      title: "Complete WBS before execution",
      body: "Ensure your Work Breakdown Structure is approved before moving to execution. Missing deliverables create scope creep.",
      urgency: "low",
    });
  }
  if (state.phase === "Execution") {
    recommendations.push({
      icon: <Activity className="h-4 w-4" />,
      title: "Monitor earned value weekly",
      body: "Track SPI and CPI weekly to catch schedule or cost variances early.",
      urgency: "low",
    });
  }

  // Always add a contextual tip
  recommendations.push({
    icon: <Sparkles className="h-4 w-4" />,
    title: `PMBOK tip for ${state.phase}`,
    body:
      state.phase === "Tailoring"
        ? `In ${c.industry} projects, tailoring the approach to complexity is critical. Consider whether ${c.recommendedApproach} aligns with your sponsor's expectations.`
        : state.phase === "Initiation"
          ? "Focus on stakeholder identification and expectations alignment. The Project Charter is your authorization to proceed."
          : state.phase === "Planning"
            ? "Invest time in planning — it reduces execution surprises. Ensure your baseline is approved before starting work."
            : state.phase === "Execution"
              ? "Lead the team, manage stakeholders, and protect the schedule. Proactive communication prevents most issues."
              : state.phase === "Monitoring"
                ? "Compare actual vs. planned performance. Identify variances early and take corrective action."
                : state.phase === "Closing"
                  ? "Capture lessons learned, obtain final acceptance, and release resources properly."
                  : "Review project outcomes against success criteria.",
    urgency: "low",
  });

  const urgencyBg = {
    high: "border-[color:var(--color-destructive)]/30 bg-[color:var(--color-destructive)]/[0.06]",
    medium: "border-[color:var(--color-warning)]/30 bg-[color:var(--color-warning)]/[0.06]",
    low: "border-accent/20 bg-accent/[0.05]",
  };
  const urgencyIcon = {
    high: "text-[color:var(--color-destructive)]",
    medium: "text-[color:var(--color-warning)]",
    low: "text-accent",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-accent/15">
          <Sparkles className="h-4 w-4 text-accent" />
        </div>
        <span className="text-[13px] font-semibold text-foreground">Maya's Recommendations</span>
        {recommendations.filter((r) => r.urgency === "high").length > 0 && (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-[color:var(--color-destructive)]/15 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--color-destructive)]">
            <Bell className="h-3 w-3" />
            {recommendations.filter((r) => r.urgency === "high").length} urgent
          </span>
        )}
      </div>
      <div className="space-y-2">
        {recommendations.slice(0, 4).map((rec, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className={cn("rounded-xl border p-3", urgencyBg[rec.urgency])}
          >
            <div className="flex items-start gap-2">
              <span className={cn("mt-0.5 shrink-0", urgencyIcon[rec.urgency])}>{rec.icon}</span>
              <div>
                <div className="text-[12px] font-semibold text-foreground">{rec.title}</div>
                <div className="mt-0.5 text-[11px] leading-relaxed text-foreground/75">
                  {rec.body}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── XP & Achievements ───────────────────────────────────────────────────────

function XPAchievements({ onOpenTab }: { onOpenTab?: (tab: string) => void }) {
  const { state, days } = useSim();
  const totalCompletedMinutes = days.reduce((sum, d) => sum + (d.completed_minutes ?? 0), 0);
  const overallPct = Math.round((totalCompletedMinutes / TOTAL_MINUTES) * 100);

  const xpThresholds = [
    { label: "PM Initiate", xp: 0 },
    { label: "PM Associate", xp: 100 },
    { label: "PM Professional", xp: 250 },
    { label: "PM Expert", xp: 500 },
    { label: "PM Master", xp: 1000 },
  ];
  const currentTier = xpThresholds.filter((t) => state.xp >= t.xp).at(-1)!;
  const nextTier = xpThresholds.find((t) => t.xp > state.xp);
  const xpToNext = nextTier ? nextTier.xp - state.xp : 0;
  const xpPct = nextTier
    ? Math.round(((state.xp - currentTier.xp) / (nextTier.xp - currentTier.xp)) * 100)
    : 100;

  const achievements = [
    { label: "First Decision", earned: state.log.length >= 1 },
    { label: "5 Decisions", earned: state.log.length >= 5 },
    { label: "Approach Chosen", earned: !!state.approach },
    {
      label: "Phase 3+",
      earned: ["Planning", "Execution", "Monitoring", "Closing", "Complete"].includes(state.phase),
    },
    { label: "25% Progress", earned: overallPct >= 25 },
    { label: "50% Progress", earned: overallPct >= 50 },
  ];

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/[0.03] p-4",
        onOpenTab && "cursor-pointer transition hover:bg-white/[0.05]",
      )}
      onClick={onOpenTab ? () => onOpenTab("mastery") : undefined}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-[13px] font-semibold text-foreground">XP & Achievements</span>
        </div>
        <span className="text-[22px] font-bold text-accent">{state.xp} XP</span>
      </div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="font-semibold text-accent">{currentTier.label}</span>
        {nextTier && (
          <span className="text-muted-foreground">
            {xpToNext} XP to {nextTier.label}
          </span>
        )}
      </div>
      <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
        <motion.div
          initial={false}
          animate={{ width: `${xpPct}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
          className="h-full rounded-full bg-gradient-to-r from-accent/80 to-accent"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {achievements.map((a) => (
          <AchievementBadge key={a.label} label={a.label} earned={a.earned} />
        ))}
      </div>
    </div>
  );
}

// ─── Decision Log Summary ────────────────────────────────────────────────────

function DecisionSummary() {
  const { state } = useSim();
  const correct = state.log.filter((l) => l.correct).length;
  const total = state.log.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const recent = state.log.slice(-3).reverse();

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-accent" />
          <span className="text-[13px] font-semibold text-foreground">Decision Performance</span>
        </div>
        <div className="text-right text-[11px]">
          <span
            className={cn(
              "font-bold text-[15px]",
              accuracy >= 70
                ? "text-[color:var(--color-success)]"
                : accuracy >= 50
                  ? "text-[color:var(--color-warning)]"
                  : "text-[color:var(--color-destructive)]",
            )}
          >
            {accuracy}%
          </span>
          <span className="ml-1 text-muted-foreground">accuracy</span>
        </div>
      </div>

      {total === 0 ? (
        <p className="text-[12px] text-muted-foreground">
          No decisions made yet. Open your inbox or meetings to begin.
        </p>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white/[0.04] p-2">
              <div className="text-[18px] font-bold text-foreground">{total}</div>
              <div className="text-[10px] text-muted-foreground">Total</div>
            </div>
            <div className="rounded-xl bg-[color:var(--color-success)]/10 p-2">
              <div className="text-[18px] font-bold text-[color:var(--color-success)]">
                {correct}
              </div>
              <div className="text-[10px] text-muted-foreground">Aligned</div>
            </div>
            <div className="rounded-xl bg-[color:var(--color-destructive)]/10 p-2">
              <div className="text-[18px] font-bold text-[color:var(--color-destructive)]">
                {total - correct}
              </div>
              <div className="text-[10px] text-muted-foreground">Missed</div>
            </div>
          </div>
          {recent.length > 0 && (
            <div>
              <div className="mb-1 text-[11px] text-muted-foreground">Recent decisions</div>
              <ul className="space-y-1">
                {recent.map((l) => {
                  const dec = state.decisions.find((d) => d.id === l.decisionId);
                  return (
                    <li
                      key={l.decisionId}
                      className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2 py-1.5 text-[11px]"
                    >
                      <span
                        className={cn(
                          "h-2 w-2 shrink-0 rounded-full",
                          l.correct
                            ? "bg-[color:var(--color-success)]"
                            : "bg-[color:var(--color-destructive)]",
                        )}
                      />
                      <span className="flex-1 truncate text-foreground/80">
                        {dec?.title ?? l.decisionId}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                          l.quality === "excellent"
                            ? "bg-accent/15 text-accent"
                            : l.quality === "good"
                              ? "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]"
                              : "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]",
                        )}
                      >
                        {l.quality}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main MissionControl export ──────────────────────────────────────────────

export function MissionControl({ onOpenTab }: { onOpenTab?: (tab: string) => void }) {
  const { state, days } = useSim();
  const m = state.metrics;
  const totalCompletedMinutes = days.reduce((sum, d) => sum + (d.completed_minutes ?? 0), 0);
  const overallPct = Math.round((totalCompletedMinutes / TOTAL_MINUTES) * 100);
  const daysDone = days.filter((d) => d.status === "completed").length;

  const healthColor = m.health >= 70 ? "success" : m.health >= 50 ? "warning" : "destructive";
  const budgetColor = m.budget >= 70 ? "success" : m.budget >= 50 ? "warning" : "destructive";
  const scheduleColor = m.schedule >= 70 ? "success" : m.schedule >= 50 ? "warning" : "destructive";
  const riskColor = m.risk >= 60 ? "success" : m.risk >= 45 ? "warning" : "destructive";

  return (
    <div className="space-y-5">
      {/* Executive header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <Activity className="h-3.5 w-3.5 text-accent" />
          Mission Control
          <span className="ml-auto flex items-center gap-1 rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px]">
            <Clock className="h-3 w-3" />
            Day {state.currentDay} of {TOTAL_DAYS} · {overallPct}% overall · {daysDone}/{TOTAL_DAYS}{" "}
            days done
          </span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPICard
          label="Project Health"
          value={Math.round(m.health)}
          icon={<Activity className="h-5 w-5" />}
          color={healthColor}
          trend={m.health >= 70 ? "up" : m.health >= 50 ? "flat" : "down"}
          sub="overall composite"
        />
        <KPICard
          label="Budget"
          value={Math.round(m.budget)}
          icon={<DollarSign className="h-5 w-5" />}
          color={budgetColor}
          trend={m.budget >= 70 ? "up" : m.budget >= 50 ? "flat" : "down"}
          sub="vs. baseline"
        />
        <KPICard
          label="Schedule"
          value={Math.round(m.schedule)}
          icon={<CalendarRange className="h-5 w-5" />}
          color={scheduleColor}
          trend={m.schedule >= 70 ? "up" : m.schedule >= 50 ? "flat" : "down"}
          sub="on-time score"
        />
        <KPICard
          label="Risk Posture"
          value={Math.round(m.risk)}
          icon={<ShieldAlert className="h-5 w-5" />}
          color={riskColor}
          trend={m.risk >= 60 ? "up" : m.risk >= 45 ? "flat" : "down"}
          sub="higher = safer"
        />
      </div>

      {/* Scenario timeline */}
      <ScenarioTimeline onOpenTab={onOpenTab} />

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Smile className="h-4 w-4 text-accent" />
            <span className="text-[13px] font-semibold text-foreground">Soft Metrics</span>
          </div>
          <div className="space-y-3">
            <MetricBar label="Team Morale" value={m.morale} />
            <MetricBar label="Stakeholder Trust" value={m.trust} />
            <MetricBar label="Quality" value={m.quality} />
            <MetricBar label="Customer Satisfaction" value={m.satisfaction} />
          </div>
        </div>

        <TodaysMission onOpenTab={onOpenTab} />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <AIRecommendationsPanel />
        <StakeholderHealthRow />
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <DecisionSummary />
        <XPAchievements />
      </div>
    </div>
  );
}
