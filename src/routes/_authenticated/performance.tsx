import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useProjectState } from "@/lib/simulator/project-state";
import {
  PERF_CATEGORIES,
  KNOWLEDGE_AREAS,
  recommendations,
  knowledgeAreaLevel,
  weakestCategories,
} from "@/lib/simulator/performance";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/performance")({
  head: () => ({
    meta: [
      { title: "Performance — ProjectSim" },
      {
        name: "description",
        content:
          "Track your PMP performance across leadership, risk, stakeholders, communication, value, agile, predictive, and integration thinking.",
      },
    ],
  }),
  component: PerformancePage,
});

function tone(v: number) {
  if (v >= 65) return { text: "text-emerald-300", bar: "bg-emerald-500" };
  if (v <= 35) return { text: "text-rose-300", bar: "bg-rose-500" };
  return { text: "text-amber-300", bar: "bg-amber-400" };
}

function PerformancePage() {
  const { perfScores, decisions } = useProjectState();
  const recs = recommendations(perfScores);
  const weak = weakestCategories(perfScores, 2);
  const correct = decisions.filter((d) => d.correct).length;
  const total = decisions.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Decisions per knowledge area
  const perKA: Record<string, { total: number; correct: number }> = {};
  for (const ka of KNOWLEDGE_AREAS) perKA[ka] = { total: 0, correct: 0 };
  for (const d of decisions) {
    perKA[d.knowledgeArea].total += 1;
    if (d.correct) perKA[d.knowledgeArea].correct += 1;
  }

  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-100">
      <header className="border-b border-white/5 bg-[#0b1020]/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 font-black text-slate-950">
              PS
            </div>
            <div>
              <h1 className="text-base font-semibold sm:text-lg">Performance</h1>
              <p className="text-xs text-slate-400">
                Hidden scoring across the 8 PMP performance categories
              </p>
            </div>
          </div>
          <Link
            to="/play"
            className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-100 transition hover:bg-white/[0.08]"
          >
            ← Back to simulator
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1400px] gap-4 px-4 pb-16 pt-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-slate-400">
                  Overall accuracy
                </div>
                <div className="mt-1 text-3xl font-black text-white">{pct}%</div>
                <div className="text-xs text-slate-400">
                  {correct} correct of {total} decisions
                </div>
              </div>
              {weak.length > 0 && (
                <div className="max-w-[260px] text-right">
                  <div className="text-[11px] uppercase tracking-widest text-slate-400">
                    Adaptive focus
                  </div>
                  <div className="mt-1 text-sm text-amber-200">{weak.join(" · ")}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    Future scenarios will lean into these areas.
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {PERF_CATEGORIES.map((c) => {
                const v = perfScores[c];
                const t = tone(v);
                return (
                  <div
                    key={c}
                    className="rounded-xl border border-white/5 bg-white/[0.02] p-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-200">{c}</span>
                      <span className={cn("font-semibold", t.text)}>{Math.round(v)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(0, Math.min(100, v))}%` }}
                        transition={{ duration: 0.5 }}
                        className={cn("h-full rounded-full", t.bar)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <div className="mb-3 text-[11px] uppercase tracking-widest text-slate-400">
              Knowledge Area coverage
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {KNOWLEDGE_AREAS.map((ka) => {
                const stats = perKA[ka];
                const kaScore = knowledgeAreaLevel(perfScores, ka);
                const t = tone(kaScore);
                return (
                  <div
                    key={ka}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs"
                  >
                    <span className="font-medium text-slate-200">{ka}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">
                        {stats.correct}/{stats.total || 0}
                      </span>
                      <span className={cn("w-8 text-right font-semibold", t.text)}>
                        {Math.round(kaScore)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
            <div className="mb-3 text-[11px] uppercase tracking-widest text-slate-400">
              Coaching recommendations
            </div>
            <ol className="space-y-3">
              {recs.slice(0, 4).map((r) => {
                const t = tone(r.score);
                return (
                  <li key={r.category}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-slate-100">{r.category}</span>
                      <span className={cn("text-xs font-semibold", t.text)}>
                        {Math.round(r.score)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">{r.tip}</p>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] p-5">
            <div className="mb-2 text-[11px] uppercase tracking-widest text-cyan-200">
              How this works
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              Every decision privately adjusts these 8 categories based on its knowledge
              area, quality, and the mindset (agile vs predictive) it reveals. The
              simulator uses your weakest categories to reorder upcoming phase
              scenarios and to weight which random events fire — so the practice
              targets the gaps in your PMP thinking.
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
