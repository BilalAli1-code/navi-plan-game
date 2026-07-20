// Maya coach context builder.
//
// Server-only helper that assembles a compact, model-ready context string
// from a learner's simulation run: active chapter, story hook, latest
// scores, recent decisions, top stakeholder relationships (with sentiment
// and last-interaction memory), and open commitments.
//
// Kept generic across business cases — no case-specific logic.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getChapter } from "./days";

type DB = SupabaseClient<Database>;

function isNewSupabaseApiKey(v: string) {
  return v.startsWith("sb_publishable_") || v.startsWith("sb_secret_");
}

/** Build a per-request Supabase client authenticated as the caller. */
export function createAuthedSupabase(bearerToken: string): DB {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Supabase not configured");
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: `Bearer ${bearerToken}` },
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (isNewSupabaseApiKey(key) && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export type MayaContextInput = {
  supabase: DB;
  runId: string;
};

/**
 * Assembles Maya's grounding context from persisted simulation state.
 * Returns a short markdown-ish block suitable for injection into a system
 * prompt. Silently tolerates missing tables / rows.
 */
export async function buildMayaContext({ supabase, runId }: MayaContextInput): Promise<string> {
  const [runRes, scoresRes, relRes, memRes, comRes] = await Promise.all([
    supabase.from("simulation_runs").select("*").eq("id", runId).maybeSingle(),
    supabase
      .from("simulation_scores")
      .select("chapter, communication_score, decision_score, stakeholder_score, overall_score")
      .eq("run_id", runId)
      .order("chapter", { ascending: true }),
    supabase
      .from("stakeholder_relationships")
      .select("stakeholder_id, trust, sentiment, last_interaction_summary")
      .eq("run_id", runId)
      .order("trust", { ascending: true })
      .limit(5),
    supabase
      .from("stakeholder_memories")
      .select("stakeholder_id, kind, summary, sentiment, created_at")
      .eq("run_id", runId)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("stakeholder_commitments")
      .select("stakeholder_id, description, due_in_world, status, chapter")
      .eq("run_id", runId)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const run = runRes.data as
    | (Database["public"]["Tables"]["simulation_runs"]["Row"] & {
        current_day?: number | null;
        in_world_date?: string | null;
      })
    | null;

  const chapterNum = (run?.current_day as number | undefined) ?? 1;
  const chapter = getChapter(chapterNum);

  const lines: string[] = [];
  lines.push(`## Run context`);
  if (run) {
    lines.push(
      `- Phase: ${run.current_phase ?? "n/a"} · Chapter ${chapterNum}${chapter ? ` — ${chapter.title}` : ""}`,
    );
    if (run.in_world_date) lines.push(`- In-world date: ${run.in_world_date}`);
  }
  if (chapter?.storyHook) lines.push(`- Story hook: ${chapter.storyHook}`);

  const scores = scoresRes.data ?? [];
  if (scores.length) {
    const latest = scores[scores.length - 1];
    lines.push(
      `- Latest scores (ch ${latest.chapter}): comm ${Math.round(latest.communication_score ?? 0)} · dec ${Math.round(
        latest.decision_score ?? 0,
      )} · stk ${Math.round(latest.stakeholder_score ?? 0)} · overall ${Math.round(latest.overall_score ?? 0)}`,
    );
  }

  const rels = relRes.data ?? [];
  if (rels.length) {
    lines.push(`\n## Stakeholders needing attention`);
    for (const r of rels) {
      const last = r.last_interaction_summary ? ` — "${r.last_interaction_summary}"` : "";
      lines.push(`- ${r.stakeholder_id}: trust ${r.trust ?? 0} (${r.sentiment ?? "neutral"})${last}`);
    }
  }

  const memories = memRes.data ?? [];
  if (memories.length) {
    lines.push(`\n## Recent memories`);
    for (const m of memories) {
      lines.push(`- [${m.kind}] ${m.stakeholder_id}: ${m.summary}`);
    }
  }

  const commitments = comRes.data ?? [];
  if (commitments.length) {
    lines.push(`\n## Open commitments`);
    for (const c of commitments) {
      const due = c.due_in_world ? ` (due ${c.due_in_world})` : "";
      lines.push(`- ${c.stakeholder_id}: ${c.description}${due}`);
    }
  }

  return lines.join("\n");
}
