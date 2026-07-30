import { Sunrise, Sparkles, ChevronRight, Moon } from "lucide-react";
import { useSim } from "@/lib/sim/store";
import { getDay } from "@/lib/sim/days";
import { getCaseRef } from "@/lib/sim/cases";
import { cn } from "@/lib/utils";

type OpenTab = "inbox" | "meetings" | "documents" | "dashboard" | "stakeholders";

/**
 * DayBriefing — engine-generic morning briefing card.
 *
 * - Shows the day's story-driven morning briefing (from days.ts)
 * - Highlights today's fresh inbox items and any meeting that unlocks a decision
 *   this phase (drawn from the shared sim state — case-agnostic)
 * - Quick-links to workplace tabs and stakeholders
 * - Reveals the end-of-day story hook once all required activities are done
 */
export function DayBriefing({ onOpenTab }: { onOpenTab?: (tab: OpenTab) => void }) {
  const { state, projection, completeActivity } = useSim();
  const day = getDay(state.currentDay);
  const c = getCaseRef(state.caseId);
  const currentDay = projection.currentDay;
  const flags = currentDay.activities;
  const dayDone = currentDay.status === "completed";

  return (
    <div className="rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/[0.08] via-white/[0.02] to-transparent p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-accent">
            <Sunrise className="h-3.5 w-3.5" />
            Chapter {state.currentDay} of 7
            {(day.inWorldStart || day.inWorldEnd) && (
              <span className="text-muted-foreground normal-case tracking-normal">
                · {day.inWorldStart === day.inWorldEnd
                  ? day.inWorldStart
                  : `${day.inWorldStart ?? ""} – ${day.inWorldEnd ?? ""}`}
              </span>
            )}
          </div>
          <h3 className="mt-1 text-[17px] font-bold text-foreground">
            {day.title}
          </h3>
          {day.storyTheme && (
            <p className="mt-0.5 text-[12px] italic text-accent/80">"{day.storyTheme}"</p>
          )}
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {c.projectName} · Lifecycle: {day.phase}
          </p>
        </div>
        {!flags.briefing && (
          <button
            onClick={() => void completeActivity(state.currentDay, "briefing")}
            className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold text-accent-foreground"
          >
            Mark briefing read
          </button>
        )}
        {flags.briefing && (
          <span className="shrink-0 rounded-full bg-[color:var(--color-success)]/15 px-3 py-1.5 text-[11px] font-semibold text-[color:var(--color-success)]">
            Briefing read ✓
          </span>
        )}
      </div>

      <p className="mt-3 text-[13.5px] leading-relaxed text-foreground/85">
        {day.briefing}
      </p>


      {/* Objectives (compact) */}
      <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3">
        <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          <Sparkles className="h-3 w-3 text-accent" /> Today, you will…
        </div>
        <ul className="grid gap-0.5 sm:grid-cols-2">
          {day.objectives.map((o) => (
            <li key={o} className="flex gap-1.5 text-[12px] text-foreground/80">
              <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* End-of-day story hook — revealed once all activities are done */}
      <div
        className={cn(
          "mt-4 rounded-xl border p-3 transition",
          dayDone
            ? "border-accent/40 bg-accent/[0.1]"
            : "border-white/10 bg-white/[0.02] opacity-70",
        )}
      >
        <div className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-accent">
          <Moon className="h-3 w-3" /> End of Day {state.currentDay}
        </div>
        <p className="text-[12.5px] leading-relaxed text-foreground/85">
          {dayDone
            ? day.storyHook
            : "Finish today's briefing, meetings, decisions, and reflection to unlock tonight's story hook."}
        </p>
      </div>
    </div>
  );
}
