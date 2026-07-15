import { motion } from "framer-motion";
import {
  Activity,
  DollarSign,
  CalendarRange,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  Download,
  Users,
  HeartHandshake,
  Smile,
  Sparkles,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useSim } from "@/lib/sim/store";
import { getCaseRef } from "@/lib/sim/cases";
import { cn } from "@/lib/utils";

// ─── Metrics Radar Chart ─────────────────────────────────────────────────────

function MetricsRadarChart() {
  const { state } = useSim();
  const m = state.metrics;

  const data = [
    { metric: "Health", value: Math.round(m.health), fullMark: 100 },
    { metric: "Budget", value: Math.round(m.budget), fullMark: 100 },
    { metric: "Schedule", value: Math.round(m.schedule), fullMark: 100 },
    { metric: "Risk", value: Math.round(m.risk), fullMark: 100 },
    { metric: "Morale", value: Math.round(m.morale), fullMark: 100 },
    { metric: "Trust", value: Math.round(m.trust), fullMark: 100 },
    { metric: "Quality", value: Math.round(m.quality), fullMark: 100 },
    { metric: "Satisfact.", value: Math.round(m.satisfaction), fullMark: 100 },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center gap-2">
        <Activity className="h-4 w-4 text-accent" />
        <span className="text-[13px] font-semibold text-foreground">Project Health Radar</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
          />
          <Radar
            name="Score"
            dataKey="value"
            stroke="hsl(var(--accent))"
            fill="hsl(var(--accent))"
            fillOpacity={0.2}
            strokeWidth={1.5}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--background))",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              fontSize: 11,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Decision Quality Chart ──────────────────────────────────────────────────

function DecisionQualityChart() {
  const { state } = useSim();

  const qualityCounts = {
    Excellent: state.log.filter((l) => l.quality === "excellent").length,
    Good: state.log.filter((l) => l.quality === "good").length,
    Risky: state.log.filter((l) => l.quality === "risky").length,
    Poor: state.log.filter((l) => l.quality === "poor").length,
  };

  const data = Object.entries(qualityCounts).map(([name, value]) => ({ name, value }));
  const colors: Record<string, string> = {
    Excellent: "hsl(var(--accent))",
    Good: "var(--color-success, #22c55e)",
    Risky: "var(--color-warning, #f59e0b)",
    Poor: "var(--color-destructive, #ef4444)",
  };

  if (state.log.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-2 flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent" />
          <span className="text-[13px] font-semibold text-foreground">Decision Quality</span>
        </div>
        <div className="py-6 text-center text-[12px] text-muted-foreground">
          Make decisions to see quality breakdown here.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-2 flex items-center gap-2">
        <FileText className="h-4 w-4 text-accent" />
        <span className="text-[13px] font-semibold text-foreground">Decision Quality</span>
      </div>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--background))", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: 11 }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={colors[entry.name] ?? "#6366f1"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Status Report Card ──────────────────────────────────────────────────────

