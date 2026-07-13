import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Sparkles, ArrowRight, Trophy } from "lucide-react";
import { listCases } from "@/lib/sim/cases";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/play")({
  head: () => ({
    meta: [
      { title: "ProjectSim — Choose a workplace simulation" },
      {
        name: "description",
        content:
          "Pick from 15 industry-specific project management simulations — inbox, meetings, documents, stakeholders, and live consequences. Coached by Maya.",
      },
      { property: "og:title", content: "ProjectSim — Choose your simulation" },
      {
        property: "og:description",
        content:
          "Manage a real project. Not another quiz. 15 industries. PMBOK 7/8 + PMI ECO aligned.",
      },
    ],
  }),
  component: PlayIndex,
});

const GROUPS: { name: string; ids: string[] }[] = [
  { name: "Technology & Digital", ids: ["software", "retail", "banking", "gov"] },
  { name: "Industrial & Engineering", ids: ["semiconductor", "automotive", "aviation", "aerospace", "manufacturing", "engineering", "construction", "energy"] },
  { name: "Regulated & Human", ids: ["healthcare", "pharma", "supply-chain"] },
];

function PlayIndex() {
  const cases = listCases();
  const [filter, setFilter] = useState<string>("all");

  const groups = useMemo(() => {
    if (filter === "all") return GROUPS;
    return GROUPS.filter((g) => g.name === filter);
  }, [filter]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1200px] p-6 lg:p-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-accent">
              <Sparkles className="h-3 w-3" /> ProjectSim v2
            </div>
            <h1 className="mt-3 text-[36px] font-bold leading-tight">Choose a workplace to manage</h1>
            <p className="mt-2 max-w-2xl text-[15px] text-muted-foreground">
              Each simulation is a full-lifecycle project. Read emails, join meetings, review documents, and coach
              stakeholders — every decision changes the metrics. Aligned with PMBOK 7/8 principles and PMI's Exam
              Content Outline.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/exam"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[12px] font-medium hover:border-accent/40 hover:text-accent"
            >
              <Trophy className="h-3.5 w-3.5" /> Take the PMP exam
            </Link>
          </div>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          {["all", ...GROUPS.map((g) => g.name)].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12px] font-medium transition",
                filter === f
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-white/10 bg-white/[0.02] text-foreground/70 hover:border-white/30",
              )}
            >
              {f === "all" ? "All industries" : f}
            </button>
          ))}
        </div>

        <div className="space-y-10">
          {groups.map((g) => {
            const items = cases.filter((c) => g.ids.includes(c.id));
            if (items.length === 0) return null;
            return (
              <section key={g.name}>
                <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {g.name}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <Link
                        to="/sim/$caseId"
                        params={{ caseId: c.id }}
                        className="group block h-full rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:bg-white/[0.05]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-4xl">{c.emoji}</div>
                          <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                            {c.recommendedApproach}
                          </span>
                        </div>
                        <h3 className="mt-3 text-[16px] font-bold text-foreground">{c.projectName}</h3>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">{c.industry}</div>
                        <p className="mt-3 text-[13px] leading-relaxed text-foreground/75">{c.summary}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {c.challenges.slice(0, 2).map((ch) => (
                            <span key={ch} className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-foreground/60">
                              {ch}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                          <div className="text-[11px] text-muted-foreground">
                            {c.budget} · 1 week · ~7 hrs · {c.duration}
                          </div>
                          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-accent group-hover:translate-x-0.5 transition">
                            Start <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
