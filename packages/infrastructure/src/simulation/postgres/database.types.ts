/**
 * Infrastructure database types for the PS-004B / PS-004C / PS-ROADMAP-003 schema.
 *
 * Classification: HAND-MAINTAINED (not auto-generated).
 * There is no wired `supabase gen types` script or CI verification yet.
 *
 * Maintenance:
 * 1. Land forward-only SQL under `supabase/migrations/`.
 * 2. Update this file in the same PR to match applied column nullability/types.
 * 3. Do not claim regeneration unless a deterministic CLI workflow was executed.
 *
 * Follow-up debt: wire `supabase gen types typescript` once project linkage is
 * available in local/CI, then replace hand edits with verified generation.
 *
 * Domain code must never import these types.
 */

export type OutboxStatus = "pending" | "published" | "dead";

export type SimulationRunStatusRow =
  | "created"
  | "active"
  | "paused"
  | "completed"
  | "cancelled"
  | "failed"
  | "archived";

export interface SimulationStateRow {
  readonly tenant_id: string;
  readonly simulation_run_id: string;
  readonly aggregate_version: number;
  /** Physical column name; domain maps to lastProcessedSequence. */
  readonly last_sequence_number: number;
  readonly learner_id: string | null;
  readonly business_case_id: string | null;
  readonly content_package_version_id: string | null;
  readonly runtime_version: string | null;
  readonly status: SimulationRunStatusRow | null;
  readonly current_chapter_id: string | null;
  readonly current_day_id: string | null;
  readonly started_at: string | null;
  readonly paused_at: string | null;
  readonly completed_at: string | null;
  readonly archived_at: string | null;
  readonly created_at: string | null;
  readonly updated_at: string;
  readonly authoritative_state: unknown;
  readonly state_schema_version: number | null;
}

export interface IdempotencyReceiptRow {
  readonly tenant_id: string;
  readonly command_id: string;
  readonly result: unknown;
  readonly created_at: string;
  readonly expires_at: string;
}

export interface EventOutboxRow {
  readonly id: number;
  readonly event_id: string;
  readonly tenant_id: string;
  readonly event_type: string;
  readonly aggregate_id: string;
  readonly aggregate_type: string;
  readonly aggregate_version: number;
  readonly sequence_number: number;
  readonly simulation_run_id: string | null;
  readonly payload: unknown;
  readonly occurred_at: string;
  readonly recorded_at: string;
  readonly published_at: string | null;
  readonly status: OutboxStatus;
  readonly attempt_count: number;
  readonly available_at: string;
  readonly last_error: string | null;
}

export interface TenantMembershipRow {
  readonly tenant_id: string;
  readonly actor_id: string;
  readonly roles: string[];
  readonly capabilities: string[];
  readonly created_at: string;
}

/** Derived cache — never authoritative SimulationRun state. */
export interface SimulationProjectionRow {
  readonly tenant_id: string;
  readonly simulation_run_id: string;
  readonly projection_type: string;
  readonly projection_schema_version: number;
  readonly source_aggregate_version: number;
  readonly source_state_version: number;
  readonly source_action_sequence: number;
  readonly source_event_id: string | null;
  readonly content_package_version_id: string;
  readonly projection_payload: unknown;
  readonly projection_hash: string;
  readonly generated_at: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface ProjectionEventInboxRow {
  readonly tenant_id: string;
  readonly event_id: string;
  readonly processed_at: string;
}

export type ProjectionProcessingTargetStatusRow =
  "pending" | "claimed" | "succeeded" | "retrying" | "exhausted";

export interface ProjectionProcessingTargetRow {
  readonly tenant_id: string;
  readonly event_id: string;
  readonly projection_type: string;
  readonly simulation_run_id: string;
  readonly event_type: string;
  readonly status: ProjectionProcessingTargetStatusRow;
  readonly attempt_count: number;
  readonly next_attempt_at: string;
  readonly claimed_by: string | null;
  readonly claimed_at: string | null;
  readonly claim_expires_at: string | null;
  readonly completed_at: string | null;
  readonly exhausted_at: string | null;
  readonly last_error_classification: string | null;
  readonly last_error_summary: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      simulation_state: { Row: SimulationStateRow };
      idempotency_receipts: { Row: IdempotencyReceiptRow };
      event_outbox: { Row: EventOutboxRow };
      tenant_memberships: { Row: TenantMembershipRow };
      simulation_projection: { Row: SimulationProjectionRow };
      projection_event_inbox: { Row: ProjectionEventInboxRow };
      projection_processing_target: { Row: ProjectionProcessingTargetRow };
    };
  };
}
