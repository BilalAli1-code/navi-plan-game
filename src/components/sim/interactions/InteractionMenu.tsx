import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  MoreHorizontal,
  Handshake,
  AlertCircle,
  FileText,
  Target,
  ThumbsUp,
  Presentation,
  Check,
} from "lucide-react";
import type { Stakeholder } from "@/lib/sim/types";
import { getAvailableInteractions } from "@/lib/sim/stakeholder-interactions";
import type { SimState } from "@/lib/sim/types";
import { cn } from "@/lib/utils";

const INTERACTION_ICONS: Record<string, React.ReactNode> = {
  chat: <MessageCircle className="h-4 w-4" />,
  negotiation: <Handshake className="h-4 w-4" />,
  escalation: <AlertCircle className="h-4 w-4" />,
  information_request: <FileText className="h-4 w-4" />,
  expectation_management: <Target className="h-4 w-4" />,
  feedback: <ThumbsUp className="h-4 w-4" />,
  presentation: <Presentation className="h-4 w-4" />,
  meeting_response: <Check className="h-4 w-4" />,
};

const INTERACTION_LABELS: Record<string, string> = {
  chat: "Chat",
  negotiation: "Negotiate",
  escalation: "Escalate",
  information_request: "Request Info",
  expectation_management: "Manage Expectations",
  feedback: "Give Feedback",
  presentation: "Prepare Presentation",
  meeting_response: "Respond to Meeting",
};

interface InteractionMenuProps {
  stakeholder: Stakeholder;
  state: SimState;
  onSelectInteraction: (type: string) => void;
}

export function InteractionMenu({
  stakeholder,
  state,
  onSelectInteraction,
}: InteractionMenuProps) {
  const [open, setOpen] = useState(false);
  const available = getAvailableInteractions(state, stakeholder);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full p-2 text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
        title="More interactions"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full z-50 mt-2 w-48 rounded-2xl border border-white/10 bg-surface p-2 shadow-xl"
          >
            <div className="space-y-1">
              {available.map((interaction) => (
                <button
                  key={interaction.type}
                  onClick={() => {
                    if (interaction.available) {
                      onSelectInteraction(interaction.type);
                      setOpen(false);
                    }
                  }}
                  disabled={!interaction.available}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-left transition",
                    interaction.available
                      ? "text-foreground hover:bg-white/[0.05] cursor-pointer"
                      : "text-muted-foreground/50 cursor-not-allowed opacity-50",
                  )}
                  title={interaction.reason}
                >
                  <div className="text-accent">
                    {INTERACTION_ICONS[interaction.type]}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {INTERACTION_LABELS[interaction.type]}
                    </div>
                    {interaction.reason && (
                      <div className="text-[11px] text-muted-foreground">
                        {interaction.reason}
                      </div>
                    )}
                  </div>
                  {interaction.priority === "high" && (
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
