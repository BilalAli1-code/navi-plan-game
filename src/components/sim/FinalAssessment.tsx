import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, RefreshCw, Award, Trophy, AlertCircle } from "lucide-react";
import {
  generateFinalAssessment,
  getFinalAssessment,
  type FinalReport,
} from "@/lib/sim/assessment.functions";

type StoredAssessment = {
  id: string;
  overall_score: number;
  readiness_level: string;
  assessment_data: FinalReport;
  generated_at: string;
};

const READINESS_LABEL: Record<string, { label: string; tone: string }> = {
  developing: { label: "Developing", tone: "text-[color:var(--color-warning)]" },
  approaching: { label: "Approaching Ready", tone: "text-[color:var(--color-warning)]" },
  ready: { label: "Ready", tone: "text-[color:var(--color-success)]" },
  exam_ready: { label: "Exam Ready", tone: "text-[color:var(--color-success)]" },
};

export function FinalAssessment({ runId }: { runId: string }) {
  const getFn = useServerFn(getFinalAssessment);
  const genFn = useServerFn(generateFinalAssessment);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<StoredAssessment | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFn({ data: { runId } });
      setAssessment((res.assessment ?? null) as StoredAssessment | null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load assessment");
    } finally {
      setLoading(false);
    }
  }, [getFn, runId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function generate(force: boolean) {
    setGenerating(true);
    setError(null);
    try {
      const res = await genFn({ data: { runId, force } });
      setAssessment(res.assessment as unknown as StoredAssessment);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Assessment generation failed");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-[12px] text-muted-foreground">
        <Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin" /> Loading final assessment…
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/[0.06] p-4">
        <div className="mb-1 flex items-center gap-2 text-[13px] font-semibold text-foreground">
          <Trophy className="h-4 w-4 text-accent" /> Final AI mentor assessment
        </div>
        <p className="mb-3 text-[12px] text-muted-foreground">
          When you're ready, generate your final report. Maya will review every decision, project metric, practice score,
          reflection, and PMBOK / ECO mapping from this run and produce a personalized development plan. This report is
          stored — you can return to it any time.
        </p>
        {error && (
          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-[color:var(--color-destructive)]">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </div>
        )}
        <button
          onClick={() => void generate(false)}
          disabled={generating}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-[12px] font-semibold text-accent-foreground disabled:opacity-50"
        >
          {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {generating ? "Generating (30–60s)…" : "Generate final assessment"}
        </button>
      </div>
    );
  }

  const r = assessment.assessment_data;
  const readiness = READINESS_LABEL[assessment.readiness_level] ?? { label: assessment.readiness_level, tone: "" };

  return (
    <div className="space-y-4 rounded-2xl border border-accent/20 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
            <Trophy className="h-4 w-4 text-accent" /> Final AI mentor assessment
          </div>
          <div className="text-[11px] text-muted-foreground">
            Generated {new Date(assessment.generated_at).toLocaleString()}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[28px] font-bold text-foreground leading-none">{assessment.overall_score}</div>
          <div className={`text-[11px] font-semibold uppercase tracking-widest ${readiness.tone}`}>
            {readiness.label}
          </div>
        </div>
      </div>

      <Section title="Project outcome">
        <p className="text-[12.5px] text-foreground/85">{r.project_outcome_summary}</p>
      </Section>

      <div className="grid gap-3 sm:grid-cols-3">
        <ScorePill label="ECO: People" value={r.eco_people_score} />
        <ScorePill label="ECO: Process" value={r.eco_process_score} />
        <ScorePill label="ECO: Business Env." value={r.eco_business_environment_score} />
      </div>

      <Section title="PMBOK performance domains">
        <ul className="grid gap-1.5">
          {r.pmbok_performance_domains.map((d) => (
            <li key={d.domain} className="rounded-lg bg-white/[0.04] px-3 py-2 text-[12px]">
              <div className="flex items-center justify-between font-semibold text-foreground">
                <span>{d.domain}</span>
                <span className="text-accent">{d.score}</span>
              </div>
              <div className="text-muted-foreground">{d.notes}</div>
            </li>
          ))}
        </ul>
      </Section>

      <div className="grid gap-3 sm:grid-cols-2">
        <ListSection title="Leadership strengths" items={r.leadership_strengths} icon={<Award className="h-3.5 w-3.5 text-[color:var(--color-success)]" />} />
        <ListSection title="Decision-making strengths" items={r.decision_making_strengths} icon={<Award className="h-3.5 w-3.5 text-[color:var(--color-success)]" />} />
      </div>

      <ListSection title="Development areas" items={r.development_areas} tone="warn" />

      <div className="grid gap-3 sm:grid-cols-3">
        <SubSection title="Stakeholder management">{r.stakeholder_management_assessment}</SubSection>
        <SubSection title="Risk management">{r.risk_management_assessment}</SubSection>
        <SubSection title="Delivery approach">{r.delivery_approach_assessment}</SubSection>
      </div>

      <Section title="Recommended next case">
        <div className="rounded-lg bg-white/[0.04] px-3 py-2 text-[12px] text-foreground/85">
          {r.recommended_next_case}
        </div>
      </Section>

      <Section title="Personalized 7-day follow-up plan">
        <ol className="space-y-1.5">
          {r.seven_day_follow_up_plan.map((d) => (
            <li key={d.day} className="rounded-lg bg-white/[0.04] px-3 py-2 text-[12px]">
              <div className="font-semibold text-foreground">Day {d.day} · {d.focus}</div>
              <ul className="mt-0.5 list-disc pl-5 text-muted-foreground">
                {d.activities.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Section>

      {error && (
        <div className="text-[11px] text-[color:var(--color-destructive)]">{error}</div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => void generate(true)}
          disabled={generating}
          className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50"
          title="Regenerate this report — replaces the stored version"
        >
          {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Regenerate
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-accent">{title}</div>
      {children}
    </div>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/[0.04] p-3">
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</div>
      <div className="text-[12px] text-foreground/85">{children}</div>
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/[0.05] p-3 text-center">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-[22px] font-bold text-foreground">{value}</div>
    </div>
  );
}

function ListSection({ title, items, icon, tone }: { title: string; items: string[]; icon?: React.ReactNode; tone?: "warn" }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-accent">{title}</div>
      <ul className="space-y-1">
        {items.map((s) => (
          <li key={s} className={`flex gap-1.5 rounded-lg px-2 py-1.5 text-[12px] ${tone === "warn" ? "bg-[color:var(--color-warning)]/10" : "bg-white/[0.04]"}`}>
            {icon}
            <span className="text-foreground/85">{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
