import { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { MeetingResponseInputSchema } from "@/lib/sim/stakeholder-interactions";
import type { Meeting } from "@/lib/sim/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MeetingResponsePanelProps {
  meeting: Meeting;
  onSubmit: (data: z.infer<typeof MeetingResponseInputSchema>) => Promise<void>;
  onCancel: () => void;
}

export function MeetingResponsePanel({
  meeting,
  onSubmit,
  onCancel,
}: MeetingResponsePanelProps) {
  const [responseType, setResponseType] = useState<"structured" | "freeform">("freeform");
  const [selectedOption, setSelectedOption] = useState("");
  const [freeform, setFreeform] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (responseType === "structured" && !selectedOption) {
      return;
    }
    if (responseType === "freeform" && !freeform.trim()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        meetingId: meeting.id,
        responseType,
        selectedOption: responseType === "structured" ? selectedOption : undefined,
        writtenResponse: responseType === "freeform" ? freeform : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const isValid =
    (responseType === "structured" && selectedOption) ||
    (responseType === "freeform" && freeform.trim());

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">Respond to Meeting: {meeting.title}</h3>

      {/* Meeting info */}
      <div className="mb-6 rounded-lg bg-white/[0.02] p-4">
        <div className="text-sm text-muted-foreground mb-2">Time: {meeting.time}</div>
        <div className="text-sm font-medium text-foreground mb-3">Agenda:</div>
        <ul className="space-y-1">
          {meeting.agenda.map((item, i) => (
            <li key={i} className="text-sm text-foreground/75">• {item}</li>
          ))}
        </ul>
      </div>

      {/* Response type selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">Response Type</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setResponseType("freeform")}
            className={cn(
              "rounded-lg border px-3 py-2 text-left text-sm transition",
              responseType === "freeform"
                ? "border-accent bg-accent/10 text-foreground"
                : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20",
            )}
          >
            <div className="font-medium">Write Response</div>
            <div className="text-xs text-muted-foreground">Free-form text</div>
          </button>
          <button
            onClick={() => setResponseType("structured")}
            className={cn(
              "rounded-lg border px-3 py-2 text-left text-sm transition",
              responseType === "structured"
                ? "border-accent bg-accent/10 text-foreground"
                : "border-white/10 bg-white/[0.02] text-muted-foreground hover:border-white/20",
            )}
          >
            <div className="font-medium">Select Option</div>
            <div className="text-xs text-muted-foreground">Predefined choices</div>
          </button>
        </div>
      </div>

      {/* Response content */}
      {responseType === "freeform" ? (
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-1">Your Response</label>
          <textarea
            value={freeform}
            onChange={(e) => setFreeform(e.target.value)}
            className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="What is your response to this meeting?"
            rows={4}
          />
          <div className="text-xs text-muted-foreground mt-1">
            {freeform.length} characters
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">Select Your Response</label>
          <div className="space-y-2">
            {[
              "Agree and will proceed as discussed",
              "Need clarification before proceeding",
              "Disagree with the approach",
              "Will discuss with my team first",
            ].map((option) => (
              <label
                key={option}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 cursor-pointer hover:border-white/20 transition"
              >
                <input
                  type="radio"
                  name="response"
                  value={option}
                  checked={selectedOption === option}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-foreground">{option}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={!isValid || loading} className="flex-1">
          {loading ? "Submitting..." : "Submit Response"}
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}
