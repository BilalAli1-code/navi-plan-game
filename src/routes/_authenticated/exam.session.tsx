import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useExamState, formatDuration } from "@/lib/exam/exam-state";
import { getQuestionById } from "@/lib/exam/question-service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Coffee,
  Flag,
  ListChecks,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/exam/session")({
  head: () => ({
    meta: [
      { title: "PMP Exam — In Progress" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ExamSessionView,
});

function ExamSessionView() {
  const navigate = useNavigate();
  const {
    session,
    answerQuestion,
    toggleMark,
    goToIndex,
    startBreak,
    endBreak,
    submitExam,
  } = useExamState();
  const [showReview, setShowReview] = useState(false);

  // Auto-submit when time runs out.
  useEffect(() => {
    if (!session) return;
    if (session.remainingMs <= 0 && session.status === "in_progress") {
      const report = submitExam();
      if (report) navigate({ to: "/exam/report/$reportId", params: { reportId: report.id } });
    }
  }, [session, submitExam, navigate]);

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">No exam in progress.</p>
          <Link to="/exam" className="mt-3 inline-block text-primary hover:underline">
            Return to exam menu
          </Link>
        </div>
      </div>
    );
  }

  const currentId = session.questionIds[session.currentIndex];
  const question = getQuestionById(currentId);
  const currentAnswer = session.answers[currentId];

  if (session.status === "on_break") {
    return <BreakScreen onResume={endBreak} remainingMs={session.remainingMs} />;
  }

  if (showReview) {
    return (
      <ReviewScreen
        onClose={() => setShowReview(false)}
        onSubmit={() => {
          const report = submitExam();
          if (report)
            navigate({
              to: "/exam/report/$reportId",
              params: { reportId: report.id },
            });
        }}
      />
    );
  }

  if (!question) return null;

  const answeredCount = Object.values(session.answers).filter(
    (a) => a.selectedOptionId,
  ).length;
  const markedCount = Object.values(session.answers).filter(
    (a) => a.markedForReview,
  ).length;
  const progressPct = Math.round(
    ((session.currentIndex + 1) / session.questionIds.length) * 100,
  );
  const lowTime = session.remainingMs < 10 * 60_000;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-10 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium">
              Q{session.currentIndex + 1} / {session.questionIds.length}
            </span>
            <Badge variant="secondary">{question.domain}</Badge>
            <Badge variant="outline">{question.difficulty}</Badge>
            <span className="text-muted-foreground">{question.knowledgeArea}</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "rounded-md border px-3 py-1 font-mono text-sm",
                lowTime
                  ? "border-rose-500/60 text-rose-300"
                  : "border-border/60 text-foreground",
              )}
            >
              {formatDuration(session.remainingMs)}
            </div>
            <Button variant="ghost" size="sm" onClick={startBreak}>
              <Coffee className="mr-1.5 h-4 w-4" /> Break
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowReview(true)}>
              <ListChecks className="mr-1.5 h-4 w-4" /> Review & submit
            </Button>
          </div>
        </div>
        <Progress value={progressPct} className="h-1 rounded-none" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1fr_240px]">
        <div>
          <Card className="border-border/60 p-6">
            <h2 className="text-lg font-medium leading-relaxed">
              {question.question}
            </h2>
            <div className="mt-6 space-y-3">
              {question.options.map((opt) => {
                const selected = currentAnswer?.selectedOptionId === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => answerQuestion(question.id, opt.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition",
                      selected
                        ? "border-primary bg-primary/10"
                        : "border-border/60 hover:border-primary/40 hover:bg-muted/40",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs font-semibold",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {opt.id}
                    </span>
                    <span className="text-sm">{opt.text}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Button
                variant={currentAnswer?.markedForReview ? "default" : "outline"}
                size="sm"
                onClick={() => toggleMark(question.id)}
              >
                <Bookmark className="mr-1.5 h-4 w-4" />
                {currentAnswer?.markedForReview
                  ? "Marked for review"
                  : "Mark for review"}
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => goToIndex(session.currentIndex - 1)}
                  disabled={session.currentIndex === 0}
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Previous
                </Button>
                {session.currentIndex === session.questionIds.length - 1 ? (
                  <Button onClick={() => setShowReview(true)}>
                    <Flag className="mr-1.5 h-4 w-4" /> Finish
                  </Button>
                ) : (
                  <Button onClick={() => goToIndex(session.currentIndex + 1)}>
                    Next <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
            <Card className="p-3">
              <div className="text-lg font-semibold text-foreground">
                {answeredCount}
              </div>
              Answered
            </Card>
            <Card className="p-3">
              <div className="text-lg font-semibold text-foreground">
                {session.questionIds.length - answeredCount}
              </div>
              Remaining
            </Card>
            <Card className="p-3">
              <div className="text-lg font-semibold text-foreground">
                {markedCount}
              </div>
              Marked
            </Card>
          </div>
        </div>

        <QuestionNav />
      </div>
    </div>
  );
}

function QuestionNav() {
  const { session, goToIndex } = useExamState();
  if (!session) return null;
  return (
    <Card className="h-fit border-border/60 p-3">
      <div className="mb-2 text-xs font-medium text-muted-foreground">
        Navigator
      </div>
      <div className="grid grid-cols-6 gap-1.5">
        {session.questionIds.map((qid, i) => {
          const ans = session.answers[qid];
          const current = i === session.currentIndex;
          return (
            <button
              key={qid + i}
              onClick={() => goToIndex(i)}
              className={cn(
                "relative h-7 rounded text-[10px] font-medium transition",
                current
                  ? "bg-primary text-primary-foreground"
                  : ans?.selectedOptionId
                    ? "bg-primary/25 text-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted",
                ans?.markedForReview &&
                  "ring-1 ring-amber-400 ring-offset-1 ring-offset-background",
              )}
              title={
                ans?.markedForReview ? "Marked for review" : "Go to question"
              }
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-3 space-y-1 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" />
          Current
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary/25" />
          Answered
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-muted/60" />
          Unanswered
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm ring-1 ring-amber-400" />
          Marked
        </div>
      </div>
    </Card>
  );
}

function BreakScreen({
  onResume,
  remainingMs,
}: {
  onResume: () => void;
  remainingMs: number;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <Card className="max-w-lg p-8 text-center">
        <Coffee className="mx-auto h-8 w-8 text-primary" />
        <h1 className="mt-3 text-2xl font-semibold">On break</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The exam timer is paused. Return whenever you're ready — no elapsed time
          will be deducted.
        </p>
        <div className="mt-4 rounded-md border border-border/60 p-3 font-mono text-lg">
          {formatDuration(remainingMs)} remaining
        </div>
        <Button className="mt-6" onClick={onResume}>
          Resume exam
        </Button>
      </Card>
    </div>
  );
}

function ReviewScreen({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: () => void;
}) {
  const { session, goToIndex } = useExamState();
  const summary = useMemo(() => {
    if (!session)
      return { answered: 0, unanswered: 0, marked: 0, marked_unanswered: 0 };
    let answered = 0;
    let unanswered = 0;
    let marked = 0;
    let markedUnanswered = 0;
    for (const qid of session.questionIds) {
      const a = session.answers[qid];
      if (a?.selectedOptionId) answered += 1;
      else unanswered += 1;
      if (a?.markedForReview) {
        marked += 1;
        if (!a.selectedOptionId) markedUnanswered += 1;
      }
    }
    return { answered, unanswered, marked, marked_unanswered: markedUnanswered };
  }, [session]);

  if (!session) return null;
  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-semibold">Review before submission</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Verify your answers. You can jump back to any question or submit now.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <Stat label="Answered" value={summary.answered} tone="text-emerald-400" />
          <Stat label="Unanswered" value={summary.unanswered} tone="text-rose-400" />
          <Stat label="Marked" value={summary.marked} tone="text-amber-400" />
          <Stat
            label="Marked & unanswered"
            value={summary.marked_unanswered}
            tone="text-rose-300"
          />
        </div>
        <Card className="mt-6 border-border/60 p-4">
          <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-12">
            {session.questionIds.map((qid, i) => {
              const a = session.answers[qid];
              return (
                <button
                  key={qid + i}
                  onClick={() => {
                    goToIndex(i);
                    onClose();
                  }}
                  className={cn(
                    "h-8 rounded text-xs font-medium",
                    a?.selectedOptionId
                      ? "bg-primary/25 text-foreground"
                      : "bg-muted/50 text-muted-foreground",
                    a?.markedForReview &&
                      "ring-1 ring-amber-400 ring-offset-1 ring-offset-background",
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </Card>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Back to exam
          </Button>
          <Button
            onClick={() => {
              if (
                summary.unanswered > 0 &&
                !confirm(
                  `You have ${summary.unanswered} unanswered questions. Submit anyway?`,
                )
              )
                return;
              onSubmit();
            }}
          >
            Submit exam
          </Button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <Card className="p-4">
      <div className={cn("text-2xl font-semibold", tone)}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </Card>
  );
}
