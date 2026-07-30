import { motion } from "framer-motion";
import { format } from "date-fns";
import type { Stakeholder } from "@/lib/sim/types";

export interface InteractionHistoryEntry {
  type: string;
  date: Date;
  outcome: "excellent" | "good" | "risky" | "poor";
  trustChange: number;
  followUpStatus?: string;
}

interface ActivityHistoryProps {
  stakeholder: Stakeholder;
  history: InteractionHistoryEntry[];
}

export function ActivityHistory({ stakeholder, history }: ActivityHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="rounded-lg bg-white/[0.02] border border-white/10 p-4 text-center text-sm text-muted-foreground">
        No interactions yet. Start by having a conversation with {stakeholder.name.split(" ")[0]}.
      </div>
    );
  }

  const outcomeColors: Record<string, string> = {
    excellent: "text-emerald-400",
    good: "text-blue-400",
    risky: "text-amber-400",
    poor: "text-rose-400",
  };

  const outcomeLabels: Record<string, string> = {
    excellent: "Excellent",
    good: "Good",
    risky: "Risky",
    poor: "Poor",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      {history.map((entry, i) => (
        <div
          key={i}
          className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-sm"
        >
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="font-medium text-foreground capitalize">
                {entry.type.replace(/_/g, " ")}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {format(entry.date, "MMM d, h:mm a")}
              </div>
            </div>
            <div className="text-right">
              <div className={`font-semibold text-xs ${outcomeColors[entry.outcome]}`}>
                {outcomeLabels[entry.outcome]}
              </div>
              <div className={`text-xs mt-0.5 ${entry.trustChange > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {entry.trustChange > 0 ? "+" : ""}{entry.trustChange} trust
              </div>
            </div>
          </div>
          {entry.followUpStatus && (
            <div className="text-xs text-muted-foreground mt-2">
              Follow-up: {entry.followUpStatus}
            </div>
          )}
        </div>
      ))}
    </motion.div>
  );
}
