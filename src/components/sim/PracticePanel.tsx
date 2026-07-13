import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, XCircle, Sparkles, Loader2, Play, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSim } from "@/lib/sim/store";
import {
  startPracticeSession,
  submitPracticeAnswer,
  completePracticeSession,
  getPracticeSession,
  type PracticeQuestion,
} from "@/lib/sim/practice.functions";

type Attempt = {
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  feedback: {
    why: string;
    strongerOption: { label: string; rationale: string } | null;
    alternatives: Array<{ label: string; why: string }>;
    pmbokPrinciple: string;
    pmbokDomain: string;
    ecoDomain: string;
    competency: string;
    takeaway: string;
  };
};

type Session = {
  id: string;
  status: string;
  total_questions: number;
  correct_answers: number;
  score: number;
  questions: PracticeQuestion[];
  day_number: number;
};

export function PracticePanel({ runId, dayNumber }: { runId: string; dayNumber: number }) {
  const startFn = useServerFn(startPracticeSession);
  const submitFn = useServerFn(submitPracticeAnswer);
  const completeFn = useServerFn(completePracticeSession);
  const getFn = useServerFn(getPracticeSession);
  const { refreshDays } = useSim();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const attemptsByQ = useMemo(() => {
    const m = new Map<string, Attempt>();
    for (const a of attempts) m.set(a.question_id, a);
    return m;
  }, [attempts]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFn({ data: { runId, dayNumber } });
      setSession(res.session as Session | null);
      setAttempts((res.attempts ?? []) as Attempt[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load practice");
    } finally {
      setLoading(false);
    }
  }, [getFn, runId, dayNumber]);

  useEffect(() => {
    void load();
  }, [load]);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await startFn({ data: { runId, dayNumber } });
      setSession(res.session as Session);
      setAttempts((res.attempts ?? []) as Attempt[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start practice");
    } finally {
      setLoading(false);
    }
  }

  async function submit(q: PracticeQuestion, optionId: string) {
    if (!session) return;
    setSubmitting(q.id);
    setError(null);
    try {
      const res = await submitFn({
        data: { sessionId: session.id, questionId: q.id, selectedOptionId: optionId },
      });
      setAttempts((prev) => [
        ...prev.filter((a) => a.question_id !== q.id),
        {
          question_id: q.id,
          selected_answer: optionId,
          is_correct: res.isCorrect,
          feedback: res.feedback,
        } as Attempt,
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save answer");
    } finally {
      setSubmitting(null);
    }
  }

  async function complete() {
    if (!session) return;
    setCompleting(true);
    setError(null);
    try {
      const res = await completeFn({ data: { sessionId: session.id } });
      setSession({ ...session, status: "completed", correct_answers: res.correct, score: res.score });
      await refreshDays();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not complete practice");
    } finally {
      setCompleting(false);
    }
  }

  if (loading && !session) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-[13px] text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading practice…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-accent" /> Adaptive practice — Day {dayNumber} (~10 min)
        </div>
        <p className="mb-3 text-[12px] text-muted-foreground">
          Answer 5 adaptive PMP-style questions targeted at your simulation performance so far. Practice completes
          automatically once every question is answered.
        </p>
        {error && <div className="mb-2 text-[11px] text-[color:var(--color-destructive)]">{error}</div>}
        <button
          onClick={start}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[12px] font-semibold text-accent-foreground disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5" /> Start practice
        </button>
      </div>
    );
  }

  const questions = session.questions ?? [];
  const answered = attempts.length;
  const total = questions.length;
  const done = session.status === "completed";
  const allAnswered = answered >= total;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-accent" /> Adaptive practice — Day {dayNumber}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {answered}/{total} answered {done && `· ${session.score}%`}
        </div>
      </div>

      {error && <div className="mb-2 text-[11px] text-[color:var(--color-destructive)]">{error}</div>}

      <ol className="space-y-4">
        {questions.map((q, idx) => {
          const attempt = attemptsByQ.get(q.id);
          return (
            <li key={q.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                <span>Q{idx + 1}</span>
                <span className="rounded-full bg-white/10 px-1.5 py-0.5">{q.ecoDomain}</span>
                <span className="rounded-full bg-white/10 px-1.5 py-0.5">{q.pmbokDomain}</span>
                <span className="rounded-full bg-white/10 px-1.5 py-0.5">{q.difficulty}</span>
              </div>
              <div className="mb-2 text-[13px] text-foreground">{q.prompt}</div>
              <div className="grid gap-1.5">
                {q.options.map((o) => {
                  const isPicked = attempt?.selected_answer === o.id;
                  const isCorrect = attempt && o.id === q.correctOptionId;
                  const answeredThis = !!attempt;
                  return (
                    <button
                      key={o.id}
                      disabled={answeredThis || submitting === q.id}
                      onClick={() => submit(q, o.id)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-left text-[12px] transition",
                        !answeredThis && "border-white/10 bg-white/[0.03] hover:border-accent/40",
                        answeredThis && isPicked && attempt?.is_correct &&
                          "border-[color:var(--color-success)]/50 bg-[color:var(--color-success)]/10",
                        answeredThis && isPicked && !attempt?.is_correct &&
                          "border-[color:var(--color-destructive)]/50 bg-[color:var(--color-destructive)]/10",
                        answeredThis && !isPicked && isCorrect &&
                          "border-[color:var(--color-success)]/40",
                        answeredThis && !isPicked && !isCorrect && "opacity-60",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {answeredThis && isPicked ? (
                          attempt.is_correct ? (
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-[color:var(--color-success)]" />
                          ) : (
                            <XCircle className="mt-0.5 h-3.5 w-3.5 text-[color:var(--color-destructive)]" />
                          )
                        ) : (
                          <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border border-white/20" />
                        )}
                        <span>{o.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {attempt && (
                <div className="mt-2 rounded-lg bg-white/[0.04] p-2.5 text-[11.5px] leading-relaxed">
                  <div className={cn("font-semibold", attempt.is_correct ? "text-[color:var(--color-success)]" : "text-[color:var(--color-warning)]")}>
                    {attempt.is_correct ? "Effective response" : "Not the strongest option"}
                  </div>
                  <div className="mt-1 text-foreground/80">{attempt.feedback.why}</div>
                  {attempt.feedback.strongerOption && (
                    <div className="mt-1.5 text-foreground/80">
                      <span className="font-semibold text-accent">Stronger option: </span>
                      {attempt.feedback.strongerOption.label} — {attempt.feedback.strongerOption.rationale}
                    </div>
                  )}
                  {attempt.feedback.alternatives.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 text-muted-foreground">
                      {attempt.feedback.alternatives.map((a) => (
                        <li key={a.label}>• {a.label}: {a.why}</li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                    <span className="rounded-full bg-white/10 px-1.5 py-0.5">Principle: {attempt.feedback.pmbokPrinciple}</span>
                    <span className="rounded-full bg-white/10 px-1.5 py-0.5">ECO: {attempt.feedback.ecoDomain}</span>
                    <span className="rounded-full bg-white/10 px-1.5 py-0.5">{attempt.feedback.competency}</span>
                  </div>
                  <div className="mt-1.5 text-foreground/85"><span className="font-semibold">Takeaway:</span> {attempt.feedback.takeaway}</div>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-[11px] text-muted-foreground">
          {done ? (
            <span className="text-[color:var(--color-success)]">Practice completed · mastery updated ✓</span>
          ) : allAnswered ? (
            "All questions answered — submit to finalize and update mastery."
          ) : (
            `${total - answered} question${total - answered === 1 ? "" : "s"} remaining`
          )}
        </div>
        {!done && (
          <button
            disabled={!allAnswered || completing}
            onClick={complete}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-[12px] font-semibold text-accent-foreground disabled:opacity-40"
          >
            {completing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Submit & complete
          </button>
        )}
        {done && (
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        )}
      </div>
    </div>
  );
}
