// Server-side simulation_events service. Every engine-visible event (email,
// meeting, decision, document, notification, briefing, practice, mentor_review,
// risk, issue, chat) lives here. UI components read events via the store or
// their local collections; state transitions go through updateEventStatus so
// timestamps and duplicates are handled in one place.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json, Tables } from "@/integrations/supabase/types";

export type EventType =
  | "email"
  | "chat"
  | "meeting"
  | "document"
  | "decision"
  | "risk"
  | "issue"
  | "notification"
  | "briefing"
  | "practice"
  | "mentor_review";

export type EventStatus =
  | "locked"
  | "available"
  | "viewed"
  | "responded"
  | "completed"
  | "expired";

export type EventInput = {
  eventKey: string;
  eventType: EventType;
  status?: EventStatus;
  dayNumber?: number | null;
  priority?: "low" | "normal" | "high" | "urgent";
  payload?: Record<string, unknown>;
  relatedDecisionId?: string | null;
  triggerCondition?: string | null;
  metricEffects?: Record<string, number>;
  pmbokMapping?: Record<string, unknown>;
  ecoMapping?: Record<string, unknown>;
};

const asJson = (v: unknown): Json => v as Json;

export const syncEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { runId?: string; events?: EventInput[] };
    if (!i?.runId) throw new Error("runId required");
    if (!Array.isArray(i.events)) throw new Error("events required");
    return { runId: i.runId, events: i.events };
  })
  .handler(async ({ data, context }) => {
    const db = context.supabase;

    // Load existing to avoid clobbering user-progressed statuses.
    const { data: existing } = await db
      .from("simulation_events")
      .select("event_key, status")
      .eq("run_id", data.runId)
      .eq("user_id", context.userId);
    const priorStatus = new Map<string, string>(
      (existing ?? []).map((r: { event_key: string; status: string }) => [r.event_key, r.status]),
    );

    const rows = data.events.map((e) => {
      const prior = priorStatus.get(e.eventKey);
      // Never regress a status. Order: locked < available < viewed < responded < completed
      const rank: Record<string, number> = {
        locked: 0, available: 1, viewed: 2, responded: 3, completed: 4, expired: 5,
      };
      const desired = e.status ?? "available";
      const status = prior && (rank[prior] ?? 0) > (rank[desired] ?? 0) ? prior : desired;
      return {
        run_id: data.runId,
        user_id: context.userId,
        event_key: e.eventKey,
        event_type: e.eventType,
        status,
        day_number: e.dayNumber ?? null,
        priority: e.priority ?? "normal",
        related_decision_id: e.relatedDecisionId ?? null,
        trigger_condition: e.triggerCondition ?? null,
        payload: asJson(e.payload ?? {}),
        metric_effects: asJson(e.metricEffects ?? {}),
        pmbok_mapping: asJson(e.pmbokMapping ?? {}),
        eco_mapping: asJson(e.ecoMapping ?? {}),
        unlocked_at: status !== "locked" ? new Date().toISOString() : null,
      };
    });

    if (rows.length === 0) return { ok: true as const, count: 0 };
    const { error } = await db
      .from("simulation_events")
      .upsert(rows, { onConflict: "run_id,event_key", ignoreDuplicates: false });
    if (error) throw new Error(error.message);
    return { ok: true as const, count: rows.length };
  });

export const updateEventStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { runId?: string; eventKey?: string; status?: EventStatus };
    if (!i?.runId || !i?.eventKey || !i?.status)
      throw new Error("runId/eventKey/status required");
    return { runId: i.runId, eventKey: i.eventKey, status: i.status };
  })
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const now = new Date().toISOString();
    const patch: Partial<Tables<"simulation_events">> = { status: data.status };
    if (data.status === "viewed") patch.viewed_at = now;
    if (data.status === "responded") patch.responded_at = now;
    if (data.status === "completed") patch.completed_at = now;
    if (data.status !== "locked") patch.unlocked_at = now;

    // Do not regress an already-more-advanced status
    const { data: cur } = await db
      .from("simulation_events")
      .select("status")
      .eq("run_id", data.runId)
      .eq("user_id", context.userId)
      .eq("event_key", data.eventKey)
      .maybeSingle();
    const rank: Record<string, number> = {
      locked: 0, available: 1, viewed: 2, responded: 3, completed: 4, expired: 5,
    };
    if (cur && (rank[cur.status] ?? 0) > (rank[data.status] ?? 0)) {
      return { ok: true as const, skipped: true };
    }

    const { error } = await db
      .from("simulation_events")
      .update(patch)
      .eq("run_id", data.runId)
      .eq("user_id", context.userId)
      .eq("event_key", data.eventKey);
    if (error) throw new Error(error.message);
    return { ok: true as const, skipped: false };
  });

export const listEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { runId?: string };
    if (!i?.runId) throw new Error("runId required");
    return { runId: i.runId };
  })
  .handler(async ({ data, context }) => {
    const db = context.supabase;
    const { data: rows, error } = await db
      .from("simulation_events")
      .select("*")
      .eq("run_id", data.runId)
      .eq("user_id", context.userId)
      .order("day_number", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { events: (rows ?? []) as any[] };
  });
