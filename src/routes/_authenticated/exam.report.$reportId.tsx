import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useExamState, formatDuration } from "@/lib/exam/exam-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Sparkles, TrendingDown, TrendingUp, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/exam/report/$reportId")({
  head: () => ({
    meta: [{ title: "PMP Exam Report" }, { name: "robots", content: "noindex" }],
  }),
  component: ReportView,
});

function ReportView() {
  const { reportId } = useParams({ from: "/_authenticated/exam/report/$reportId" });
  const { history } = useExamState();
  const report = history.find((r) => r.id === reportId);

  if (!report) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Report not found.</p>
          <Link to="/exam" className="mt-3 inline-block text-primary hover:underline">
            Back to exam menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Exam Report · {new Date(report.completedAt).toLocaleString()}
          </div>
          <h1 className="mt-1 text-3xl font-semibold">
            {report.readiness}
            <span className="ml-3 text-muted-foreground">
              — {report.overallPercent}% overall
            </span>
          </h1>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="Overall score" value={`${report.overallPercent}%`} />
          <Metric
            label="Estimated pass probability"
            value={`${report.passProbability}%`}
          />
          <Metric label="Readiness" value={report.readiness} />
        </div>

        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Domain performance</h2>
          <div className="space-y-3">
            {report.domainScores.map((d) => (
              <div key={d.domain} className="rounded-lg border border-border/60 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium">{d.domain}</span>
                  <span className="text-muted-foreground">
                    {d.correct}/{d.total} · {d.percent}%
                  </span>
                </div>
                <Progress value={d.percent} />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2">
          <Card className="border-emerald-500/30 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-300">
              <TrendingUp className="h-4 w-4" /> Strongest topics
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {report.strongestTopics.map((t) => (
                <li key={t}>• {t}</li>
              ))}
              {report.strongestTopics.length === 0 && (
                <li className="text-muted-foreground">Not enough data.</li>
              )}
            </ul>
          </Card>
          <Card className="border-rose-500/30 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-rose-300">
              <TrendingDown className="h-4 w-4" /> Weakest topics
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {report.weakestTopics.map((t) => (
                <li key={t}>• {t}</li>
              ))}
              {report.weakestTopics.length === 0 && (
                <li className="text-muted-foreground">Not enough data.</li>
              )}
            </ul>
          </Card>
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Knowledge area breakdown</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {report.knowledgeAreaScores.map((k) => (
              <div
                key={k.knowledgeArea}
                className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm"
              >
                <span>{k.knowledgeArea}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {k.correct}/{k.total}
                  </span>
                  <Badge
                    className={cn(
                      k.percent >= 75
                        ? "bg-emerald-500/20 text-emerald-300"
                        : k.percent >= 55
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-rose-500/20 text-rose-300",
                    )}
                  >
                    {k.percent}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <Metric
            label="Avg time per question"
            value={formatDuration(report.avgTimePerQuestionMs)}
          />
          <Metric
            label="Answered too quickly"
            value={String(report.tooFast.length)}
            hint="< 20s per question"
          />
          <Metric
            label="Answered too slowly"
            value={String(report.tooSlow.length)}
            hint="> 3 min per question"
          />
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Difficulty performance</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            {(Object.keys(report.difficultyBreakdown) as Array<
              keyof typeof report.difficultyBreakdown
            >).map((d) => {
              const v = report.difficultyBreakdown[d];
              const pct = v.total ? Math.round((v.correct / v.total) * 100) : 0;
              return (
                <Card key={d} className="p-4">
                  <div className="text-xs text-muted-foreground">{d}</div>
                  <div className="mt-1 text-xl font-semibold">
                    {v.correct}/{v.total}
                  </div>
                  <Progress className="mt-2" value={pct} />
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Summary</h2>
          <div className="text-sm text-muted-foreground">
            Overall: {report.correctCount}/{report.totalQuestions} correct.
            Confidence average:{" "}
            {report.avgConfidence ? report.avgConfidence.toFixed(1) : "n/a"}.
          </div>
        </section>

        <AiCoachPanel report={report} />


        <div className="mt-10 flex flex-wrap justify-end gap-2">
          <Link to="/analytics">
            <Button variant="outline">
              <CheckCircle2 className="mr-1.5 h-4 w-4" /> View analytics
            </Button>
          </Link>
          <Link to="/exam">
            <Button>
              <XCircle className="mr-1.5 h-4 w-4" /> Back to exam menu
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

type ReportForCoach = import("@/lib/exam/types").ExamReport;

const COACH_SUGGESTIONS = [
  "Build me a 2-week study plan for my weakest topics.",
  "Which PMBOK 7 principles should I focus on next?",
  "How do I improve my timing per question?",
  "Give me 5 practice question themes for my weakest area.",
];

function AiCoachPanel({ report }: { report: ReportForCoach }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(q: string) {
    if (!q.trim() || loading) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/exam-coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question: q.trim(),
          report: {
            overallPercent: report.overallPercent,
            passProbability: report.passProbability,
            readiness: report.readiness,
            weakestTopics: report.weakestTopics,
            strongestTopics: report.strongestTopics,
            domainScores: report.domainScores.map((d) => ({
              domain: d.domain,
              percent: d.percent,
            })),
            avgTimePerQuestionMs: report.avgTimePerQuestionMs,
          },
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { text: string };
      setAnswer(data.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Coach unavailable");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10">
      <Card className="border-primary/40 bg-primary/5 p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" /> AI PMP Coach
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask a follow-up question about this exam. The coach uses your
          weakest topics, timing, and domain scores as context.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {COACH_SUGGESTIONS.map((s) => (
            <button
              key={s}
              disabled={loading}
              onClick={() => {
                setQuestion(s);
                void ask(s);
              }}
              className="rounded-full border border-border/60 bg-background/40 px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/60 hover:text-foreground disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. How should I approach change requests differently?"
          className="mt-3 min-h-[80px] bg-background/40"
        />
        <div className="mt-3 flex justify-end">
          <Button onClick={() => ask(question)} disabled={loading || !question.trim()}>
            {loading ? "Coach is thinking…" : "Ask the coach"}
          </Button>
        </div>
        {error && (
          <div className="mt-3 rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </div>
        )}
        {answer && (
          <div className="prose prose-sm prose-invert mt-4 max-w-none rounded-md border border-border/60 bg-background/40 p-4">
            <ReactMarkdown>{answer}</ReactMarkdown>
          </div>
        )}
      </Card>
    </section>
  );
}
