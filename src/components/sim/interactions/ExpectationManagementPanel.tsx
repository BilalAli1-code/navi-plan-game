import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { ExpectationManagementInputSchema } from "@/lib/sim/stakeholder-interactions";
import type { Stakeholder } from "@/lib/sim/types";
import { Button } from "@/components/ui/button";

interface ExpectationManagementPanelProps {
  stakeholder: Stakeholder;
  onSubmit: (data: z.infer<typeof ExpectationManagementInputSchema>) => Promise<void>;
  onCancel: () => void;
}

export function ExpectationManagementPanel({
  stakeholder,
  onSubmit,
  onCancel,
}: ExpectationManagementPanelProps) {
  const [currentExpectation, setCurrentExpectation] = useState("");
  const [misalignment, setMisalignment] = useState("");
  const [clarification, setClarification] = useState("");
  const [commitment, setCommitment] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!currentExpectation || !misalignment || !clarification || !commitment) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        currentExpectation,
        misalignmentIdentified: misalignment,
        proposedClarification: clarification,
        commitmentOrBoundary: commitment,
        followUpAction: followUp,
      });
    } finally {
      setLoading(false);
    }
  };

  const isValid = currentExpectation && misalignment && clarification && commitment;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Manage Expectations with {stakeholder.name}</h3>

      {/* Current expectation */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">What expectation needs to be managed?</label>
        <textarea
          value={currentExpectation}
          onChange={(e) => setCurrentExpectation(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Describe the stakeholder's current expectation"
          rows={2}
        />
      </div>

      {/* Misalignment identified */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">What is the misalignment?</label>
        <textarea
          value={misalignment}
          onChange={(e) => setMisalignment(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Explain where reality differs from expectations"
          rows={2}
        />
      </div>

      {/* Proposed clarification */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">How will you clarify this?</label>
        <textarea
          value={clarification}
          onChange={(e) => setClarification(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="What will you communicate to the stakeholder?"
          rows={2}
        />
      </div>

      {/* Commitment or boundary */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-1">What's your commitment or boundary?</label>
        <textarea
          value={commitment}
          onChange={(e) => setCommitment(e.target.value)}
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
          placeholder="Be clear about what you can and cannot do"
          rows={2}
        />
      </div>

      {/* Follow-up action (optional) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-1">Follow-up action (optional)</label>
        <input
          value={followUp}
          onChange={(e) => setFollowUp(e.target.value)}
          placeholder="e.g., Weekly check-in meeting, update email"
          className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={!isValid || loading} className="flex-1">
          {loading ? "Submitting..." : "Submit Clarification"}
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}
