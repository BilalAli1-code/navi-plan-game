import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireRunAccess } from "@/lib/billing/entitlement.server";
import type { Tables } from "@/integrations/supabase/types";
import { buildPerformanceProjection, type PerformanceProjection } from "./performance-projection";

export type { PerformanceProjection } from "./performance-projection";

export const getPerformanceProjection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const data = input as { runId?: string | null };
    return { runId: data?.runId ?? null };
  })
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    let run: Tables<"simulation_runs"> | null = null;

    if (data.runId) {
      await requireRunAccess(db, context.userId, data.runId);
      const { data: found, error } = await db
        .from("simulation_runs")
        .select("*")
        .eq("id", data.runId)
        .eq("user_id", context.userId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      run = found;
    } else {
      const { data: found, error } = await db
        .from("simulation_runs")
        .select("*")
        .eq("user_id", context.userId)
        .in("status", ["active", "paused", "completed"])
        .order("last_activity_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      run = found;
    }

    if (!run) return { projection: null as PerformanceProjection | null };

    const { data: actions, error: actionError } = await db
      .from("simulation_actions")
      .select("action_type, outcome_data")
      .eq("run_id", run.id)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: true });
    if (actionError) throw new Error(actionError.message);

    return {
      projection: buildPerformanceProjection({
        run: {
          id: run.id,
          case_id: run.case_id,
          selected_delivery_approach: run.selected_delivery_approach,
          state_snapshot: run.state_snapshot,
        },
        actions: (actions ?? []) as Array<
          Pick<Tables<"simulation_actions">, "action_type" | "outcome_data">
        >,
      }),
    };
  });
