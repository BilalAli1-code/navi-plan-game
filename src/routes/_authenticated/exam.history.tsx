import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useExamState, formatDuration } from "@/lib/exam/exam-state";
import type { ExamReport } from "@/lib/exam/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { ArrowDown, ArrowRight, ArrowUp, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/exam/history")({
  head: () => ({
    meta: [
      { title: "Exam History — ProjectSim" },
      {
        name: "description",
        content:
          "Compare your PMP exam attempts, score progression, readiness changes, and knowledge area trends over time.",
      },
    ],
  }),
  component: ExamHistoryPage,
});

const READINESS_RANK: Record<string, number> = {
  "Not Ready": 1,
  Building: 2,
  Approaching: 3,
  Ready: 4,
  "Exam Ready": 5,
};

function ExamHistoryPage() {
  const { history } = useExamState();

  const sortedAsc = useMemo(
    () => [...history].sort((a, b) => a.completedAt - b.completedAt),
    [history],
  );
  const sortedDesc = useMemo(
    () => [...history].sort((a, b) => b.completedAt - a.completedAt),
    [history],
  );

  const stats = useMemo(() => computeStats(sortedAsc), [sortedAsc]);
  const chartData = useMemo(
    () =>
      sortedAsc.map((r, i) => ({
        name: `#${i + 1}`,
        date: new Date(r.completedAt).toLocaleDateString(),
        score: r.overallPercent,
        pass: r.passProbability,
        readiness: READINESS_RANK[r.readiness] ?? 0,
      })),
    [sortedAsc],
  );

  return (
    <AppShell variant="app">
      <div className="mx-auto max-w-6xl px-6 py-10">

        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Exam History
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Track your readiness over time
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Compare recent attempts, watch your score trend, and see how your
              readiness tier evolves as you study.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/exam">
              <Button variant="outline">Back to exam</Button>
            </Link>
            <Link to="/analytics">
              <Button>Open analytics</Button>
            </Link>
          </div>
        </header>

        {history.length === 0 ? (
          <Card className="border-dashed p-10 text-center">
            <TrendingUp className="mx-auto h-8 w-8 text-muted-foreground" />
            <div className="mt-3 text-lg font-medium">No attempts yet</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete an exam and your comparison dashboard will appear here.
            </p>
            <Link to="/exam" className="mt-4 inline-block">
              <Button>Start an exam</Button>
            </Link>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Attempts" value={String(history.length)} />
              <StatCard
                label="Latest score"
                value={`${stats.latest.overallPercent}%`}
                delta={stats.scoreDelta}
                suffix="%"
              />
              <StatCard
                label="Best score"
                value={`${stats.best.overallPercent}%`}
                hint={new Date(stats.best.completedAt).toLocaleDateString()}
              />
              <StatCard
                label="Average score"
                value={`${stats.avgScore}%`}
                hint={`Avg pass prob ${stats.avgPass}%`}
              />
            </div>

            <Card className="mt-6 border-border/60 p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Score progression</div>
                  <div className="text-xs text-muted-foreground">
                    Overall score and estimated pass probability by attempt
                  </div>
                </div>
                <Badge variant="secondary">
                  Readiness: {stats.latest.readiness}
                </Badge>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis domain={[0, 100]} fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      labelFormatter={(_, p) =>
                        p?.[0]?.payload?.date ?? ""
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Score %"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="pass"
                      name="Pass prob %"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="mt-6 border-border/60 p-5">
              <div className="mb-3 text-sm font-medium">
                Attempt comparison
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Δ</TableHead>
                      <TableHead className="text-right">Pass prob</TableHead>
                      <TableHead>Readiness</TableHead>
                      <TableHead className="text-right">Avg / Q</TableHead>
                      <TableHead>Weakest area</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedDesc.map((r) => {
                      const idx = sortedAsc.findIndex((x) => x.id === r.id);
                      const prev = idx > 0 ? sortedAsc[idx - 1] : null;
                      const delta = prev
                        ? r.overallPercent - prev.overallPercent
                        : null;
                      const readinessDelta = prev
                        ? (READINESS_RANK[r.readiness] ?? 0) -
                          (READINESS_RANK[prev.readiness] ?? 0)
                        : 0;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="text-muted-foreground">
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            {new Date(r.completedAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="capitalize text-muted-foreground">
                            {r.totalQuestions} Qs
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {r.overallPercent}%
                          </TableCell>
                          <TableCell className="text-right">
                            <DeltaPill value={delta} />
                          </TableCell>
                          <TableCell className="text-right">
                            {r.passProbability}%
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              <Badge variant="secondary">{r.readiness}</Badge>
                              {readinessDelta > 0 && (
                                <ArrowUp className="h-3 w-3 text-emerald-400" />
                              )}
                              {readinessDelta < 0 && (
                                <ArrowDown className="h-3 w-3 text-red-400" />
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {formatDuration(r.avgTimePerQuestionMs)}
                          </TableCell>
                          <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                            {r.weakestTopics[0] ?? "—"}
                          </TableCell>
                          <TableCell>
                            <Link
                              to="/exam/report/$reportId"
                              params={{ reportId: r.id }}
                              className="text-xs text-primary hover:underline"
                            >
                              View
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  hint,
  delta,
  suffix,
}: {
  label: string;
  value: string;
  hint?: string;
  delta?: number | null;
  suffix?: string;
}) {
  return (
    <Card className="border-border/60 p-4">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <div className="text-2xl font-semibold">{value}</div>
        {delta != null && <DeltaPill value={delta} suffix={suffix} />}
      </div>
      {hint && (
        <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
      )}
    </Card>
  );
}

function DeltaPill({
  value,
  suffix = "%",
}: {
  value: number | null;
  suffix?: string;
}) {
  if (value == null)
    return <span className="text-xs text-muted-foreground">—</span>;
  if (value === 0)
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <ArrowRight className="h-3 w-3" /> 0{suffix}
      </span>
    );
  const up = value > 0;
  return (
    <span
      className={
        "inline-flex items-center gap-1 text-xs " +
        (up ? "text-emerald-400" : "text-red-400")
      }
    >
      {up ? (
        <ArrowUp className="h-3 w-3" />
      ) : (
        <ArrowDown className="h-3 w-3" />
      )}
      {up ? "+" : ""}
      {value.toFixed(0)}
      {suffix}
    </span>
  );
}

function computeStats(sortedAsc: ExamReport[]) {
  const latest = sortedAsc[sortedAsc.length - 1];
  const prev = sortedAsc.length > 1 ? sortedAsc[sortedAsc.length - 2] : null;
  const best = sortedAsc.reduce(
    (acc, r) => (r.overallPercent > acc.overallPercent ? r : acc),
    sortedAsc[0],
  );
  const avgScore = Math.round(
    sortedAsc.reduce((s, r) => s + r.overallPercent, 0) / sortedAsc.length,
  );
  const avgPass = Math.round(
    sortedAsc.reduce((s, r) => s + r.passProbability, 0) / sortedAsc.length,
  );
  const scoreDelta = prev ? latest.overallPercent - prev.overallPercent : null;
  return { latest, best, avgScore, avgPass, scoreDelta };
}

function TopBar() {
  return (
    <div className="border-b border-border/60 bg-card/50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link to="/" className="text-sm font-semibold tracking-tight">
          ProjectSim
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link to="/play" className="hover:text-foreground">
            Simulator
          </Link>
          <Link to="/exam" className="hover:text-foreground">
            Exam
          </Link>
          <Link to="/exam/history" className="text-foreground">
            History
          </Link>
          <Link to="/analytics" className="hover:text-foreground">
            Analytics
          </Link>
          <Link to="/performance" className="hover:text-foreground">
            Performance
          </Link>
        </nav>
      </div>
    </div>
  );
}
