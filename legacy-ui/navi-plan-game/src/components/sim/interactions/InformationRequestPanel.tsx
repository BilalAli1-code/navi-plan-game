import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { InformationRequestInputSchema } from "@/lib/sim/stakeholder-interactions";
import type { Stakeholder } from "@/lib/sim/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEADLINE_OPTIONS = [
  { id: "asap", label: "ASAP", description: "Within 24 hours" },
  { id: "this_week", label: "This Week", description: "By end of week" },
  { id: "this_month", label: "This Month", description: "By end of month" },
  { id: "flexible", label: "Flexible", description: "No rush" },
];

interface InformationRequestPanelProps {
  stakeholder: Stakeholder;
  onSubmit: (data: z.infer<typeof InformationRequestInputSchema>) => Promise<void>;
  onCancel: () => void;
}

export function InformationRequestPanel({
  stakeholder,
  onSubmit,
  onCancel,
}: InformationRequestPanelProps) {
  const [information, setInformation] = useState("");
  const [reason, setReason] = useState("");
  const [deadline, setDeadline] = useState("this_week");
  const [impact, setImpact] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!information || !reason || !impact) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        informationNeeded: information,
        reason,
        requestedStakeholder: stakeholder.name,
        deadline: deadline as any,
        impactIfNotReceived: impact,
      });
    } finally {
      setLoading(false);
    }
  };

  const isValid = information && reason && impact;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Request Information from {stakeholder.name}</h3>

      {/* Information needed */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">What information do you need?</label>
        <textarea
          value={information}
          onChange={(e) => setInformation(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Be specific about what you're asking for"
          rows={2}
        />
      </div>

      {/* Reason */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">Why do you need it?</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Explain the business purpose"
          rows={2}
        />
      </div>

      {/* Deadline */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">Deadline</label>
        <div className="grid grid-cols-2 gap-2">
          {DEADLINE_OPTIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDeadline(d.id)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm transition",
                deadline === d.id
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20",
              )}
            >
              <div className="font-medium">{d.label}</div>
              <div className="text-xs text-muted-foreground">{d.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Impact if not received */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-1">What happens if you don't get this information?</label>
        <textarea
          value={impact}
          onChange={(e) => setImpact(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Describe the business impact"
          rows={2}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={!isValid || loading} className="flex-1">
          {loading ? "Requesting..." : "Submit Request"}
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}
