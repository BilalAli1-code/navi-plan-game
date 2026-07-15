import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart2,
  ShieldAlert,
  Users,
  DollarSign,
  GitBranch,
  CheckSquare,
  Activity,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { useSim } from "@/lib/sim/store";
import { getCaseRef, stakeholdersFor } from "@/lib/sim/cases";
import { cn } from "@/lib/utils";
import { getDay, TOTAL_DAYS } from "@/lib/sim/days";

// ─── Gantt Timeline ───────────────────────────────────────────────────────────

function GanttTimeline() {
  const { state } = useSim();
  const phases = [
    { name: "Tailoring", start: 0, duration: 1, color: "bg-purple-500" },
    { name: "Initiation", start: 1, duration: 1, color: "bg-blue-500" },
    { name: "Planning", start: 2, duration: 1.5, color: "bg-cyan-500" },
    { name: "Execution", start: 3.5, duration: 1.5, color: "bg-green-500" },
    { name: "Monitoring", start: 4, duration: 2, color: "bg-yellow-500" },
    { name: "Closing", start: 6, duration: 1, color: "bg-orange-500" },
  ];

  const totalDays = 7;
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

  return (
    <div>
      <div className="mb-3 text-[12px] font-semibold text-foreground">Project Timeline</div>
      <div className="relative rounded-xl border border-white/10 bg-white/[0.02] p-4">
        {/* Day markers */}
        <div className="mb-2 flex text-[10px] text-muted-foreground">
          {Array.from({ length: totalDays }, (_, i) => (
            <div key={i} className="flex-1 text-center">
              D{i + 1}
            </div>
          ))}
        </div>

        {/* Current day indicator */}
        <div
          className="absolute top-6 bottom-4 w-0.5 bg-accent/60"
          style={{ left: `${(state.currentDay / totalDays) * 100}%` }}
        >
          <div className="absolute -top-1 -translate-x-1/2 text-[9px] font-bold text-accent">▼</div>
        </div>

        {/* Phase bars */}
        <div className="space-y-2">
          {phases.map((phase, i) => {
            const phaseIdx = phaseOrder.indexOf(phase.name);
            const completed = phaseIdx < currentPhaseIdx;
            const active = phaseIdx === currentPhaseIdx;
            const left = (phase.start / totalDays) * 100;
            const width = (phase.duration / totalDays) * 100;

            return (
              <div key={phase.name} className="relative flex items-center gap-2">
                <div className="w-16 shrink-0 text-[10px] text-muted-foreground text-right">
                  {phase.name}
                </div>
                <div className="relative flex-1 h-5 rounded overflow-hidden bg-white/[0.04]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ delay: i * 0.1, type: "spring", stiffness: 80, damping: 15 }}
                    className={cn(
                      "absolute h-full rounded",
                      phase.color,
                      completed ? "opacity-100" : active ? "opacity-80" : "opacity-30",
                    )}
                    style={{ left: `${left}%` }}
                  />
                  {completed && (
                    <div
                      className="absolute inset-y-0 flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      ✓
                    </div>
                  )}
                  {active && (
                    <div
                      className="absolute inset-y-0 flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      →
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[color:var(--color-success)]" />
            Completed
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-accent" />
            Active
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-white/20" />
            Upcoming
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Risk Heat Map ────────────────────────────────────────────────────────────

function RiskHeatMap() {
  const { state } = useSim();
  const c = getCaseRef(state.caseId);

  // Derive risks from case challenges and current phase
  const riskItems = [
    {
      name: "Scope Creep",
      probability: state.phase === "Execution" ? 4 : 3,
      impact: 4,
      status: state.metrics.risk < 60 ? "open" : "mitigated",
    },
    {
      name: "Budget Overrun",
      probability: state.metrics.budget < 65 ? 4 : 2,
      impact: 5,
      status: state.metrics.budget < 65 ? "open" : "mitigated",
    },
    {
      name: "Resource Conflict",
      probability: state.metrics.morale < 65 ? 4 : 2,
      impact: 3,
      status: state.metrics.morale < 65 ? "open" : "mitigated",
    },
    {
      name: "Schedule Delay",
      probability: state.metrics.schedule < 65 ? 4 : 2,
      impact: 4,
      status: "open",
    },
    {
      name: "Stakeholder Conflict",
      probability: state.metrics.trust < 65 ? 3 : 2,
      impact: 3,
      status: "open",
    },
    { name: "Technical Failure", probability: 2, impact: 5, status: "open" },
  ] as const;

  const heatmapColors = [
    [
      "bg-green-900/30",
      "bg-green-700/30",
      "bg-yellow-700/30",
      "bg-yellow-600/40",
      "bg-orange-600/40",
    ],
    [
      "bg-green-700/30",
      "bg-yellow-700/30",
      "bg-yellow-600/40",
      "bg-orange-600/50",
      "bg-red-600/50",
    ],
    ["bg-yellow-700/30", "bg-yellow-600/40", "bg-orange-600/50", "bg-red-600/60", "bg-red-700/70"],
    ["bg-yellow-600/40", "bg-orange-600/50", "bg-red-600/60", "bg-red-700/70", "bg-red-800/80"],
    ["bg-orange-600/40", "bg-red-600/50", "bg-red-700/70", "bg-red-800/80", "bg-red-900/90"],
  ];

  return (
    <div>
      <div className="mb-3 text-[12px] font-semibold text-foreground">Risk Heat Map</div>
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        {/* 5x5 grid */}
        <div className="mb-3 flex gap-1">
          <div className="w-8" />
          <div className="flex flex-1 justify-between text-[9px] text-muted-foreground">
            <span>Low</span>
            <span>Impact →</span>
            <span>Critical</span>
          </div>
        </div>
        <div className="flex gap-1">
          <div
            className="flex flex-col justify-between pr-1 text-[9px] text-muted-foreground"
            style={{ width: "32px" }}
          >
            <span>5</span>
            <span>4</span>
            <span>3</span>
            <span className="text-[8px]">Prob.</span>
            <span>1</span>
          </div>
          <div
            className="grid flex-1"
            style={{ gridTemplateColumns: "repeat(5, 1fr)", gap: "2px" }}
          >
            {[5, 4, 3, 2, 1].map((prob) =>
              [1, 2, 3, 4, 5].map((impact) => {
                const riskInCell = riskItems.find(
                  (r) => r.probability === prob && r.impact === impact,
                );
                return (
                  <div
                    key={`${prob}-${impact}`}
                    className={cn(
                      "relative flex h-8 items-center justify-center rounded text-[9px] font-bold text-white/70",
                      heatmapColors[prob - 1][impact - 1],
                      riskInCell ? "ring-1 ring-white/30" : "",
                    )}
                    title={riskInCell ? `${riskInCell.name} (P:${prob} I:${impact})` : undefined}
                  >
                    {riskInCell ? (
                      <span className="truncate px-0.5 text-[8px] text-white font-semibold">
                        {riskInCell.name.split(" ")[0]}
                      </span>
                    ) : null}
                  </div>
                );
              }),
            )}
          </div>
        </div>

        {/* Risk list */}
        <div className="mt-3 space-y-1.5">
          {riskItems.map((r) => {
            const score = r.probability * r.impact;
            const severity =
              score >= 16 ? "critical" : score >= 9 ? "high" : score >= 4 ? "medium" : "low";
            const badgeCls = {
              critical: "bg-red-600/20 text-red-400",
              high: "bg-orange-500/20 text-orange-400",
              medium: "bg-yellow-500/20 text-yellow-400",
              low: "bg-green-500/20 text-green-400",
            }[severity];
            return (
              <div key={r.name} className="flex items-center gap-2 text-[11px]">
                <span
                  className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold", badgeCls)}
                >
                  {severity}
                </span>
                <span className="flex-1 text-foreground/80">{r.name}</span>
                <span className="text-muted-foreground">
                  P:{r.probability} × I:{r.impact} = {score}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Stakeholder Influence Matrix ────────────────────────────────────────────

function StakeholderMatrix() {
  const { state } = useSim();
  const stakes = stakeholdersFor(state.caseId);

  // Assign influence/interest scores based on stakeholder characteristics
  const matrixData = stakes.map((s, i) => {
    // Derive influence/interest from priorities and role
    const isExecutive =
      s.role.toLowerCase().includes("exec") ||
      s.role.toLowerCase().includes("sponsor") ||
      s.role.toLowerCase().includes("ceo") ||
      s.role.toLowerCase().includes("director") ||
      s.role.toLowerCase().includes("vp");
    const isClient =
      s.role.toLowerCase().includes("client") || s.role.toLowerCase().includes("customer");
    const isTechnical =
      s.role.toLowerCase().includes("lead") ||
      s.role.toLowerCase().includes("engineer") ||
      s.role.toLowerCase().includes("dev") ||
      s.role.toLowerCase().includes("architect");

    const influence = isExecutive
      ? 85 + ((i * 3) % 15)
      : isClient
        ? 70 + ((i * 5) % 20)
        : isTechnical
          ? 55 + ((i * 7) % 25)
          : 40 + ((i * 9) % 30);
    const interest = isClient
      ? 85 + ((i * 4) % 15)
      : isTechnical
        ? 75 + ((i * 3) % 20)
        : isExecutive
          ? 60 + ((i * 6) % 25)
          : 45 + ((i * 8) % 30);

    return {
      ...s,
      influence: Math.min(95, influence),
      interest: Math.min(95, interest),
    };
  });

  return (
    <div>
      <div className="mb-3 text-[12px] font-semibold text-foreground">
        Stakeholder Influence / Interest Matrix
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="relative mb-8" style={{ height: "200px" }}>
          {/* Quadrant background */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            <div className="border-b border-r border-white/10 flex items-center justify-center">
              <span className="text-[9px] text-muted-foreground/50">Keep Satisfied</span>
            </div>
            <div className="border-b border-white/10 flex items-center justify-center">
              <span className="text-[9px] text-muted-foreground/50">Manage Closely</span>
            </div>
            <div className="border-r border-white/10 flex items-center justify-center">
              <span className="text-[9px] text-muted-foreground/50">Monitor</span>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-[9px] text-muted-foreground/50">Keep Informed</span>
            </div>
          </div>

          {/* Stakeholder dots */}
          {matrixData.slice(0, 8).map((s) => (
            <motion.div
              key={s.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className={cn(
                "absolute grid place-items-center rounded-full text-[10px] font-bold text-white shadow-lg",
                s.color,
              )}
              style={{
                width: "28px",
                height: "28px",
                left: `calc(${s.interest}% - 14px)`,
                top: `calc(${100 - s.influence}% - 14px)`,
              }}
              title={`${s.name} — Influence: ${s.influence}, Interest: ${s.interest}`}
            >
              {s.avatarInitial}
            </motion.div>
          ))}

          {/* Axis labels */}
          <div
            className="absolute -left-1 top-1/2 -rotate-90 -translate-y-1/2 text-[9px] text-muted-foreground"
            style={{ transformOrigin: "center" }}
          >
            Influence ↑
          </div>
        </div>

        <div className="text-[9px] text-center text-muted-foreground mb-3">Interest →</div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-1.5">
          {matrixData.slice(0, 6).map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className={cn("h-3 w-3 rounded-full shrink-0", s.color)} />
              <span className="truncate">{s.name.split(" ")[0]}</span>
              <span className="ml-auto text-[9px] opacity-70">
                {s.influence}/{s.interest}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Milestone Tracker ────────────────────────────────────────────────────────

function MilestoneTracker() {
  const { state } = useSim();
  const phaseOrder = [
    "Tailoring",
    "Initiation",
    "Planning",
    "Execution",
    "Monitoring",
    "Closing",
    "Complete",
  ];
  const currentIdx = phaseOrder.indexOf(state.phase);

  const milestones = [
    { name: "Project Kickoff", phase: "Initiation", day: 1 },
    { name: "Charter Approved", phase: "Initiation", day: 1 },
    { name: "Project Plan Baselined", phase: "Planning", day: 2 },
    { name: "Execution Kick-off", phase: "Execution", day: 3 },
    { name: "50% Progress Gate", phase: "Monitoring", day: 4 },
    { name: "Final Deliverable", phase: "Closing", day: 6 },
    { name: "Project Closure", phase: "Closing", day: 7 },
  ];

  return (
    <div>
      <div className="mb-3 text-[12px] font-semibold text-foreground">Milestone Tracker</div>
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="space-y-2">
          {milestones.map((m, i) => {
            const mPhaseIdx = phaseOrder.indexOf(m.phase);
            const achieved = mPhaseIdx < currentIdx;
            const active = mPhaseIdx === currentIdx;
            return (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3"
              >
                <div
                  className={cn(
                    "h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold",
                    achieved
                      ? "bg-[color:var(--color-success)] text-white"
                      : active
                        ? "bg-accent text-accent-foreground ring-2 ring-accent/30"
                        : "bg-white/[0.08] text-muted-foreground",
                  )}
                >
                  {achieved ? "✓" : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "text-[12px]",
                      achieved
                        ? "text-muted-foreground line-through"
                        : active
                          ? "text-foreground font-semibold"
                          : "text-foreground/70",
                    )}
                  >
                    {m.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {m.phase} · Day {m.day}
                  </div>
                </div>
                {active && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[9px] font-semibold text-accent">
                    Active
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Team Workload ────────────────────────────────────────────────────────────

function TeamWorkload() {
  const { state } = useSim();
  const stakes = stakeholdersFor(state.caseId);

  // Derive workload from metrics and stakeholder data
  const teamMembers = stakes
    .filter((s) => {
      const isTeam =
        s.role.toLowerCase().includes("manager") ||
        s.role.toLowerCase().includes("lead") ||
        s.role.toLowerCase().includes("engineer") ||
        s.role.toLowerCase().includes("analyst") ||
        s.role.toLowerCase().includes("dev") ||
        s.role.toLowerCase().includes("pm") ||
        s.role.toLowerCase().includes("architect");
      return isTeam;
    })
    .slice(0, 6);

  if (teamMembers.length === 0) return null;

  return (
    <div>
      <div className="mb-3 text-[12px] font-semibold text-foreground">Team Workload</div>
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <div className="space-y-2.5">
          {teamMembers.map((s, i) => {
            // Simulate workload based on morale and phase
            const baseLoad =
              state.metrics.morale < 60
                ? 85 + ((i * 3) % 20)
                : state.phase === "Execution"
                  ? 70 + ((i * 5) % 25)
                  : 50 + ((i * 7) % 35);
            const load = Math.min(100, baseLoad);
            const loadCls =
              load >= 90
                ? "bg-[color:var(--color-destructive)]"
                : load >= 75
                  ? "bg-[color:var(--color-warning)]"
                  : "bg-[color:var(--color-success)]";
            const textCls =
              load >= 90
                ? "text-[color:var(--color-destructive)]"
                : load >= 75
                  ? "text-[color:var(--color-warning)]"
                  : "text-[color:var(--color-success)]";

            return (
              <div key={s.id} className="flex items-center gap-3">
                <div
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white",
                    s.color,
                  )}
                >
                  {s.avatarInitial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="text-foreground/80 truncate">{s.name.split(" ")[0]}</span>
                    <span className={cn("font-semibold", textCls)}>{load}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                    <motion.div
                      initial={false}
                      animate={{ width: `${load}%` }}
                      transition={{ type: "spring", stiffness: 80, damping: 18 }}
                      className={cn("h-full rounded-full", loadCls)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {state.metrics.morale < 65 && (
          <div className="mt-3 rounded-lg bg-[color:var(--color-warning)]/10 border border-[color:var(--color-warning)]/20 px-3 py-2 text-[11px] text-[color:var(--color-warning)]">
            ⚠ Team overload detected — consider resource rebalancing
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main PMToolsPanel ────────────────────────────────────────────────────────

type PMTab = "gantt" | "risks" | "stakeholders" | "budget" | "milestones" | "workload";

const PM_TABS: { id: PMTab; label: string; icon: React.ReactNode }[] = [
  { id: "gantt", label: "Timeline", icon: <BarChart2 className="h-3.5 w-3.5" /> },
  { id: "risks", label: "Risk Map", icon: <ShieldAlert className="h-3.5 w-3.5" /> },
  { id: "stakeholders", label: "Stakeholders", icon: <Users className="h-3.5 w-3.5" /> },
  { id: "milestones", label: "Milestones", icon: <CheckSquare className="h-3.5 w-3.5" /> },
  { id: "workload", label: "Workload", icon: <Activity className="h-3.5 w-3.5" /> },
];

export function PMToolsPanel() {
  const [activeTab, setActiveTab] = useState<PMTab>("gantt");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart2 className="h-4 w-4 text-accent" />
        <span className="text-[13px] font-semibold text-foreground">PM Tools</span>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1">
        {PM_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] transition",
              activeTab === t.id
                ? "bg-accent text-accent-foreground"
                : "text-foreground/60 hover:bg-white/[0.05] hover:text-foreground",
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "gantt" && <GanttTimeline />}
        {activeTab === "risks" && <RiskHeatMap />}
        {activeTab === "stakeholders" && <StakeholderMatrix />}
        {activeTab === "milestones" && <MilestoneTracker />}
        {activeTab === "workload" && <TeamWorkload />}
      </div>
    </div>
  );
}
