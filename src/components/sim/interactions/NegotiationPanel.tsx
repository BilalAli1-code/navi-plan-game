import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { NegotiationInputSchema } from "@/lib/sim/stakeholder-interactions";
import type { Stakeholder } from "@/lib/sim/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NEGOTIATION_SUBJECTS = [
  { id: "scope", label: "Scope", description: "Project deliverables" },
  { id: "budget", label: "Budget", description: "Spending limits" },
  { id: "schedule", label: "Schedule", description: "Timeline & milestones" },
  { id: "resources", label: "Resources", description: "Team & tools" },
  { id: "contract_terms", label: "Contract Terms", description: "Legal terms" },
  { id: "acceptance_criteria", label: "Acceptance Criteria", description: "Success definition" },
];

interface NegotiationPanelProps {
  stakeholder: Stakeholder;
  onSubmit: (data: z.infer<typeof NegotiationInputSchema>) => Promise<void>;
  onCancel: () => void;
}

export function NegotiationPanel({ stakeholder, onSubmit, onCancel }: NegotiationPanelProps) {
  const [subject, setSubject] = useState<string>("")
  const [objective, setObjective] = useState("");
  const [stakeholderPosition, setStakeholderPosition] = useState("");
  const [priorities, setPriorities] = useState<string[]>([]);
  const [concessions, setConcessions] = useState<string[]>([]);
  const [constraints, setConstraints] = useState<string[]>([]);
  const [proposedResponse, setProposedResponse] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [loading, setLoading] = useState(false);
  const [newPriority, setNewPriority] = useState("");
  const [newConcession, setNewConcession] = useState("");
  const [newConstraint, setNewConstraint] = useState("");

  const addPriority = () => {
    if (newPriority.trim()) {
      setPriorities([...priorities, newPriority]);
      setNewPriority("");
    }
  };

  const addConcession = () => {
    if (newConcession.trim()) {
      setConcessions([...concessions, newConcession]);
      setNewConcession("");
    }
  };

  const addConstraint = () => {
    if (newConstraint.trim()) {
      setConstraints([...constraints, newConstraint]);
      setNewConstraint("");
    }
  };

  const handleSubmit = async () => {
    if (!subject || !objective || !stakeholderPosition || priorities.length === 0 || concessions.length === 0 || constraints.length === 0 || !proposedResponse) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        objective,
        stakeholderPosition,
        learnerPriorities: priorities,
        availableConcessions: concessions,
        nonNegotiableConstraints: constraints,
        proposedResponse,
        reasoning,
        subject: subject as any,
      });
    } finally {
      setLoading(false);
    }
  };

  const isValid = subject && objective && stakeholderPosition && priorities.length > 0 && concessions.length > 0 && constraints.length > 0 && proposedResponse;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Negotiate with {stakeholder.name}</h3>

      {/* Subject selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">Negotiation Subject</label>
        <div className="grid grid-cols-2 gap-2">
          {NEGOTIATION_SUBJECTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSubject(s.id)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm transition",
                subject === s.id
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20",
              )}
            >
              <div className="font-medium">{s.label}</div>
              <div className="text-xs text-muted-foreground">{s.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Objective */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">What do you want to achieve?</label>
        <textarea
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="e.g., Reduce project schedule by 2 months without compromising quality"
          rows={2}
        />
      </div>

      {/* Stakeholder position */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">What is {stakeholder.name.split(" ")[0]}'s position?</label>
        <textarea
          value={stakeholderPosition}
          onChange={(e) => setStakeholderPosition(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="What does the stakeholder want or need?"
          rows={2}
        />
      </div>

      {/* Priorities */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">Your Priorities</label>
        <div className="flex gap-2 mb-2">
          <input
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value)}
            placeholder="Add a priority..."
            className="flex-1 rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            onKeyDown={(e) => e.key === "Enter" && addPriority()}
          />
          <button
            onClick={addPriority}
            className="rounded-lg bg-accent/15 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/25"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {priorities.map((p, i) => (
            <div key={i} className="flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-sm text-accent">
              {p}
              <button onClick={() => setPriorities(priorities.filter((_, j) => j !== i))} className="text-accent/60 hover:text-accent">
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Available concessions */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">What can you offer?</label>
        <div className="flex gap-2 mb-2">
          <input
            value={newConcession}
            onChange={(e) => setNewConcession(e.target.value)}
            placeholder="Add a concession..."
            className="flex-1 rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            onKeyDown={(e) => e.key === "Enter" && addConcession()}
          />
          <button
            onClick={addConcession}
            className="rounded-lg bg-accent/15 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/25"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {concessions.map((c, i) => (
            <div key={i} className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-sm text-green-300">
              {c}
              <button onClick={() => setConcessions(concessions.filter((_, j) => j !== i))} className="text-green-300/60 hover:text-green-300">
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Non-negotiable constraints */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">What is non-negotiable?</label>
        <div className="flex gap-2 mb-2">
          <input
            value={newConstraint}
            onChange={(e) => setNewConstraint(e.target.value)}
            placeholder="Add a constraint..."
            className="flex-1 rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            onKeyDown={(e) => e.key === "Enter" && addConstraint()}
          />
          <button
            onClick={addConstraint}
            className="rounded-lg bg-accent/15 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/25"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {constraints.map((c, i) => (
            <div key={i} className="flex items-center gap-2 rounded-full bg-rose-500/10 px-3 py-1 text-sm text-rose-300">
              {c}
              <button onClick={() => setConstraints(constraints.filter((_, j) => j !== i))} className="text-rose-300/60 hover:text-rose-300">
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Proposed response */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">Your Proposal</label>
        <textarea
          value={proposedResponse}
          onChange={(e) => setProposedResponse(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="What specific offer or compromise are you proposing?"
          rows={3}
        />
      </div>

      {/* Reasoning (optional) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-1">Your Reasoning (optional)</label>
        <textarea
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Why should the stakeholder accept this?"
          rows={2}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={!isValid || loading} className="flex-1">
          {loading ? "Proposing..." : "Submit Proposal"}
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}
