import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { PresentationInputSchema } from "@/lib/sim/stakeholder-interactions";
import type { Stakeholder } from "@/lib/sim/types";
import { Button } from "@/components/ui/button";

interface PresentationPanelProps {
  stakeholder: Stakeholder;
  onSubmit: (data: z.infer<typeof PresentationInputSchema>) => Promise<void>;
  onCancel: () => void;
}

export function PresentationPanel({
  stakeholder,
  onSubmit,
  onCancel,
}: PresentationPanelProps) {
  const [audience, setAudience] = useState("");
  const [objective, setObjective] = useState("");
  const [keyMessage, setKeyMessage] = useState("");
  const [data, setData] = useState<string[]>([]);
  const [newData, setNewData] = useState("");
  const [decision, setDecision] = useState("");
  const [risks, setRisks] = useState("");
  const [loading, setLoading] = useState(false);

  const addData = () => {
    if (newData.trim()) {
      setData([...data, newData]);
      setNewData("");
    }
  };

  const handleSubmit = async () => {
    if (!audience || !objective || !keyMessage || data.length === 0 || !decision || !risks) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        audience,
        objective,
        keyMessage,
        supportingData: data,
        decisionRequested: decision,
        risksAndTradeOffs: risks,
      });
    } finally {
      setLoading(false);
    }
  };

  const isValid = audience && objective && keyMessage && data.length > 0 && decision && risks;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Prepare Presentation for {stakeholder.name}</h3>

      {/* Audience */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">Who is the audience?</label>
        <input
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="e.g., Sponsor, Steering Committee, Executive Team"
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Objective */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">What is your objective?</label>
        <textarea
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="What do you want the audience to understand or decide?"
          rows={2}
        />
      </div>

      {/* Key message */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">Key Message</label>
        <textarea
          value={keyMessage}
          onChange={(e) => setKeyMessage(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Your main point in one sentence"
          rows={2}
        />
      </div>

      {/* Supporting data */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">Supporting Data or Evidence</label>
        <div className="flex gap-2 mb-2">
          <input
            value={newData}
            onChange={(e) => setNewData(e.target.value)}
            placeholder="Add a data point or fact..."
            className="flex-1 rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            onKeyDown={(e) => e.key === "Enter" && addData()}
          />
          <button
            onClick={addData}
            className="rounded-lg bg-accent/15 px-3 py-2 text-sm font-medium text-accent hover:bg-accent/25"
          >
            Add
          </button>
        </div>
        <div className="space-y-1">
          {data.map((d, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-white/[0.02] p-2 text-sm text-foreground">
              <span>• {d}</span>
              <button
                onClick={() => setData(data.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Decision requested */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">What decision do you need?</label>
        <textarea
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Be clear about what decision you need from the audience"
          rows={2}
        />
      </div>

      {/* Risks and trade-offs */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-1">Risks and Trade-offs</label>
        <textarea
          value={risks}
          onChange={(e) => setRisks(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="What risks or compromises should the audience know about?"
          rows={2}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={!isValid || loading} className="flex-1">
          {loading ? "Saving..." : "Save Presentation"}
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}
