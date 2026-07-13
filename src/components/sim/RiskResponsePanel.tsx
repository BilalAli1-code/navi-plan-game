import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Loader2 } from "lucide-react";
import { useSim } from "@/lib/sim/store";
import {
  risksFor,
  type RiskCase,
} from "@/lib/sim/risks";
import {
  OPPORTUNITY_STRATEGIES,
  THREAT_STRATEGIES,
  type RiskStrategy,
} from "@/lib/sim/actions";
import { processAction, listActions } from "@/lib/sim/actions.functions";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Draft = {
  responseStrategy: RiskStrategy | "";
  ownerAssigned: string;
  contingencyDefined: boolean;
  reasoning: string;
  residualRisk: number;
};

const EMPTY: Draft = {
  responseStrategy: "",
  ownerAssigned: "",
  contingencyDefined: false,
  reasoning: "",
  residualRisk: 30,
};

export function RiskResponsePanel({ dayNumber }: { dayNumber: number }) {
  const { state, runId } = useSim();
  const risks = useMemo(() => risksFor(state.caseId), [state.caseId]);
  const dayRisks = risks.filter((r) => r.sectionNumber === dayNumber);
  const processFn = useServerFn(processAction);
  const listFn = useServerFn(listActions);
  const qc = useQueryClient();

  const actionsQ = useQuery({
    queryKey: ["sim-actions", runId],
    enabled: !!runId,
    queryFn: () => listFn({ data: { runId: runId! } }),
    staleTime: 5_000,
  });
  const responded = new Set(
    (actionsQ.data?.actions ?? [])
      .filter((a) => a.action_type === "risk_response")
      .map((a) => `risk:${a.subject_id}`),
  );

  if (dayRisks.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-accent" />
        <div className="text-[12px] font-semibold text-foreground">Risk response · Day {dayNumber}</div>
      </div>
      <div className="space-y-3">
        {dayRisks.map((risk) => (
          <RiskItem
            key={risk.id}
            risk={risk}
            completed={responded.has(`risk:${risk.id}`)}
            onSubmit={async (draft) => {
              if (!runId) return { ok: false, message: "Not ready" } as const;
              const res = await processFn({
                data: {
                  action: {
                    actionType: "risk_response",
                    runId,
                    sectionNumber: dayNumber,
                    riskId: risk.id,
                    riskType: risk.riskType,
                    responseStrategy: draft.responseStrategy as string,
                    ownerAssigned: draft.ownerAssigned || undefined,
                    contingencyDefined: draft.contingencyDefined,
                    reasoning: draft.reasoning || undefined,
                    residualRisk: draft.residualRisk,
                  },
                },
              });
              await qc.invalidateQueries({ queryKey: ["sim-actions", runId] });
              return res;
            }}
          />
        ))}
      </div>
    </div>
  );
}

function RiskItem({
  risk,
  completed,
  onSubmit,
}: {
  risk: RiskCase;
  completed: boolean;
  onSubmit: (d: Draft) => Promise<{ ok: boolean; quality?: string | null; message?: string | null }>;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; quality?: string | null; message?: string | null } | null>(null);
  const strategies = risk.riskType === "threat" ? THREAT_STRATEGIES : OPPORTUNITY_STRATEGIES;

  if (completed) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/10 p-3 text-[12px]">
        <CheckCircle2 className="mt-0.5 h-4 w-4 text-[color:var(--color-success)]" />
        <div>
          <div className="font-semibold text-foreground">{risk.title}</div>
          <div className="mt-0.5 text-muted-foreground">Response recorded.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className={cn("mt-0.5 h-4 w-4 shrink-0", risk.riskType === "opportunity" ? "text-emerald-400" : "text-amber-400")} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-foreground">
            {risk.title}
            <span className="ml-2 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
              {risk.riskType}{risk.required ? " · required" : ""}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-foreground/75">{risk.description}</p>

          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="text-[11px] text-muted-foreground">
              Strategy
              <select
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-[12px] text-foreground"
                value={draft.responseStrategy}
                onChange={(e) => setDraft({ ...draft, responseStrategy: e.target.value as RiskStrategy })}
              >
                <option value="">Choose…</option>
                {strategies.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="text-[11px] text-muted-foreground">
              Owner
              <input
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-[12px] text-foreground"
                placeholder="e.g. Jordan (Delivery Lead)"
                value={draft.ownerAssigned}
                onChange={(e) => setDraft({ ...draft, ownerAssigned: e.target.value })}
              />
            </label>
          </div>

          <label className="mt-2 block text-[11px] text-muted-foreground">
            Reasoning / trigger
            <textarea
              rows={2}
              className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-[12px] text-foreground"
              placeholder="Why this strategy? What is the trigger and residual exposure?"
              value={draft.reasoning}
              onChange={(e) => setDraft({ ...draft, reasoning: e.target.value })}
            />
          </label>

          <div className="mt-2 flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <input
                type="checkbox"
                checked={draft.contingencyDefined}
                onChange={(e) => setDraft({ ...draft, contingencyDefined: e.target.checked })}
              />
              Contingency defined
            </label>
            <button
              disabled={!draft.responseStrategy || busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const r = await onSubmit(draft);
                  setResult(r);
                } finally {
                  setBusy(false);
                }
              }}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold text-accent-foreground disabled:opacity-50"
            >
              {busy && <Loader2 className="h-3 w-3 animate-spin" />}
              Submit response
            </button>
          </div>

          {result && (
            <div className="mt-2 rounded-lg border border-accent/20 bg-accent/[0.06] p-2 text-[11px] text-foreground/85">
              <Sparkles className="mr-1 inline h-3 w-3 text-accent" />
              {result.ok
                ? <>Response evaluated as <strong>{result.quality}</strong>. Impact applied to risk & trust.</>
                : <>{result.message ?? "Could not process."}</>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