function StatusReportCard() {
  const { state } = useSim();
  const c = getCaseRef(state.caseId);
  const m = state.metrics;
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const overallStatus =
    m.health >= 70
      ? {
          label: "On Track",
          cls: "text-[color:var(--color-success)] bg-[color:var(--color-success)]/10 border-[color:var(--color-success)]/20",
        }
      : m.health >= 50
        ? {
            label: "At Risk",
            cls: "text-[color:var(--color-warning)] bg-[color:var(--color-warning)]/10 border-[color:var(--color-warning)]/20",
          }
        : {
            label: "Off Track",
            cls: "text-[color:var(--color-destructive)] bg-[color:var(--color-destructive)]/10 border-[color:var(--color-destructive)]/20",
          };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Executive Status Report
          </div>
          <h2 className="mt-1 text-[18px] font-bold text-foreground">{c.projectName}</h2>
          <div className="mt-0.5 text-[12px] text-muted-foreground">
            {c.industry} · As of {today}
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-xl border px-3 py-1.5 text-[12px] font-semibold",
            overallStatus.cls,
          )}
        >
          {overallStatus.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Health", value: m.health, icon: <Activity className="h-3.5 w-3.5" /> },
          { label: "Budget", value: m.budget, icon: <DollarSign className="h-3.5 w-3.5" /> },
          { label: "Schedule", value: m.schedule, icon: <CalendarRange className="h-3.5 w-3.5" /> },
          { label: "Risk", value: m.risk, icon: <ShieldAlert className="h-3.5 w-3.5" /> },
        ].map((item) => {
          const good = item.value >= 70;
          const bad = item.value < 50;
          const TrendIcon = good ? TrendingUp : bad ? TrendingDown : Minus;
          const toneCls = good
            ? "text-[color:var(--color-success)]"
            : bad
              ? "text-[color:var(--color-destructive)]"
              : "text-[color:var(--color-warning)]";
          return (
            <div key={item.label} className="rounded-xl bg-white/[0.04] p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                {item.icon} {item.label}
              </div>
              <motion.div
                key={item.value}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className={cn("mt-1 text-[22px] font-bold", toneCls)}
              >
                {Math.round(item.value)}
              </motion.div>
              <TrendIcon className={cn("mx-auto mt-0.5 h-3.5 w-3.5", toneCls)} />
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-xl bg-white/[0.04] p-3">
        <div className="mb-1.5 text-[11px] font-semibold text-foreground">Summary</div>
        <p className="text-[12px] leading-relaxed text-foreground/80">
          The {c.projectName} project is currently in the <strong>{state.phase}</strong> phase.
          {m.health >= 70
            ? ` All key metrics are within acceptable ranges. The project is progressing according to plan with ${state.xp} XP earned.`
            : m.health >= 50
              ? ` Some metrics require attention. ${m.risk < 60 ? "Risk posture needs improvement. " : ""}${m.budget < 65 ? "Budget variance detected. " : ""}Immediate action recommended.`
              : ` Multiple metrics are below acceptable thresholds. Escalation and corrective action plan required.`}
        </p>
      </div>
    </div>
  );
}

// ─── Budget Report ────────────────────────────────────────────────────────────

function BudgetSummaryCard() {
  const { state } = useSim();
  const c = getCaseRef(state.caseId);
  const m = state.metrics;

  const variance = Math.round(m.budget - 80); // vs. initial baseline of 80

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-accent" />
        <span className="text-[13px] font-semibold text-foreground">Budget Overview</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-white/[0.04] p-3">
          <div className="text-[11px] text-muted-foreground">Approved</div>
          <div className="mt-0.5 text-[16px] font-bold text-foreground">{c.budget}</div>
        </div>
        <div className="rounded-xl bg-white/[0.04] p-3">
          <div className="text-[11px] text-muted-foreground">Current Score</div>
          <div
            className={cn(
              "mt-0.5 text-[16px] font-bold",
              m.budget >= 70
                ? "text-[color:var(--color-success)]"
                : m.budget >= 50
                  ? "text-[color:var(--color-warning)]"
                  : "text-[color:var(--color-destructive)]",
            )}
          >
            {Math.round(m.budget)}%
          </div>
        </div>
        <div className="rounded-xl bg-white/[0.04] p-3">
          <div className="text-[11px] text-muted-foreground">Variance</div>
          <div
            className={cn(
              "mt-0.5 text-[16px] font-bold",
              variance >= 0
                ? "text-[color:var(--color-success)]"
                : "text-[color:var(--color-destructive)]",
            )}
          >
            {variance >= 0 ? "+" : ""}
            {variance}
          </div>
        </div>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
        <motion.div
          initial={false}
          animate={{ width: `${m.budget}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 18 }}
          className={cn(
            "h-full rounded-full",
            m.budget >= 70
              ? "bg-[color:var(--color-success)]"
              : m.budget >= 50
                ? "bg-[color:var(--color-warning)]"
                : "bg-[color:var(--color-destructive)]",
          )}
        />
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">
        Budget health index (100 = on budget)
      </div>
    </div>
  );
}

// ─── Team Health Report ──────────────────────────────────────────────────────

function TeamHealthCard() {
  const { state } = useSim();
  const m = state.metrics;

  const teamMetrics = [
    { label: "Morale", value: m.morale, icon: <Users className="h-3.5 w-3.5" /> },
    { label: "Trust", value: m.trust, icon: <HeartHandshake className="h-3.5 w-3.5" /> },
    { label: "Quality", value: m.quality, icon: <Sparkles className="h-3.5 w-3.5" /> },
    { label: "Satisfaction", value: m.satisfaction, icon: <Smile className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-accent" />
        <span className="text-[13px] font-semibold text-foreground">Team & Stakeholder Health</span>
      </div>
      <div className="space-y-2.5">
        {teamMetrics.map((item) => {
          const good = item.value >= 70;
          const bad = item.value < 50;
          const toneCls = good
            ? "text-[color:var(--color-success)]"
            : bad
              ? "text-[color:var(--color-destructive)]"
              : "text-[color:var(--color-warning)]";
          const barCls = good
            ? "bg-[color:var(--color-success)]"
            : bad
              ? "bg-[color:var(--color-destructive)]"
              : "bg-[color:var(--color-warning)]";
          return (
            <div key={item.label}>
              <div className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-1.5 text-foreground/80">
                  {item.icon} {item.label}
                </div>
                <span className={cn("font-semibold tabular-nums", toneCls)}>
                  {Math.round(item.value)}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                <motion.div
                  initial={false}
                  animate={{ width: `${item.value}%` }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className={cn("h-full rounded-full", barCls)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Decision Log Report ─────────────────────────────────────────────────────

function DecisionLogReport() {
  const { state } = useSim();
  const correct = state.log.filter((l) => l.correct).length;
  const total = state.log.length;
  const excellent = state.log.filter((l) => l.quality === "excellent").length;
  const poor = state.log.filter((l) => l.quality === "poor").length;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent" />
          <span className="text-[13px] font-semibold text-foreground">
            Decision Performance Report
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">{total} decisions</span>
      </div>

      {total === 0 ? (
        <p className="text-[12px] text-muted-foreground">
          No decisions yet. Complete inbox items to generate decision data.
        </p>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-4 gap-2">
            {[
              { label: "Total", value: total, cls: "text-foreground" },
              { label: "PMI-Aligned", value: correct, cls: "text-[color:var(--color-success)]" },
              { label: "Excellent", value: excellent, cls: "text-accent" },
              { label: "Poor", value: poor, cls: "text-[color:var(--color-destructive)]" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/[0.04] p-2.5 text-center">
                <div className={cn("text-[20px] font-bold", s.cls)}>{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="max-h-[200px] overflow-y-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-1.5 font-medium">Decision</th>
                  <th className="pb-1.5 font-medium">Phase</th>
                  <th className="pb-1.5 font-medium text-right">Quality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {state.log
                  .slice()
                  .reverse()
                  .map((l) => {
                    const dec = state.decisions.find((d) => d.id === l.decisionId);
                    return (
                      <tr key={l.decisionId}>
                        <td className="py-1.5 pr-2 text-foreground/80 truncate max-w-[180px]">
                          {dec?.title ?? l.decisionId}
                        </td>
                        <td className="py-1.5 pr-2 text-muted-foreground">{l.atPhase}</td>
                        <td className="py-1.5 text-right">
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                              l.quality === "excellent"
                                ? "bg-accent/15 text-accent"
                                : l.quality === "good"
                                  ? "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]"
                                  : l.quality === "risky"
                                    ? "bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]"
                                    : "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]",
                            )}
                          >
                            {l.quality}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main ReportsPanel export ─────────────────────────────────────────────────

export function ReportsPanel() {
  const reports = [
    { id: "status", label: "Executive Status", icon: <Activity className="h-3.5 w-3.5" /> },
    { id: "budget", label: "Budget Report", icon: <DollarSign className="h-3.5 w-3.5" /> },
    { id: "team", label: "Team Health", icon: <Users className="h-3.5 w-3.5" /> },
    { id: "decisions", label: "Decision Log", icon: <FileText className="h-3.5 w-3.5" /> },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-semibold text-foreground">Executive Reports</div>
        <button className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-1.5 text-[11px] text-muted-foreground transition hover:border-accent/30 hover:text-accent">
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {reports.map((r) => (
          <div
            key={r.id}
            className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[12px] text-muted-foreground"
          >
            {r.icon}
            <span>{r.label}</span>
          </div>
        ))}
      </div>

      <StatusReportCard />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MetricsRadarChart />
        <DecisionQualityChart />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BudgetSummaryCard />
        <TeamHealthCard />
      </div>

      <DecisionLogReport />
    </div>
  );
}
