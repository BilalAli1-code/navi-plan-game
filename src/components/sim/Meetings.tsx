import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { CalendarDays, Users } from "lucide-react";
import { useSim } from "@/lib/sim/store";
import { stakeholdersFor } from "@/lib/sim/cases";
import { visibleMeetings } from "@/lib/sim/visibility";
import { cn } from "@/lib/utils";

export function Meetings({ onOpenDecision }: { onOpenDecision: (id: string) => void }) {
  const { state } = useSim();
  const stakes = stakeholdersFor(state.caseId);
  // Chapter-gated: only surface meetings whose gating chapter has opened.
  const meetings = useMemo(() => visibleMeetings(state), [state]);
  const [openId, setOpenId] = useState<string | null>(meetings[0]?.id ?? null);
  const active = meetings.find((m) => m.id === openId) ?? null;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(280px,340px)_1fr]">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-[13px] font-semibold text-foreground">
          <CalendarDays className="h-4 w-4 text-accent" />
          Meetings
        </div>
        <ul>
          {state.meetings.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => setOpenId(m.id)}
                className={cn(
                  "flex w-full flex-col gap-1 border-b border-white/5 px-4 py-3 text-left transition",
                  openId === m.id ? "bg-white/[0.06]" : "hover:bg-white/[0.03]",
                )}
              >
                <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {new Date(m.time).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </div>
                <div className="text-[13px] font-semibold text-foreground">{m.title}</div>
                <div className="text-[11px] text-muted-foreground">
                  {m.attendees.length} attendees
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <motion.div
        key={active?.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
      >
        {active ? (
          <>
            <h3 className="text-[20px] font-bold text-foreground">{active.title}</h3>
            <div className="mt-1 text-[12px] text-muted-foreground">
              {new Date(active.time).toLocaleString()}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              {active.attendees.map((id) => {
                const s = stakes.find((x) => x.id === id);
                if (!s) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-2 py-1 text-[11px] text-foreground/80"
                  >
                    <span className={cn("grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold text-white", s.color)}>
                      {s.avatarInitial}
                    </span>
                    {s.name}
                  </span>
                );
              })}
            </div>

            <div className="mt-5">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-accent">Agenda</div>
              <ul className="mt-2 space-y-1 text-[13px] text-foreground/85">
                {active.agenda.map((a, i) => (
                  <li key={i}>• {a}</li>
                ))}
              </ul>
            </div>

            <div className="mt-5 rounded-2xl bg-white/[0.03] p-4 text-[13px] leading-relaxed text-foreground/85">
              {active.transcript.split("\n\n").map((p, i) => (
                <p key={i} className={i === 2 ? "mt-3 italic text-accent" : "mt-1"}>
                  {p.replace(/\*\*|>/g, "")}
                </p>
              ))}
            </div>

            {active.unlocksDecisionId && (
              <button
                onClick={() => onOpenDecision(active.unlocksDecisionId!)}
                className="mt-6 rounded-full bg-accent px-5 py-2.5 text-[13px] font-semibold text-accent-foreground hover:opacity-90"
              >
                Make the decision →
              </button>
            )}
          </>
        ) : (
          <div className="grid h-full min-h-[300px] place-items-center text-muted-foreground">
            Select a meeting
          </div>
        )}
      </motion.div>
    </div>
  );
}
