// Competency dashboard: reads learner_mastery rows and groups by PMBOK / ECO.
// Read-only view — mastery numbers are calculated server-side and never edited
// from this component.

import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listMastery } from "@/lib/sim/mastery.functions";
import { cn } from "@/lib/utils";

type Row = {
  id: string;
  topic: string;
  pmbok_domain: string | null;
  eco_domain: string | null;
  competency: string | null;
  mastery_score: number;
  attempts: number;
  is_mastered: boolean;
  is_development_area: boolean;
  last_practiced_at: string | null;
};

function tone(score: number) {
  if (score >= 85) return "text-emerald-400";
  if (score >= 60) return "text-sky-400";
  if (score >= 40) return "text-amber-400";
  return "text-rose-400";
}

export function CompetencyDashboard() {
  const listFn = useServerFn(listMastery);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    listFn()
      .then((res) => {
        if (!alive) return;
        setRows(((res.rows as unknown) as Row[]) ?? []);
      })
      .catch((e) => alive && setErr(e instanceof Error ? e.message : "load failed"));
    return () => {
      alive = false;
    };
  }, [listFn]);

  if (err) return <div className="text-sm text-rose-400">Couldn't load mastery: {err}</div>;
  if (!rows) return <div className="text-sm text-muted-foreground">Loading mastery…</div>;
  if (rows.length === 0)
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-muted-foreground">
        No mastery recorded yet. Complete decisions, practice, and reflections to see your progress here.
      </div>
    );

  const mastered = rows.filter((r) => r.is_mastered).length;
  const dev = rows.filter((r) => r.is_development_area).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Topics tracked" value={rows.length} />
        <Stat label="Mastered" value={mastered} tone="text-emerald-400" />
        <Stat label="Development areas" value={dev} tone="text-amber-400" />
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="border-b border-white/10 px-4 py-3 text-[13px] font-semibold">
          By topic
        </div>
        <ul className="divide-y divide-white/5">
          {rows.map((r) => (
            <li key={r.id} className="grid grid-cols-[1fr_auto] gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{r.topic}</div>
                <div className="text-[11px] text-muted-foreground">
                  {r.pmbok_domain ?? "—"} · {r.eco_domain ?? "—"} · {r.attempts} attempts
                  {r.is_mastered && <span className="ml-2 text-emerald-400">· Mastered</span>}
                  {r.is_development_area && (
                    <span className="ml-2 text-amber-400">· Development area</span>
                  )}
                </div>
              </div>
              <div className={cn("text-right text-2xl font-semibold tabular-nums", tone(r.mastery_score))}>
                {Math.round(r.mastery_score)}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, tone: t }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", t ?? "text-foreground")}>
        {value}
      </div>
    </div>
  );
}
