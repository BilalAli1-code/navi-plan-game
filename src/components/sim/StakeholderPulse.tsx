import { useEffect, useState } from "react";
import { MessageSquare, Users, TrendingDown, TrendingUp } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useSim } from "@/lib/sim/store";
import { stakeholdersFor } from "@/lib/sim/cases";
import {
  listAllConversations,
  type ConversationSummary,
} from "@/lib/sim/stakeholders.functions";
import { stakeholderEngagementForChapter } from "@/lib/sim/stakeholder-interactions";
import { cn } from "@/lib/utils";

/**
 * Mission Control at-a-glance summary of stakeholder relationships and
 * recent conversations. Deep-links to the Stakeholders tab.
 */
export function StakeholderPulse({ onOpenTab }: { onOpenTab?: (tab: string) => void }) {
  const { state, runId } = useSim();
  const stakes = stakeholdersFor(state.caseId);
  const load = useServerFn(listAllConversations);
  const [rows, setRows] = useState<ConversationSummary[]>([]);
  const chapter = Math.max(1, Math.min(7, state.currentDay ?? 1));

  useEffect(() => {
    if (!runId) return;
    let cancelled = false;
    load({ data: { runId } })
      .then((r) => {
        if (!cancelled) setRows(r);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [runId, load, state.currentDay]);

  const byId = new Map(rows.map((r) => [r.stakeholderId, r]));
  const primary = stakes
    .filter((s) => stakeholderEngagementForChapter(s.id, chapter) === "primary")
    .slice(0, 6);
  if (primary.length === 0) return null;

  const attention = [...rows].filter((r) => !r.archived && r.trust < 55).sort((a, b) => a.trust - b.trust).slice(0, 3);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Users className="h-4 w-4 text-accent" />
        <div className="text-[13px] font-semibold text-foreground">Stakeholder pulse</div>
        <button
          onClick={() => onOpenTab?.("stakeholders")}
          className="ml-auto rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold text-foreground/80 hover:bg-white/[0.08]"
        >
          Open stakeholders →
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {primary.map((s) => {
          const row = byId.get(s.id);
          const trust = row?.trust ?? 60;
          const tone =
            trust >= 75
              ? "text-emerald-300"
              : trust >= 50
                ? "text-foreground/80"
                : trust >= 30
                  ? "text-amber-300"
                  : "text-rose-300";
          return (
            <button
              key={s.id}
              onClick={() => onOpenTab?.("stakeholders")}
              className="flex items-center gap-2 rounded-xl bg-white/[0.03] p-2 text-left transition hover:bg-white/[0.06]"
            >
              <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white", s.color)}>
                {s.avatarInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-semibold text-foreground">{s.name.split(" ")[0]}</div>
                <div className={cn("text-[10px]", tone)}>
                  Trust {trust} · {row?.sentiment ?? "neutral"}
                </div>
              </div>
              {row?.interactionCount ? (
                <span className="text-[10px] text-muted-foreground">
                  <MessageSquare className="mr-0.5 inline h-3 w-3" />
                  {row.interactionCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {attention.length > 0 && (
        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-2.5">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-amber-200">
            <TrendingDown className="h-3 w-3" />
            Needs your attention
          </div>
          <ul className="space-y-1 text-[11px] text-foreground/80">
            {attention.map((r) => {
              const s = stakes.find((x) => x.id === r.stakeholderId);
              if (!s) return null;
              return (
                <li key={r.stakeholderId} className="flex items-center justify-between">
                  <span className="truncate">
                    <span className="font-semibold">{s.name.split(" ")[0]}</span>
                    {r.lastMessagePreview ? ` — "${r.lastMessagePreview.slice(0, 60)}"` : ""}
                  </span>
                  <span className="ml-2 shrink-0 text-amber-300">Trust {r.trust}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {rows.some((r) => r.trust >= 80) && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-300">
          <TrendingUp className="h-3 w-3" />
          Strong relationships holding steady with {rows.filter((r) => r.trust >= 80).length} stakeholder(s).
        </div>
      )}
    </div>
  );
}
