import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { FeedbackInputSchema } from "@/lib/sim/stakeholder-interactions";
import type { Stakeholder } from "@/lib/sim/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const FEEDBACK_TYPES = [
  { id: "giving", label: "Giving Feedback", description: "You're providing feedback" },
  { id: "requesting", label: "Requesting Feedback", description: "You're asking for feedback" },
  { id: "coaching", label: "Coaching", description: "Development-focused" },
  { id: "corrective", label: "Corrective", description: "Addressing an issue" },
];

interface FeedbackPanelProps {
  stakeholder: Stakeholder;
  onSubmit: (data: z.infer<typeof FeedbackInputSchema>) => Promise<void>;
  onCancel: () => void;
}

export function FeedbackPanel({ stakeholder, onSubmit, onCancel }: FeedbackPanelProps) {
  const [feedbackType, setFeedbackType] = useState("giving");
  const [topic, setTopic] = useState("");
  const [specifics, setSpecifics] = useState("");
  const [improvement, setImprovement] = useState("");
  const [positive, setPositive] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!topic || !specifics) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        feedbackType: feedbackType as any,
        topic,
        specifics,
        suggestedImprovement: improvement,
        positiveAspect: positive,
      });
    } finally {
      setLoading(false);
    }
  };

  const isValid = topic && specifics;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Feedback with {stakeholder.name}</h3>

      {/* Feedback type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">Feedback Type</label>
        <div className="grid grid-cols-2 gap-2">
          {FEEDBACK_TYPES.map((f) => (
            <button
              key={f.id}
              onClick={() => setFeedbackType(f.id)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left text-sm transition",
                feedbackType === f.id
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20",
              )}
            >
              <div className="font-medium">{f.label}</div>
              <div className="text-xs text-muted-foreground">{f.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Topic */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">Topic</label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What is this feedback about?"
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Specifics */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">Specific Examples or Details</label>
        <textarea
          value={specifics}
          onChange={(e) => setSpecifics(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Be concrete and reference actual situations"
          rows={3}
        />
      </div>

      {/* Suggested improvement (conditional) */}
      {(feedbackType === "corrective" || feedbackType === "coaching") && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-foreground mb-1">Suggested Improvement</label>
          <textarea
            value={improvement}
            onChange={(e) => setImprovement(e.target.value)}
            className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="How can this be improved?"
            rows={2}
          />
        </div>
      )}

      {/* Positive aspect (for balanced feedback) */}
      {feedbackType === "coaching" && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-1">Positive Aspect (optional)</label>
          <textarea
            value={positive}
            onChange={(e) => setPositive(e.target.value)}
            className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="What's working well?"
            rows={2}
          />
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={!isValid || loading} className="flex-1">
          {loading ? "Sending..." : "Send Feedback"}
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}
