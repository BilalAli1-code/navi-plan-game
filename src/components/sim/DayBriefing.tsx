import { Sunrise, Sparkles, ChevronRight, Moon } from "lucide-react";
import { useSim } from "@/lib/sim/store";
import { getDay, REQUIRED_ACTIVITIES, type DayActivityKey } from "@/lib/sim/days";
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
  const { state, days, completeActivity } = useSim();
  const day = getDay(state.currentDay);
  const c = getCaseRef(state.caseId);
  const dayRow = days.find((d) => d.day_number === state.currentDay);

  const flags: Record<DayActivityKey, boolean> = dayRow
    ? {
        briefing: dayRow.briefing_completed,
        learning: dayRow.learning_completed,
        workplace: dayRow.workplace_activities_completed,
        decisions: dayRow.decisions_completed,
        practice: dayRow.practice_completed,
        reflection: dayRow.reflection_completed,
      }
    : {
        briefing: false,
        learning: false,
        workplace: false,
        decisions: false,
        practice: false,
        reflection: false,
      };

  const dayDone = REQUIRED_ACTIVITIES.every((a) => flags[a]);

  // Case-agnostic "today's morning inbox" — three most recent unread emails.
  const morningInbox = useMemo(
    () =>
      [...state.emails]
        .filter((e) => !e.read)
        .sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1))
        .slice(0, 3),
    [state.emails],
  );

  // A meeting that unlocks a decision in the current phase — the "kickoff" or
  // primary meeting of the day. Case-agnostic: any casepack that adds a
  // phase-matching meeting will surface here.
  const focusMeeting = useMemo(
    () =>
      state.meetings.find((m) => {
        if (!m.unlocksDecisionId) return false;
        const dec = state.decisions.find((d) => d.id === m.unlocksDecisionId);
        return dec?.phase === day.phase;
      }) ?? state.meetings[0] ?? null,
    [state.meetings, state.decisions, day.phase],
  );

  function stakeholderName(id: string): string {
    // Rendered as-is; Stakeholders panel does the full lookup with avatars.
    return id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " ");
  }

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

      {/* Quick links to the morning surfaces */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {/* Morning inbox */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
              <Mail className="h-3.5 w-3.5 text-accent" /> Morning inbox
            </div>
            <button
              onClick={() => onOpenTab?.("inbox")}
              className="text-[10px] text-accent hover:underline"
            >
              Open
            </button>
          </div>
          {morningInbox.length === 0 ? (
            <div className="text-[11px] text-muted-foreground">Inbox clear ✓</div>
          ) : (
            <ul className="space-y-1">
              {morningInbox.map((e) => (
                <li key={e.id} className="truncate text-[11px] text-foreground/80">
                  <span className="text-muted-foreground">{stakeholderName(e.from)}: </span>
                  {e.subject}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Focus meeting */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
              <CalendarDays className="h-3.5 w-3.5 text-accent" /> Today's meeting
            </div>
            <button
              onClick={() => onOpenTab?.("meetings")}
              className="text-[10px] text-accent hover:underline"
            >
              Join
            </button>
          </div>
          {focusMeeting ? (
            <>
              <div className="text-[11px] font-semibold text-foreground">
                {focusMeeting.title}
              </div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">
                {focusMeeting.attendees.slice(0, 4).map(stakeholderName).join(" · ")}
                {focusMeeting.attendees.length > 4
                  ? ` +${focusMeeting.attendees.length - 4}`
                  : ""}
              </div>
            </>
          ) : (
            <div className="text-[11px] text-muted-foreground">No meeting queued today.</div>
          )}
        </div>

        {/* Stakeholders to engage */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
              <Users className="h-3.5 w-3.5 text-accent" /> People to engage
            </div>
            <button
              onClick={() => onOpenTab?.("stakeholders")}
              className="text-[10px] text-accent hover:underline"
            >
              Chat
            </button>
          </div>
          <ul className="space-y-1">
            {(focusMeeting?.attendees ?? ["sponsor", "team-lead"]).slice(0, 3).map((id) => (
              <li key={id} className="flex items-center gap-1 text-[11px] text-foreground/80">
                <ChevronRight className="h-3 w-3 text-accent" />
                {stakeholderName(id)}
              </li>
            ))}
          </ul>
        </div>
      </div>

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
