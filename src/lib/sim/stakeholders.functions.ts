// Persistent stakeholder relationship + commitment + memory service.
// All functions are authenticated server functions; RLS enforces run
// ownership. No case-specific logic lives here.

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ---------- relationships ----------

export type RelationshipRow = {
  stakeholderId: string;
  trust: number;
  sentiment: "supportive" | "neutral" | "skeptical" | "hostile";
  engagement: "lead" | "manage" | "keep_satisfied" | "informed";
  lastInteractionAt: string | null;
  lastInteractionSummary: string | null;
  interactionCount: number;
};

export const listRelationships = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ runId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }): Promise<RelationshipRow[]> => {
    const { data: rows, error } = await context.supabase
      .from("stakeholder_relationships")
      .select("*")
      .eq("run_id", data.runId);
    if (error) throw error;
    return (rows ?? []).map((r) => ({
      stakeholderId: r.stakeholder_id,
      trust: r.trust,
      sentiment: r.sentiment as RelationshipRow["sentiment"],
      engagement: r.engagement as RelationshipRow["engagement"],
      lastInteractionAt: r.last_interaction_at,
      lastInteractionSummary: r.last_interaction_summary,
      interactionCount: r.interaction_count,
    }));
  });

export const applyInteraction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      runId: z.string().uuid(),
      stakeholderId: z.string().min(1),
      trustDelta: z.number().min(-40).max(40),
      summary: z.string().min(1).max(280),
      sentiment: z.enum(["supportive", "neutral", "skeptical", "hostile"]).optional(),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;
    const { data: existing } = await supabase
      .from("stakeholder_relationships")
      .select("*")
      .eq("run_id", data.runId)
      .eq("stakeholder_id", data.stakeholderId)
      .maybeSingle();

    const nextTrust = Math.max(
      0,
      Math.min(100, (existing?.trust ?? 60) + data.trustDelta),
    );
    const nextSentiment =
      data.sentiment ??
      (nextTrust >= 75
        ? "supportive"
        : nextTrust >= 50
          ? "neutral"
          : nextTrust >= 30
            ? "skeptical"
            : "hostile");

    if (existing) {
      const { error } = await supabase
        .from("stakeholder_relationships")
        .update({
          trust: nextTrust,
          sentiment: nextSentiment,
          last_interaction_at: new Date().toISOString(),
          last_interaction_summary: data.summary,
          interaction_count: (existing.interaction_count ?? 0) + 1,
        })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("stakeholder_relationships").insert({
        run_id: data.runId,
        stakeholder_id: data.stakeholderId,
        trust: nextTrust,
        sentiment: nextSentiment,
        last_interaction_at: new Date().toISOString(),
        last_interaction_summary: data.summary,
        interaction_count: 1,
      });
      if (error) throw error;
    }
    return { ok: true, trust: nextTrust, sentiment: nextSentiment };
  });

// ---------- commitments ----------

export const listCommitments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({ runId: z.string().uuid(), stakeholderId: z.string().optional() }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("stakeholder_commitments")
      .select("*")
      .eq("run_id", data.runId)
      .order("created_at", { ascending: false });
    if (data.stakeholderId) q = q.eq("stakeholder_id", data.stakeholderId);
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });

export const recordCommitment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      runId: z.string().uuid(),
      stakeholderId: z.string().min(1),
      chapter: z.number().int().min(1).max(7),
      description: z.string().min(3).max(280),
      dueInWorld: z.string().max(80).optional(),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("stakeholder_commitments")
      .insert({
        run_id: data.runId,
        stakeholder_id: data.stakeholderId,
        chapter: data.chapter,
        description: data.description,
        due_in_world: data.dueInWorld ?? null,
        status: "open",
      })
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const resolveCommitment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      commitmentId: z.string().uuid(),
      status: z.enum(["kept", "broken", "waived"]),
      note: z.string().max(280).optional(),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("stakeholder_commitments")
      .update({ status: data.status, resolution_note: data.note ?? null })
      .eq("id", data.commitmentId);
    if (error) throw error;
    return { ok: true };
  });

// ---------- memories ----------

export const recordMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      runId: z.string().uuid(),
      stakeholderId: z.string().min(1),
      chapter: z.number().int().min(1).max(7).optional(),
      kind: z.enum(["interaction", "decision", "commitment", "observation"]),
      summary: z.string().min(3).max(280),
      sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
      weight: z.number().int().min(1).max(10).optional(),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("stakeholder_memories").insert({
      run_id: data.runId,
      stakeholder_id: data.stakeholderId,
      chapter: data.chapter ?? null,
      kind: data.kind,
      summary: data.summary,
      sentiment: data.sentiment ?? null,
      weight: data.weight ?? 1,
    });
    if (error) throw error;
    return { ok: true };
  });

export const listMemories = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      runId: z.string().uuid(),
      stakeholderId: z.string().min(1),
      limit: z.number().int().min(1).max(20).optional(),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("stakeholder_memories")
      .select("*")
      .eq("run_id", data.runId)
      .eq("stakeholder_id", data.stakeholderId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 6);
    if (error) throw error;
    return rows ?? [];
  });

// ---------- persistent chat conversation ----------
// Stored inside `stakeholder_memories` with kind='chat_message' so we don't
// add a new table. Metadata carries role + full content; `summary` holds a
// truncated preview for list views. Threads are never deleted; learners can
// archive/unarchive via a flag on the relationship row's metadata.

export type ChatMessageRow = {
  id: string;
  role: "learner" | "stakeholder";
  content: string;
  chapter: number | null;
  createdAt: string;
};

