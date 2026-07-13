import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Lock, Clock, ChevronRight, Sparkles } from "lucide-react";
import { useSim } from "@/lib/sim/store";
import {
  DAY_PLAN,
  DAY_ACTIVITY_LABELS,
  DAY_ACTIVITY_MINUTES,
  REQUIRED_ACTIVITIES,
  TOTAL_DAYS,
  TOTAL_MINUTES,
  getDay,
  type DayActivityKey,
} from "@/lib/sim/days";
import { cn } from "@/lib/utils";
import { getCaseRef } from "@/lib/sim/cases";
import { PracticePanel } from "./PracticePanel";
import { FinalAssessment } from "./FinalAssessment";

export function DayDashboard({ onOpenTab }: { onOpenTab?: (tab: "inbox" | "meetings" | "documents" | "dashboard" | "stakeholders") => void }) {
  const { state, days, completeActivity, goToDay, saveDayReflection, loadDayReflection } = useSim();
  const c = getCaseRef(state.caseId);
  const day = getDay(state.currentDay);
  const dayRow = days.find((d) => d.day_number === state.currentDay);

  const totalCompletedMinutes = days.reduce((sum, d) => sum + (d.completed_minutes ?? 0), 0);
  const overallPct = Math.round((totalCompletedMinutes / TOTAL_MINUTES) * 100);
  const daysDone = days.filter((d) => d.status === "completed").length;

  const flags: Record<DayActivityKey, boolean> = dayRow
    ? {
        briefing: dayRow.briefing_completed,
        learning: dayRow.learning_completed,
        workplace: dayRow.workplace_activities_completed,
        decisions: dayRow.decisions_completed,
        practice: dayRow.practice_completed,
        reflection: dayRow.reflection_completed,
      }
    : { briefing: false, learning: false, workplace: false, decisions: false, practice: false, reflection: false };

  return (
    <div className="flex flex-col gap-5">
      {/* Program header */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-accent">7-Day Program</div>
            <h2 className="mt-0.5 text-[20px] font-bold text-foreground">
              Day {state.currentDay} of {TOTAL_DAYS} · {day.title}
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">{day.focus}</p>
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            <div>~7 hours total · ~1 hour/day</div>
            <div className="text-foreground/80">
              {Math.round(totalCompletedMinutes)} / {TOTAL_MINUTES} min ({overallPct}%)
            </div>
            <div>{daysDone} of {TOTAL_DAYS} days complete</div>
          </div>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-accent transition-all" style={{ width: `${overallPct}%` }} />
        </div>
      </div>

      {/* Day stepper */}
      <div className="grid grid-cols-7 gap-1.5">
        {DAY_PLAN.map((d) => {
          const row = days.find((r) => r.day_number === d.day);
          const status = row?.status ?? (d.day === 1 ? "available" : "locked");
          const isCurrent = state.currentDay === d.day;
          const locked = status === "locked";
          return (
            <button
              key={d.day}
              disabled={locked}
              onClick={() => goToDay(d.day)}
              className={cn(
                "rounded-xl border p-2 text-left text-[10px] transition",
                isCurrent
                  ? "border-accent bg-accent/15 text-foreground"
                  : status === "completed"
                    ? "border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/10 text-foreground/80"
                    : locked
                      ? "cursor-not-allowed border-white/5 bg-white/[0.02] text-muted-foreground/50"
                      : "border-white/10 bg-white/[0.02] text-foreground/70 hover:border-accent/30",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">Day {d.day}</span>
                {status === "completed" ? (
                  <CheckCircle2 className="h-3 w-3 text-[color:var(--color-success)]" />
                ) : locked ? (
                  <Lock className="h-3 w-3" />
                ) : null}
              </div>
              <div className="mt-0.5 truncate text-[9px] opacity-80">{d.title}</div>
            </button>
          );
        })}
      </div>

      {/* Today's activities */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <div className="text-[12px] font-semibold text-foreground">Today's activities (~60 min)</div>
          <div className="text-[11px] text-muted-foreground">
            {dayRow?.completion_percentage ?? 0}% complete · {dayRow?.completed_minutes ?? 0}/60 min
          </div>
        </div>
        <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-[color:var(--color-success)] transition-all"
            style={{ width: `${dayRow?.completion_percentage ?? 0}%` }}
          />
        </div>

        <ul className="space-y-1.5">
          {REQUIRED_ACTIVITIES.map((a) => (
            <li
              key={a}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2"
            >
              <button
                onClick={() => completeActivity(state.currentDay, a)}
                disabled={flags[a]}
                aria-label={flags[a] ? "Completed" : `Mark ${a} complete`}
                className="shrink-0"
              >
                {flags[a] ? (
                  <CheckCircle2 className="h-5 w-5 text-[color:var(--color-success)]" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground hover:text-accent" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className={cn("text-[13px]", flags[a] ? "text-muted-foreground line-through" : "text-foreground")}>
                  {DAY_ACTIVITY_LABELS[a]}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-muted-foreground">
                <Clock className="h-3 w-3" /> {DAY_ACTIVITY_MINUTES[a]} min
              </span>
              {a === "workplace" && !flags[a] && onOpenTab && (
                <button
                  onClick={() => onOpenTab("inbox")}
                  className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-accent-foreground"
                >
                  Open inbox
                </button>
              )}
              {a === "decisions" && !flags[a] && onOpenTab && (
                <button
                  onClick={() => onOpenTab("inbox")}
                  className="rounded-full bg-accent px-2 py-1 text-[10px] font-semibold text-accent-foreground"
                >
                  Make decisions
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Objectives */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="mb-2 text-[12px] font-semibold text-foreground">Objectives for {day.title}</div>
        <ul className="space-y-1">
          {day.objectives.map((o) => (
            <li key={o} className="flex gap-2 text-[13px] text-foreground/80">
              <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Reflection */}
      <ReflectionCard
        day={state.currentDay}
        completed={flags.reflection}
        onSave={(payload) => saveDayReflection(state.currentDay, payload)}
        onLoad={() => loadDayReflection(state.currentDay)}
      />

      <div className="rounded-2xl border border-accent/20 bg-accent/[0.06] p-3 text-[12px] text-foreground/80">
        <Sparkles className="mr-1 inline h-3.5 w-3.5 text-accent" />
        Progress saves automatically after every activity — pause any time, resume on any device.
        <span className="ml-1 text-muted-foreground">Project: {c.projectName}</span>
      </div>
    </div>
  );
}

function ReflectionCard({
  day,
  completed,
  onSave,
  onLoad,
}: {
  day: number;
  completed: boolean;
  onSave: (p: {
    whatWentWell?: string;
    whatWasChallenging?: string;
    whatWouldChange?: string;
    keyLearning?: string;
  }) => Promise<void>;
  onLoad: () => Promise<{
    what_went_well: string | null;
    what_was_challenging: string | null;
    what_would_change: string | null;
    key_learning: string | null;
  } | null>;
}) {
  const [well, setWell] = useState("");
  const [challenging, setChallenging] = useState("");
  const [change, setChange] = useState("");
  const [learning, setLearning] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSaved(false);
    void onLoad().then((r) => {
      if (cancelled || !r) return;
      setWell(r.what_went_well ?? "");
      setChallenging(r.what_was_challenging ?? "");
      setChange(r.what_would_change ?? "");
      setLearning(r.key_learning ?? "");
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [day]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <div className="text-[12px] font-semibold text-foreground">Daily reflection</div>
        {completed && <span className="text-[11px] text-[color:var(--color-success)]">Reflection recorded ✓</span>}
      </div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        <Field label="What went well?" value={well} onChange={setWell} />
        <Field label="What was challenging?" value={challenging} onChange={setChallenging} />
        <Field label="What would you change?" value={change} onChange={setChange} />
        <Field label="Key learning" value={learning} onChange={setLearning} />
      </div>
      <div className="mt-3 flex justify-end">
        <button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await onSave({
                whatWentWell: well,
                whatWasChallenging: challenging,
                whatWouldChange: change,
                keyLearning: learning,
              });
              setSaved(true);
            } finally {
              setSaving(false);
            }
          }}
          className="rounded-full bg-accent px-4 py-1.5 text-[12px] font-semibold text-accent-foreground disabled:opacity-50"
        >
          {saving ? "Saving…" : saved ? "Saved" : "Save reflection"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-muted-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] p-2 text-[12px] text-foreground focus:border-accent focus:outline-none"
      />
    </label>
  );
}
