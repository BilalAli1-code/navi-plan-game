import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useExamState, formatDuration } from "@/lib/exam/exam-state";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getLevel } from "@/lib/exam/gamification";
import type { ExamReport } from "@/lib/exam/types";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "PMP Analytics Dashboard" },
      {
        name: "description",
        content:
          "Track your PMP exam readiness with performance-over-time, knowledge-area mastery, response-time trends and study streaks.",
      },
    ],
  }),
  component: AnalyticsView,
});

function AnalyticsView() {
  const { history, gamification, clearHistory } = useExamState();
  const level = getLevel(gamification.xp);

  const performanceOverTime = useMemo(
    () =>
      [...history]
        .reverse()
        .map((r, i) => ({
          x: `#${i + 1}`,
          score: r.overallPercent,
          pass: r.passProbability,
        })),
    [history],
  );

  const kaMastery = useMemo(() => aggregateKa(history), [history]);
  const difficultyTrends = useMemo(() => aggregateDifficulty(history), [history]);
  const avgResponseTime = useMemo(
    () =>
      [...history]
        .reverse()
        .map((r, i) => ({
          x: `#${i + 1}`,
          sec: Math.round(r.avgTimePerQuestionMs / 1000),
        })),
    [history],
  );
  const accuracy = useMemo(() => {
    if (history.length === 0) return 0;
    const total = history.reduce((s, r) => s + r.totalQuestions, 0);
    const correct = history.reduce((s, r) => s + r.correctCount, 0);
    return total ? Math.round((correct / total) * 100) : 0;
  }, [history]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Analytics
            </p>
            <h1 className="mt-1 text-3xl font-semibold">Your PMP dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/exam">
              <Button variant="outline">Back to exam</Button>
            </Link>
            {history.length > 0 && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (confirm("Clear exam history? This cannot be undone."))
                    clearHistory();
                }}
              >
                Reset history
              </Button>
            )}
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-4">
          <Stat label="Career level" value={level.current.name} />
          <Stat
            label="XP"
            value={String(gamification.xp)}
            hint={
              level.next
                ? `${level.next.minXp - gamification.xp} to ${level.next.name}`
                : "Max level"
            }
          />
          <Stat
            label="Cumulative accuracy"
            value={`${accuracy}%`}
            hint={`${history.length} exams`}
          />
          <Stat
            label="Study streak"
            value={`${gamification.streakDays} days`}
          />
        </div>

        <ChartCard title="Performance over time">
          {performanceOverTime.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={performanceOverTime}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="x" stroke="hsl(var(--muted-foreground))" />
                <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="pass"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Knowledge area mastery">
            {kaMastery.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={kaMastery} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    dataKey="ka"
                    type="category"
                    width={140}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Bar dataKey="pct">
                    {kaMastery.map((entry) => (
                      <Cell
                        key={entry.ka}
                        fill={
                          entry.pct >= 75
                            ? "#22c55e"
                            : entry.pct >= 55
                              ? "#f59e0b"
                              : "#ef4444"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Difficulty trends">
            {difficultyTrends.length === 0 ? (
              <Empty />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={difficultyTrends}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                  <XAxis dataKey="difficulty" stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Bar dataKey="pct" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <ChartCard title="Average response time (sec / question)">
          {avgResponseTime.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={avgResponseTime}>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="x" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sec"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <Card className="mt-6 p-5">
          <h2 className="mb-3 text-lg font-semibold">Daily study streak</h2>
          <StreakGrid dates={gamification.studyDates} />
          <p className="mt-3 text-xs text-muted-foreground">
            Complete at least one exam per day to grow your streak. Current:{" "}
            {gamification.streakDays} days.
          </p>
        </Card>

        <Card className="mt-6 p-5">
          <h2 className="mb-3 text-lg font-semibold">History</h2>
          {history.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No exams yet.{" "}
              <Link to="/exam" className="text-primary hover:underline">
                Start your first
              </Link>
              .
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((r) => (
                <Link
                  key={r.id}
                  to="/exam/report/$reportId"
                  params={{ reportId: r.id }}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2 text-sm hover:border-primary/60"
                >
                  <div>
                    <div>{new Date(r.completedAt).toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.totalQuestions} Q · {formatDuration(r.durationTakenMs)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{r.overallPercent}%</span>
                    <Badge>{r.readiness}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function aggregateKa(history: ExamReport[]) {
  const acc = new Map<string, { correct: number; total: number }>();
  for (const r of history) {
    for (const k of r.knowledgeAreaScores) {
      const v = acc.get(k.knowledgeArea) ?? { correct: 0, total: 0 };
      v.correct += k.correct;
      v.total += k.total;
      acc.set(k.knowledgeArea, v);
    }
  }
  return Array.from(acc.entries())
    .map(([ka, v]) => ({
      ka,
      pct: v.total ? Math.round((v.correct / v.total) * 100) : 0,
    }))
    .sort((a, b) => a.pct - b.pct);
}

function aggregateDifficulty(history: ExamReport[]) {
  const acc: Record<string, { correct: number; total: number }> = {
    Easy: { correct: 0, total: 0 },
    Medium: { correct: 0, total: 0 },
    Hard: { correct: 0, total: 0 },
    Expert: { correct: 0, total: 0 },
  };
  for (const r of history) {
    for (const d of Object.keys(r.difficultyBreakdown) as Array<
      keyof typeof r.difficultyBreakdown
    >) {
      acc[d].correct += r.difficultyBreakdown[d].correct;
      acc[d].total += r.difficultyBreakdown[d].total;
    }
  }
  return Object.entries(acc).map(([difficulty, v]) => ({
    difficulty,
    pct: v.total ? Math.round((v.correct / v.total) * 100) : 0,
  }));
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mt-6 p-5">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </Card>
  );
}

function Empty() {
  return (
    <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
      Complete an exam to unlock this chart.
    </div>
  );
}

function StreakGrid({ dates }: { dates: string[] }) {
  const set = new Set(dates);
  const cells: { key: string; active: boolean; label: string }[] = [];
  const today = new Date();
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ key, active: set.has(key), label: key });
  }
  return (
    <div className="grid grid-cols-7 gap-1">
      {cells.map((c) => (
        <div
          key={c.key}
          title={c.label}
          className={
            "h-6 rounded " +
            (c.active ? "bg-emerald-500/70" : "bg-muted/40")
          }
        />
      ))}
    </div>
  );
}