export const appendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      runId: z.string().uuid(),
      stakeholderId: z.string().min(1),
      role: z.enum(["learner", "stakeholder"]),
      content: z.string().min(1).max(4000),
      chapter: z.number().int().min(1).max(7).optional(),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const summary = data.content.slice(0, 240);
    const { data: row, error } = await context.supabase
      .from("stakeholder_memories")
      .insert({
        run_id: data.runId,
        stakeholder_id: data.stakeholderId,
        chapter: data.chapter ?? null,
        kind: "chat_message",
        summary,
        sentiment: null,
        weight: 1,
        metadata: { role: data.role, content: data.content },
      })
      .select("id, created_at")
      .single();
    if (error) throw error;
    return { id: row.id as string, createdAt: row.created_at as string };
  });

export const listChatHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      runId: z.string().uuid(),
      stakeholderId: z.string().min(1),
      limit: z.number().int().min(1).max(500).optional(),
    }).parse(raw),
  )
  .handler(async ({ data, context }): Promise<ChatMessageRow[]> => {
    const { data: rows, error } = await context.supabase
      .from("stakeholder_memories")
      .select("id, kind, chapter, summary, metadata, created_at")
      .eq("run_id", data.runId)
      .eq("stakeholder_id", data.stakeholderId)
      .eq("kind", "chat_message")
      .order("created_at", { ascending: true })
      .limit(data.limit ?? 200);
    if (error) throw error;
    return (rows ?? []).map((r) => {
      const meta = (r.metadata ?? {}) as { role?: string; content?: string };
      const role: "learner" | "stakeholder" =
        meta.role === "learner" ? "learner" : "stakeholder";
      return {
        id: r.id as string,
        role,
        content: meta.content ?? r.summary ?? "",
        chapter: (r.chapter as number | null) ?? null,
        createdAt: r.created_at as string,
      };
    });
  });

export type ConversationSummary = {
  stakeholderId: string;
  trust: number;
  sentiment: RelationshipRow["sentiment"];
  interactionCount: number;
  archived: boolean;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastMessageRole: "learner" | "stakeholder" | null;
  lastMessageChapter: number | null;
};

export const listAllConversations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) => z.object({ runId: z.string().uuid() }).parse(raw))
  .handler(async ({ data, context }): Promise<ConversationSummary[]> => {
    const [relRes, msgRes] = await Promise.all([
      context.supabase
        .from("stakeholder_relationships")
        .select("*")
        .eq("run_id", data.runId),
      context.supabase
        .from("stakeholder_memories")
        .select("stakeholder_id, chapter, summary, metadata, created_at")
        .eq("run_id", data.runId)
        .eq("kind", "chat_message")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);
    if (relRes.error) throw relRes.error;
    if (msgRes.error) throw msgRes.error;

    const lastByStakeholder = new Map<
      string,
      { at: string; preview: string; role: "learner" | "stakeholder" | null; chapter: number | null }
    >();
    for (const m of msgRes.data ?? []) {
      if (lastByStakeholder.has(m.stakeholder_id)) continue;
      const meta = (m.metadata ?? {}) as { role?: string; content?: string };
      lastByStakeholder.set(m.stakeholder_id, {
        at: m.created_at as string,
        preview: (meta.content ?? m.summary ?? "").slice(0, 140),
        role: meta.role === "learner" ? "learner" : meta.role === "stakeholder" ? "stakeholder" : null,
        chapter: (m.chapter as number | null) ?? null,
      });
    }

    const rows: ConversationSummary[] = [];
    const seen = new Set<string>();
    for (const r of relRes.data ?? []) {
      seen.add(r.stakeholder_id);
      const last = lastByStakeholder.get(r.stakeholder_id);
      const meta = (r.metadata ?? {}) as { archived?: boolean };
      rows.push({
        stakeholderId: r.stakeholder_id,
        trust: r.trust ?? 60,
        sentiment: (r.sentiment ?? "neutral") as RelationshipRow["sentiment"],
        interactionCount: r.interaction_count ?? 0,
        archived: !!meta.archived,
        lastMessageAt: last?.at ?? r.last_interaction_at ?? null,
        lastMessagePreview: last?.preview ?? r.last_interaction_summary ?? null,
        lastMessageRole: last?.role ?? null,
        lastMessageChapter: last?.chapter ?? null,
      });
    }
    // Include stakeholders with messages but no relationship row yet.
    for (const [sid, last] of lastByStakeholder.entries()) {
      if (seen.has(sid)) continue;
      rows.push({
        stakeholderId: sid,
        trust: 60,
        sentiment: "neutral",
        interactionCount: 0,
        archived: false,
        lastMessageAt: last.at,
        lastMessagePreview: last.preview,
        lastMessageRole: last.role,
        lastMessageChapter: last.chapter,
      });
    }
    return rows;
  });

export const setConversationArchived = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((raw: unknown) =>
    z.object({
      runId: z.string().uuid(),
      stakeholderId: z.string().min(1),
      archived: z.boolean(),
    }).parse(raw),
  )
  .handler(async ({ data, context }) => {
    const { data: existing } = await context.supabase
      .from("stakeholder_relationships")
      .select("id, metadata")
      .eq("run_id", data.runId)
      .eq("stakeholder_id", data.stakeholderId)
      .maybeSingle();
    const meta = { ...(existing?.metadata as Record<string, unknown> | null ?? {}), archived: data.archived };
    if (existing) {
      const { error } = await context.supabase
        .from("stakeholder_relationships")
        .update({ metadata: meta })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await context.supabase.from("stakeholder_relationships").insert({
        run_id: data.runId,
        stakeholder_id: data.stakeholderId,
        trust: 60,
        sentiment: "neutral",
        metadata: meta,
      });
      if (error) throw error;
    }
    return { ok: true };
  });

