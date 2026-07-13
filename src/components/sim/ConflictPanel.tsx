import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Sparkles, Swords } from "lucide-react";
import { useSim } from "@/lib/sim/store";
import { conflictsFor, type ConflictCase } from "@/lib/sim/risks";
import { CONFLICT_TECHNIQUES, type ConflictTechnique } from "@/lib/sim/actions";
import { processAction, listActions } from "@/lib/sim/actions.functions";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Draft = {
  selectedTechnique: ConflictTechnique | "";
  reasoning: string;
};

export function ConflictPanel({ dayNumber }: { dayNumber: number }) {
  const { state, runId } = useSim();
  const conflicts = useMemo(() => conflictsFor(state.caseId), [state.caseId]);
  const dayConflicts = conflicts.filter((c) => c.sectionNumber === dayNumber);
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
      .filter((a) => a.action_type === "conflict_management")
      .map((a) => `conflict:${a.subject_id}`),
  );

  if (dayConflicts.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Swords className="h-4 w-4 text-accent" />
        <div className="text-[12px] font-semibold text-foreground">Conflict management · Day {dayNumber}</div>
      </div>
      <div className="space-y-3">
        {dayConflicts.map((c) => (
          <ConflictItem
            key={c.id}
            conflict={c}
            completed={responded.has(`conflict:${c.id}`)}
            onSubmit={async (draft) => {
              if (!runId) return { ok: false };
              const res = await processFn({
                data: {
                  action: {
                    actionType: "conflict_management",
                    runId,
                    sectionNumber: dayNumber,
                    conflictId: c.id,
                    parties: c.parties,
                    conflictCause: c.cause,
                    selectedTechnique: draft.selectedTechnique as ConflictTechnique,
                    reasoning: draft.reasoning || undefined,
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

function ConflictItem({
  conflict,
  completed,
  onSubmit,
}: {
  conflict: ConflictCase;
  completed: boolean;
  onSubmit: (d: Draft) => Promise<{ ok: boolean; quality?: string | null; message?: string | null }>;
}) {
  const [draft, setDraft] = useState<Draft>({ selectedTechnique: "", reasoning: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; quality?: string | null; message?: string | null } | null>(null);

  if (completed) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-[color:var(--color-success)]/30 bg-[color:var(--color-success)]/10 p-3 text-[12px]">
        <CheckCircle2 className="mt-0.5 h-4 w-4 text-[color:var(--color-success)]" />
        <div>
          <div className="font-semibold text-foreground">{conflict.title}</div>
          <div className="mt-0.5 text-muted-foreground">Resolution recorded.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="text-[13px] font-semibold text-foreground">
        {conflict.title}
        {conflict.required && (
          <span className="ml-2 rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            required
          </span>
        )}
      </div>
      <p className="mt-1 text-[12px] text-foreground/75">{conflict.description}</p>
      <div className="mt-1 text-[11px] text-muted-foreground">
        Parties: {conflict.parties.join(", ")} · Cause: {conflict.cause}
      </div>

      <label className="mt-2 block text-[11px] text-muted-foreground">
        Technique
        <select
          className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-[12px] text-foreground"
          value={draft.selectedTechnique}
          onChange={(e) => setDraft({ ...draft, selectedTechnique: e.target.value as ConflictTechnique })}
        >
          <option value="">Choose…</option>
          {CONFLICT_TECHNIQUES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>

      <label className="mt-2 block text-[11px] text-muted-foreground">
        Reasoning
        <textarea
          rows={2}
          className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-[12px] text-foreground"
          placeholder="Why this technique? What outcome are you targeting?"
          value={draft.reasoning}
          onChange={(e) => setDraft({ ...draft, reasoning: e.target.value })}
        />
      </label>

      <div className="mt-2 flex justify-end">
        <button
          disabled={!draft.selectedTechnique || busy}
          onClick={async () => {
            setBusy(true);
            try {
              setResult(await onSubmit(draft));
            } finally {
              setBusy(false);
            }
          }}
          className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold text-accent-foreground disabled:opacity-50"
        >
          {busy && <Loader2 className="h-3 w-3 animate-spin" />}
          Submit resolution
        </button>
      </div>

      {result && (
        <div className="mt-2 rounded-lg border border-accent/20 bg-accent/[0.06] p-2 text-[11px] text-foreground/85">
          <Sparkles className="mr-1 inline h-3 w-3 text-accent" />
          {result.ok
            ? <>Resolution evaluated as <strong>{result.quality}</strong>. Morale & trust updated.</>
            : <>{result.message ?? "Could not process."}</>}
        </div>
      )}
    </div>
  );
}
