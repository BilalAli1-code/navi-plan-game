import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { EscalationInputSchema } from "@/lib/sim/stakeholder-interactions";
import type { Stakeholder } from "@/lib/sim/types";
import { Button } from "@/components/ui/button";

const URGENCY_LEVELS = [
  { id: "low", label: "Low", description: "Can wait a few days" },
  { id: "medium", label: "Medium", description: "Needs attention this week" },
  { id: "high", label: "High", description: "Needs immediate action" },
  { id: "critical", label: "Critical", description: "Project at risk" },
];

interface EscalationPanelProps {
  stakeholder: Stakeholder;
  onSubmit: (data: z.infer<typeof EscalationInputSchema>) => Promise<void>;
  onCancel: () => void;
}

export function EscalationPanel({ stakeholder, onSubmit, onCancel }: EscalationPanelProps) {
  const [issue, setIssue] = useState("");
  const [whyNeeded, setWhyNeeded] = useState("");
  const [actions, setActions] = useState<string[]>([]);
  const [newAction, setNewAction] = useState("");
  const [requestedDecision, setRequestedDecision] = useState("");
  const [urgency, setUrgency] = useState("high");
  const [recipient, setRecipient] = useState("");
  const [riskStatement, setRiskStatement] = useState("");
  const [loading, setLoading] = useState(false);

  const addAction = () => {
    if (newAction.trim()) {
      setActions([...actions, newAction]);
      setNewAction("");
    }
  };

  const handleSubmit = async () => {
    if (!issue || !whyNeeded || actions.length === 0 || !requestedDecision || !recipient || !riskStatement) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        issueBeing: issue,
        whyEscalationNeeded: whyNeeded,
        actionsAttempted: actions,
        requestedDecision,
        urgency: urgency as any,
        escalationRecipient: recipient,
        riskOfNotEscalating: riskStatement,
      });
    } finally {
      setLoading(false);
    }
  };

  const isValid = issue && whyNeeded && actions.length > 0 && requestedDecision && recipient && riskStatement;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Escalate to Management</h3>

      {/* Issue description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">What is the issue?</label>
        <textarea
          value={issue}
          onChange={(e) => setIssue(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Describe the problem or blocker"
          rows={2}
        />
      </div>

      {/* Why escalation is needed */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">Why is escalation needed?</label>
        <textarea
          value={whyNeeded}
          onChange={(e) => setWhyNeeded(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="What authority or resources do you need from above?"
          rows={2}
        />
      </div>

      {/* Actions already attempted */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">What have you already tried?</label>
        <div className="flex gap-2 mb-2">
          <input
            value={newAction}
            onChange={(e) => setNewAction(e.target.value)}
            placeholder="Add an action you tried..."
            className="flex-1 rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            onKeyDown={(e) => e.key === "Enter" && addAction()}
          />
          <button
            onClick={addAction}
            className="rounded-lg bg-accent/15 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/25"
          >
            Add
          </button>
        </div>
        <div className="space-y-1">
          {actions.map((a, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.02] p-2 text-sm text-foreground">
              <span>• {a}</span>
              <button
                onClick={() => setActions(actions.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Requested decision */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">What decision or support do you request?</label>
        <textarea
          value={requestedDecision}
          onChange={(e) => setRequestedDecision(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Be specific about what you need"
          rows={2}
        />
      </div>

      {/* Urgency */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">Urgency</label>
        <div className="grid grid-cols-2 gap-2">
          {URGENCY_LEVELS.map((u) => (
            <button
              key={u.id}
              onClick={() => setUrgency(u.id)}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                urgency === u.id
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20"
              }`}
            >
              <div className="font-medium">{u.label}</div>
              <div className="text-xs text-muted-foreground">{u.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Escalation recipient */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">Who should this be escalated to?</label>
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="e.g., Sponsor, Steering Committee, PMO"
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Risk of not escalating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-1">What is the risk of NOT escalating?</label>
        <textarea
          value={riskStatement}
          onChange={(e) => setRiskStatement(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="What will happen if this issue is not addressed?"
          rows={2}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={!isValid || loading} className="flex-1">
          {loading ? "Escalating..." : "Submit Escalation"}
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}
