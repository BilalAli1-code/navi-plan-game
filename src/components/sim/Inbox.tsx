import { motion } from "framer-motion";
import { useState } from "react";
import { Mail, Circle } from "lucide-react";
import { useSim } from "@/lib/sim/store";
import { stakeholdersFor } from "@/lib/sim/cases";
import { cn } from "@/lib/utils";

export function Inbox({ onOpenDecision }: { onOpenDecision: (id: string) => void }) {
  const { state, markEmailRead } = useSim();
  const stakes = stakeholdersFor(state.caseId);
  const [openId, setOpenId] = useState<string | null>(state.emails[0]?.id ?? null);
  const active = state.emails.find((e) => e.id === openId) ?? null;

  function open(id: string) {
    setOpenId(id);
    markEmailRead(id);
  }

  function findStake(id: string) {
    return stakes.find((s) => s.id === id) ?? stakes[0];
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(280px,340px)_1fr]">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
            <Mail className="h-4 w-4 text-accent" />
            Inbox
          </div>
          <div className="text-[11px] text-muted-foreground">
            {state.emails.filter((e) => !e.read).length} unread
          </div>
        </div>
        <ul className="max-h-[520px] overflow-y-auto">
          {state.emails.map((e) => {
            const s = findStake(e.from);
            const selected = openId === e.id;
            return (
              <li key={e.id}>
                <button
                  onClick={() => open(e.id)}
                  className={cn(
                    "flex w-full gap-3 border-b border-white/5 px-4 py-3 text-left transition",
                    selected ? "bg-white/[0.06]" : "hover:bg-white/[0.03]",
                  )}
                >
                  <div
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-bold text-white",
                      s.color,
                    )}
                  >
                    {s.avatarInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("truncate text-[13px]", !e.read ? "font-semibold text-foreground" : "text-foreground/70")}>
                        {s.name}
                      </span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {new Date(e.receivedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div className={cn("mt-0.5 truncate text-[12px]", !e.read ? "font-medium text-foreground/90" : "text-muted-foreground")}>
                      {e.subject}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-muted-foreground">{e.preview}</div>
                  </div>
                  {!e.read && <Circle className="mt-1 h-2 w-2 shrink-0 fill-accent text-accent" />}
                </button>
              </li>
            );
          })}
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
            <div className="mb-4 flex items-start gap-3">
              <div
                className={cn(
                  "grid h-11 w-11 shrink-0 place-items-center rounded-full text-[14px] font-bold text-white",
                  findStake(active.from).color,
                )}
              >
                {findStake(active.from).avatarInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold text-foreground">{findStake(active.from).name}</div>
                <div className="text-[12px] text-muted-foreground">
                  {findStake(active.from).role} · {new Date(active.receivedAt).toLocaleString()}
                </div>
              </div>
            </div>
            <h3 className="text-[18px] font-bold text-foreground">{active.subject}</h3>
            <div className="prose prose-invert mt-3 max-w-none whitespace-pre-wrap text-[14px] leading-relaxed text-foreground/85">
              {active.body.replace(/\*\*/g, "")}
            </div>
            {active.unlocksDecisionId && (
              <button
                onClick={() => onOpenDecision(active.unlocksDecisionId!)}
                className="mt-6 rounded-full bg-accent px-5 py-2.5 text-[13px] font-semibold text-accent-foreground hover:opacity-90"
              >
                Respond with a decision →
              </button>
            )}
          </>
        ) : (
          <div className="grid h-full min-h-[300px] place-items-center text-muted-foreground">
            Select an email to read
          </div>
        )}
      </motion.div>
    </div>
  );
}
