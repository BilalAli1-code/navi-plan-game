import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useExamState, formatDuration } from "@/lib/exam/exam-state";
import { MINI_MIX, PMP_MIX, QUESTION_BANK } from "@/lib/exam/question-service";
import { getLevel } from "@/lib/exam/gamification";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Flame, GraduationCap, Play, RotateCw, Trophy } from "lucide-react";
import { ALL_ACHIEVEMENT_RULES } from "@/lib/exam/gamification";

export const Route = createFileRoute("/_authenticated/exam/")({
  head: () => ({
    meta: [
      { title: "PMP Exam Simulator — ProjectSim" },
      {
        name: "description",
        content:
          "Full-length 180-question PMP exam simulator with adaptive coaching, analytics and gamified progression.",
      },
    ],
  }),
  component: ExamLanding,
});

function ExamLanding() {
  const navigate = useNavigate();
  const {
    session,
    history,
    gamification,
    startExam,
    resumeExam,
    abandonExam,
  } = useExamState();
  const level = getLevel(gamification.xp);
  const bankSize = QUESTION_BANK.length;

  const goToSession = () => navigate({ to: "/exam/session" });

  return (
    <AppShell variant="app">
      <div className="mx-auto max-w-6xl px-6 py-10">

        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              PMP Exam Simulator
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Take the exam. Track your readiness.
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Realistic 180-question full exam, mini-exams for daily practice, and
              a professional readiness report after every attempt.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-border/60 bg-card px-4 py-3">
              <div className="text-xs text-muted-foreground">Current level</div>
              <div className="text-lg font-semibold">{level.current.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {gamification.xp} XP
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card px-4 py-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Flame className="h-3.5 w-3.5 text-amber-400" /> Streak
              </div>
              <div className="text-lg font-semibold">
                {gamification.streakDays} days
              </div>
            </div>
          </div>
        </header>

        {session && (
          <Card className="mb-8 border-primary/40 bg-primary/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm uppercase tracking-widest text-primary">
                  Exam in progress
                </div>
                <div className="mt-1 text-lg font-medium">
                  {session.mode === "full" ? "Full PMP exam" : "Mini exam"} —{" "}
                  {Object.values(session.answers).filter((a) => a.selectedOptionId).length}
                  /{session.questionIds.length} answered
                </div>
                <div className="text-xs text-muted-foreground">
                  Time remaining: {formatDuration(session.remainingMs)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (confirm("Abandon this exam? Progress will be lost."))
                      abandonExam();
                  }}
                >
                  Abandon
                </Button>
                <Button
                  onClick={() => {
                    resumeExam();
                    goToSession();
                  }}
                >
                  <RotateCw className="mr-2 h-4 w-4" /> Resume exam
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          <ExamOption
            title="Full PMP Exam"
            subtitle="180 questions · 230 min"
            description="Complete PMP mix across People, Process, and Business. Includes optional breaks and mark-for-review."
            cta="Start full exam"
            disabled={!!session}
            onClick={() => {
              startExam(PMP_MIX, "full");
              goToSession();
            }}
          />
          <ExamOption
            title="Mini Exam"
            subtitle="20 questions · 30 min"
            description="Quick daily reps with the same PMP domain mix. Great for maintaining your streak."
            cta="Start mini exam"
            disabled={!!session}
            onClick={() => {
              startExam(MINI_MIX, "mini");
              goToSession();
            }}
          />
          <Card className="border-border/60 bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Trophy className="h-4 w-4 text-amber-400" /> Career progression
            </div>
            <div className="mt-3 text-2xl font-semibold">
              {level.current.name}
            </div>
            {level.next && (
              <>
                <div className="mt-1 text-xs text-muted-foreground">
                  {level.next.minXp - gamification.xp} XP to {level.next.name}
                </div>
                <Progress value={level.progressPct} className="mt-3" />
              </>
            )}
            <div className="mt-4 text-xs text-muted-foreground">
              Bank: {bankSize} questions loaded (JSON-driven — add more anytime).
            </div>
          </Card>
        </div>

        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Achievements</h2>
            <Link to="/analytics" className="text-sm text-primary hover:underline">
              Open analytics →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_ACHIEVEMENT_RULES.map((rule) => {
              const earned = gamification.achievements.find(
                (a) => a.id === rule.id,
              );
              return (
                <Card
                  key={rule.id}
                  className={
                    "p-4 " +
                    (earned
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-border/60 opacity-80")
                  }
                >
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <GraduationCap
                      className={
                        "h-4 w-4 " +
                        (earned ? "text-emerald-400" : "text-muted-foreground")
                      }
                    />
                    {rule.name}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {rule.description}
                  </p>
                  {earned && (
                    <Badge className="mt-3 bg-emerald-500/20 text-emerald-300">
                      Earned
                    </Badge>
                  )}
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent exam history</h2>
            <div className="flex items-center gap-4 text-sm">
              <Link to="/exam/history" className="text-primary hover:underline">
                Compare attempts →
              </Link>
              <Link to="/analytics" className="text-primary hover:underline">
                Full analytics →
              </Link>
            </div>
          </div>
          {history.length === 0 ? (
            <Card className="border-dashed p-6 text-center text-sm text-muted-foreground">
              No completed exams yet. Start one above to see your readiness score.
            </Card>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 6).map((r) => (
                <Link
                  key={r.id}
                  to="/exam/report/$reportId"
                  params={{ reportId: r.id }}
                  className="block"
                >
                  <Card className="flex flex-wrap items-center justify-between gap-3 border-border/60 p-4 transition hover:border-primary/60">
                    <div>
                      <div className="text-sm font-medium">
                        {new Date(r.completedAt).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {r.totalQuestions} questions ·{" "}
                        {formatDuration(r.durationTakenMs)}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Score</div>
                        <div className="text-lg font-semibold">
                          {r.overallPercent}%
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Pass prob.
                        </div>
                        <div className="text-lg font-semibold">
                          {r.passProbability}%
                        </div>
                      </div>
                      <Badge>{r.readiness}</Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function ExamOption({
  title,
  subtitle,
  description,
  cta,
  disabled,
  onClick,
}: {
  title: string;
  subtitle: string;
  description: string;
  cta: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Card className="flex flex-col justify-between border-border/60 bg-card p-5">
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
      </div>
      <Button className="mt-4" disabled={disabled} onClick={onClick}>
        <Play className="mr-2 h-4 w-4" /> {cta}
      </Button>
    </Card>
  );
}
