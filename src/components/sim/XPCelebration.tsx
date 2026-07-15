import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Star, TrendingUp } from "lucide-react";
import { useSim } from "@/lib/sim/store";

type XPEvent = {
  id: string;
  amount: number;
  label: string;
  ts: number;
};

// Celebrate XP gains with a brief animated overlay + toast
export function XPCelebration() {
  const { state } = useSim();
  const prevXp = useRef(0);
  const [events, setEvents] = useState<XPEvent[]>([]);

  const milestones = [
    { xp: 50, label: "PM Associate", icon: "🎯" },
    { xp: 100, label: "PM Professional", icon: "⭐" },
    { xp: 200, label: "PM Expert", icon: "🏆" },
    { xp: 300, label: "PM Master", icon: "🌟" },
  ];
  const [milestone, setMilestone] = useState<(typeof milestones)[0] | null>(null);

  useEffect(() => {
    const prev = prevXp.current;
    const curr = state.xp;
    const gain = curr - prev;

    if (gain > 0) {
      const label =
        gain >= 25 ? "Excellent decision!" : gain >= 15 ? "Good decision!" : "XP gained";
      const id = `xp-${Date.now()}`;
      setEvents((evts) => [...evts, { id, amount: gain, label, ts: Date.now() }]);
      // Auto-remove after 3s
      setTimeout(() => {
        setEvents((evts) => evts.filter((e) => e.id !== id));
      }, 3000);

      // Check for milestone crossing
      const hit = milestones.find((m) => prev < m.xp && curr >= m.xp);
      if (hit) {
        setMilestone(hit);
        setTimeout(() => setMilestone(null), 4000);
      }
    }

    prevXp.current = curr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.xp]);

  return (
    <>
      {/* XP gain toasts – bottom-left stack */}
      <div className="pointer-events-none fixed bottom-6 left-6 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {events.map((ev) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.85 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="flex items-center gap-2.5 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-2.5 backdrop-blur-sm shadow-lg shadow-accent/10"
            >
              <div className="grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-foreground">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-accent">+{ev.amount} XP</div>
                <div className="text-[11px] text-foreground/70">{ev.label}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Milestone celebration – centered overlay */}
      <AnimatePresence>
        {milestone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-accent/40 bg-background/95 px-10 py-8 shadow-2xl shadow-accent/20 backdrop-blur-xl text-center">
              <div className="text-6xl">{milestone.icon}</div>
              <div className="text-[28px] font-bold text-foreground">{milestone.label}</div>
              <div className="flex items-center gap-2 rounded-full bg-accent/15 px-4 py-1.5">
                <Star className="h-4 w-4 text-accent fill-accent" />
                <span className="text-[13px] font-semibold text-accent">
                  {state.xp} XP · {milestone.label} tier unlocked
                </span>
              </div>
              <div className="text-[12px] text-muted-foreground">
                Keep making excellent PM decisions to level up further.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
