import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, TrendingUp, Lightbulb, X } from "lucide-react";
import type { StakeholderInteractionOutcome } from "@/lib/sim/stakeholder-engine";

interface OutcomeFeedbackProps {
  outcome: StakeholderInteractionOutcome;
  onClose: () => void;
}

const QUALITY_CONFIG = {
  excellent: {
    icon: CheckCircle,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    label: "Excellent",
  },
  good: {
    icon: CheckCircle,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    label: "Good",
  },
  risky: {
    icon: AlertCircle,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    label: "Risky",
  },
  poor: {
    icon: AlertCircle,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    label: "Poor",
  },
};

export function OutcomeFeedback({ outcome, onClose }: OutcomeFeedbackProps) {
  const config = QUALITY_CONFIG[outcome.quality];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl border border-white/15 bg-surface p-6 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className={`rounded-full p-3 ${config.bg}`}>
            <Icon className={`h-6 w-6 ${config.color}`} />
          </div>
          <button
            onClick={onClose}
            className="ml-auto rounded-full p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Quality */}
        <h2 className="text-2xl font-semibold text-foreground mb-2">{config.label} Move</h2>
        <p className="text-sm text-muted-foreground mb-6">{outcome.feedback}</p>

        {/* Impacts */}
        <div className="space-y-4 mb-6">
          {outcome.trustDelta !== 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.02] p-3">
              <TrendingUp
                className={`h-4 w-4 ${outcome.trustDelta > 0 ? "text-emerald-400" : "text-rose-400"}`}
              />
              <div className="flex-1 text-sm">
                <span className="text-foreground">Trust:</span>
                <span className={`ml-2 font-semibold ${outcome.trustDelta > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {outcome.trustDelta > 0 ? "+" : ""}{outcome.trustDelta}
                </span>
              </div>
            </div>
          )}

          {Object.entries(outcome.metricImpacts).length > 0 && (
            <div className="rounded-lg bg-white/[0.02] p-3 text-sm">
              <div className="text-foreground font-medium mb-2">Metric Impacts:</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(outcome.metricImpacts).map(([metric, delta]) => (
                  <div key={metric} className="text-xs text-muted-foreground">
                    <span className="capitalize">{metric}:</span>
                    <span className={`ml-1 font-medium ${delta > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {delta > 0 ? "+" : ""}{delta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Alternatives */}
        {outcome.alternatives && outcome.alternatives.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-foreground">Better Approaches</h3>
            </div>
            <ul className="space-y-1">
              {outcome.alternatives.map((alt, i) => (
                <li key={i} className="text-xs text-muted-foreground pl-4">
                  • {alt}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Mastery */}
        {outcome.masteryImpacts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-2">Mastery Progress</h3>
            <div className="space-y-2">
              {outcome.masteryImpacts.map((impact, i) => (
                <div key={i} className="text-xs text-muted-foreground">
                  <div className="font-medium text-foreground">{impact.topic}</div>
                  <div className="text-emerald-400">+{impact.deltaXp} XP</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full rounded-full bg-accent/15 px-4 py-2.5 text-sm font-semibold text-accent hover:bg-accent/25 transition"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
}
