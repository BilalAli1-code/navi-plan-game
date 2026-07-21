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
} from "lucide-react";
import { useSim } from "@/lib/sim/store";
import { MetricMeter } from "./MetricMeter";
import { DecisionSummary } from "./MissionControl";


export function Dashboard({ onOpenDecision }: { onOpenDecision?: (id: string) => void }) {
  const { state } = useSim();
  const m = state.metrics;
  const done = state.log.length;
  const total = state.decisions.length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard label="Project Health" value={`${m.health}%`} tone={m.health >= 70 ? "good" : m.health >= 50 ? "warn" : "bad"} />
        <StatCard label="Decisions Made" value={`${done} / ${total}`} tone="neutral" />
        <StatCard label="XP Earned" value={`${state.xp}`} tone="accent" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricMeter label="Budget" value={m.budget} icon={<DollarSign className="h-4 w-4" />} hint="100 = on plan" />
        <MetricMeter label="Schedule" value={m.schedule} icon={<CalendarRange className="h-4 w-4" />} hint="100 = on time" />
        <MetricMeter label="Risk posture" value={m.risk} icon={<ShieldAlert className="h-4 w-4" />} hint="Higher = safer" />
        <MetricMeter label="Team morale" value={m.morale} icon={<Users className="h-4 w-4" />} />
        <MetricMeter label="Stakeholder trust" value={m.trust} icon={<HeartHandshake className="h-4 w-4" />} />
        <MetricMeter label="Quality" value={m.quality} icon={<Sparkles className="h-4 w-4" />} />
        <MetricMeter label="Customer satisfaction" value={m.satisfaction} icon={<Smile className="h-4 w-4" />} />
        <MetricMeter label="Overall health" value={m.health} icon={<Activity className="h-4 w-4" />} />
      </div>

      <DecisionSummary onOpenDecision={onOpenDecision} />


      {state.log.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-3 text-[13px] font-semibold text-foreground">Decision log</div>
          <ul className="space-y-2 text-[12px]">
            {state.log
              .slice()
              .reverse()
              .map((l) => {
                const dec = state.decisions.find((d) => d.id === l.decisionId);
                return (
                  <li key={l.decisionId} className="flex items-start gap-2">
                    <span
                      className={
                        "mt-0.5 h-2 w-2 shrink-0 rounded-full " +
                        (l.correct ? "bg-[color:var(--color-success)]" : "bg-[color:var(--color-destructive)]")
                      }
                    />
                    <div className="min-w-0">
                      <div className="text-foreground/90">{dec?.title}</div>
                      <div className="text-muted-foreground">
                        {l.atPhase} · Option {l.optionId} · {l.quality}
                      </div>
                    </div>
                  </li>
                );
              })}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" | "bad" | "neutral" | "accent" }) {
  const cls =
    tone === "good"
      ? "text-[color:var(--color-success)]"
      : tone === "warn"
        ? "text-[color:var(--color-warning)]"
        : tone === "bad"
          ? "text-[color:var(--color-destructive)]"
          : tone === "accent"
            ? "text-accent"
            : "text-foreground";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{label}</div>
      <motion.div key={value} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className={"mt-1 text-[26px] font-bold " + cls}>
        {value}
      </motion.div>
    </div>
  );
}
