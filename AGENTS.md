# AGENTS

## Cursor Cloud specific instructions

### Product surface

TypeScript monorepo (`pnpm` + Turborepo): `@projectsim/domain`, `@projectsim/application`, `@projectsim/infrastructure`, `@projectsim/ui`, `apps/web`. Authoritative simulation behavior lives in Domain and Application; Postgres/Supabase adapters and composition roots live in Infrastructure.

### Standard commands

Use root scripts from `package.json`: `pnpm run lint`, `pnpm run typecheck`, `pnpm run test`, `pnpm run format:check`, `pnpm run build`. Prefer `turbo run <task> --force` when validating without cache. Package consumers resolve workspace packages from `dist/`; rebuild Domain after Domain API changes before typechecking dependents.

### Database-backed tests

Infrastructure Postgres/RLS/outbox/relay tests are env-gated on `DATABASE_URL` and `DATABASE_ADMIN_URL`. When unset they skip; always report skips explicitly. Apply migrations with `pnpm run db:migrate` when the test database is empty.

### SimulationState schema

- Authoritative `SimulationState.schemaVersion` is currently **8**.
- Version 1/2/3/4/5/6/7 snapshots must continue to decode through the approved compatibility path (empty legacy consequence blobs; typed metrics upgrade; missing `learnerMessages` → `[]`; missing `meetings` → `[]`; missing `stakeholders` / `stakeholderConversations` → `[]`; missing `documents` → `[]`; missing `notifications` → `[]`; missing `activities` → `[]`).
- Newly enriched persisted state must be written as schema version 8.
- Do not silently reinterpret a breaking shape under an existing schema version.
- Malformed outcomes, consequences, metrics, schedules, learner messages, meetings, Stakeholders, conversations, Documents, and cross-references fail closed on rehydration.

### Event sequence semantics

- One accepted simulation action owns one action sequence (`lastProcessedSequence`).
- Domain events caused by that action may share that action sequence under the current architecture.
- Event IDs remain globally unique; outbox uniqueness is on `event_id`.
- Outbox insertion order must be deterministic.
- Consumers must not assume `sequenceNumber` is a globally unique per-event position unless architecture, consumers, replay, and outbox constraints are explicitly revised together.

### Deterministic decision resolution

- Decision outcomes and consequences are resolved from authoritative SimulationState plus the run’s immutable `contentPackageVersionId`.
- AI, UI state, network responses, mutable globals, and direct wall-clock reads must not determine authoritative outcomes.
- Resolver versions are explicit (`decision-resolver/v1` for the current slice).
- An existing Outcome must not be silently recalculated under a newer resolver.

### Exactly-once consequence behavior

- Authoritative effects are protected by stable logical identities (`simulationRunId` + `DecisionRecordId` + `ConsequenceDefinitionId` + `resolverVersion`), Domain invariants, durable idempotency, and optimistic concurrency.
- At-least-once outbox/broker delivery must not duplicate authoritative effects.
- Consequences apply in deterministic authored order.
- Reprocessing an already resolved Decision must not advance versions or emit duplicate events.
- Compensating behavior creates explicit future records; historical Consequences are never rewritten.

### Metric and project-state behavior

- Metric changes use typed metric definitions with authoritative lower/upper bounds.
- Current bound policy is **fail closed** (`METRIC_BOUNDS_EXCEEDED`). Do not clamp unless an approved architecture or content policy explicitly introduces clamping.
- Metric calculation remains in Core Simulation, not Application, Infrastructure, UI, or projections.
- Project-state transitions are Domain-validated; content may request a transition but cannot bypass invariants.

### Context boundaries and roadmap scope

- Core Simulation may emit learning, stakeholder, and analytics **signals** through the transactional outbox.
- It must not directly mutate learning mastery, stakeholder relationship state, or analytics aggregates.
- Delayed consequences create runtime-owned schedule instructions; they do not immediately mutate future target state. Full delayed-event release remains separate work.
- Fixture content (`createScaffoldDecisionDefinition` / in-memory providers) is deterministic development/test scaffolding, not a production Content Aggregate.
- Deprecated `SimulationStateRepository` / action sequencers remain write-disabled.

### Simulation projection (derived read model)

- The canonical Simulation Projection is **derived, read-only, rebuildable, and disposable**. It is never authoritative business state.
- Authoritative sources remain SimulationRun / SimulationState, immutable action and event history, and `contentPackageVersionId`.
- Command handlers, Domain invariants, consequence resolvers, eligibility validators, progress calculators, and completion rules must **never** read projection rows.
- Projection schema version is independent of `SimulationState.schemaVersion` (projection schema currently starts at **1**).
- Source recency uses `(sourceAggregateVersion, sourceStateVersion, sourceActionSequence)`. `sourceEventId` is provenance only (the trigger that originally wrote the row on insert/replace); same-source no-ops do not update it. Later handled triggers are tracked in the projection event inbox.
- Because multiple Domain events may share one action sequence, projection consumers must deduplicate by **event ID**, not `sequenceNumber` alone.
- Semantic projection hash (`fnv1a64:v1:…`) is a deterministic consistency fingerprint, not a cryptographic integrity mechanism. It excludes `generatedAt` and `sourceEventId`. Same source versions with a different hash fail closed.
- Stale projection writes must not overwrite a newer source position. Equivalent same-source saves are idempotent and must not emit `ProjectionRebuilt`.
- Projection subscriber / rebuild failures must not block authoritative outbox relay publication or mutate SimulationRun state. Retry via later triggers or synchronous get-query rebuild.
- Raw consequences, schedule instructions, learning/stakeholder/analytics signals, resolver internals, processing receipts, and outbox metadata are hidden by default.
- Available decisions must reuse the same pure eligibility policy as SubmitDecision (`decision-eligibility.ts`).
- Projection-safe content ports must not expose hidden outcomes/consequence definitions. Fixture projection content remains scaffolding.

### Decision UI and public API (PS-ROADMAP-007)

- UI displays the canonical SimulationProjection and never owns authoritative state.
- Command receipts acknowledge acceptance only; resolved UI state comes from a refreshed projection whose `sourceAggregateVersion` reaches the receipt `aggregateVersion`.
- Decision submissions use one stable `commandId` / `Idempotency-Key` (equal) and payload per deliberate attempt; uncertain transport retries reuse them; payload changes require new IDs.
- Aggregate-version conflicts (HTTP 412) refresh the projection and must not auto-resubmit.
- Stale or `rebuild_failed` projections are read-only; Decision submission requires `freshness: current`.
- Browser clients must not write authoritative or projection tables directly and must never send service-role credentials.
- UI must not calculate eligibility, consequences, metrics, progress, or synthetic Decision history.
- Multiple Decision surfaces share the same run-scoped projection query key (`simulation-projection`, actor, run).
- `@projectsim/api` composition is explicit via `PROJECTSIM_API_COMPOSITION=postgres|memory`. Never infer the store from `DATABASE_URL` presence/absence. Production uses `postgres` + verified Supabase JWTs (`SUPABASE_JWT_SECRET`); `memory`, `dev.*` tokens, and `/api/v1/dev/*` seed routes are opt-in local/demo only and forbidden when `NODE_ENV=production`.

### Decision identity terminology

Keep these brands distinct:

- Command `decisionId` → content `DecisionDefinition` id
- Command `optionId` → content option id
- `DecisionRecordId` → submitted authoritative Decision instance
- `DecisionOutcomeId` / `ConsequenceId` / `ConsequenceDefinitionId` → outcome and consequence identities

### Decision lifecycle E2E (PS-ROADMAP-008)

- Primary lifecycle browser tests must exercise real public APIs and PostgreSQL with RLS enabled; do not mock SubmitDecision, GetSimulationProjection, consequence application, or projection rebuild for that suite.
- Browser learner actions must not bypass the public command endpoint.
- E2E tests use isolated tenant and SimulationRun identities; cleanup must not delete unrelated tenants.
- Tests use condition-based waits (UI state, projection source version, authoritative DB values), not arbitrary sleeps.
- Idempotency retries preserve command ID, idempotency key, and payload; payload changes require a new deliberate attempt.
- Projection completion is verified by authoritative `sourceAggregateVersion` reaching the accepted receipt version.
- Test helpers must not duplicate Domain eligibility, resolution, or consequence rules.
- Failure artifacts must redact access tokens, service-role keys, database passwords, and hidden content.
- Runner retries cannot be used to conceal flakiness; investigate flakes instead.
- Production migrations are not used for test fixture setup; opt-in `/api/v1/e2e/*` seams and `VITE_ENABLE_E2E_AUTH_HOOK` are non-production only.
- `/api/v1/e2e/*` requires server-side `PROJECTSIM_ENABLE_E2E_SEAMS=1`, non-production `NODE_ENV`, and `X-ProjectSim-E2E-Seam` matching `PROJECTSIM_E2E_SEAM_SECRET`; missing/invalid secret returns opaque 404.
- See `docs/testing/e2e-decision-lifecycle.md` for run/debug instructions.

### Unified workplace projections (PS-ROADMAP-009)

- Topology is **ADR-006 (A3)**: shared projection envelope + typed payloads discriminated by `projectionType`; see `docs/architecture/08-workplace-projection-contracts/` and `docs/adr/ADR-006-cqrs-style-projection-architecture.md`.
- SimulationRun / SimulationState remain the sole authoritative runtime store. Do not create a second write model for Inbox, Meetings, Mission Control, or other workplace tabs.
- Prefer the existing `simulation_projection` table family keyed by `(tenant_id, simulation_run_id, projection_type)`. Do not invent per-surface consistency metadata that diverges from shared source cursors, freshness, semantic hash, saveIfNewer, or event-ID inbox rules.
- `projectionSchemaVersion` is interpreted per `projectionType`. Keep `simulation` schema version 1 stable for Decision consumers unless an intentional tested migration says otherwise.
- Cross-surface convergence: one accepted authoritative action updates every affected workplace projection type; UI tabs must not keep separate completion truth.
- Hidden Domain content (consequences, signals, schedules, resolver internals, receipts) must not enter learner-facing workplace payloads.
- Empty/partial surfaces use honest empty collections; never fabricate workplace items.
- PS-ROADMAP-009 is contracts-only: do not implement workplace product features, new public workplace APIs, or workplace UI in that milestone’s scope.
- Blueprint docs may still describe aspirational `projection.*` tables or per-surface routes; treat those as deferred unless a later ADR/slice explicitly adopts them.

### Shared workplace projection infrastructure (PS-ROADMAP-010)

- Executable seams live in Domain (`workplace-types`, `envelope`, `evaluateProjectionSave`, `deriveProjectionId`) and Application (`WorkplaceProjectionRegistry`, fan-out consumer).
- Persistence adapters must key rows by `projectionType` (Postgres SQL bind + in-memory map key). Never hardcode only `"simulation"` in SQL when writing shared adapters.
- `ProjectionEventConsumer` fans out through the registry. Do not invent a second inbox/freshness/hash model.
- Event-level `projection_event_inbox` remains; fan-out marks an event processed only when all registered target rebuilds succeed.
- PS-023 adds per-projection `projection_processing_target` receipts so failed targets retry independently without erasing successful ones.
- Decision UI, public `GET …/projection`, and `SimulationProjection` schema v1 behavior must remain compatible.

### Production relay worker and projection operations (PS-ROADMAP-023)

- Continuous relay runs in `@projectsim/worker`, not inside every API replica. Use `DATABASE_URL` + `DATABASE_ADMIN_URL` (admin only for tenant discovery).
- Delivery is at-least-once. Learner-visible convergence remains idempotent/monotonic via rebuild + `saveIfNewer` + semantic hash. Do not claim transport exactly-once.
- Query-time GET catch-up remains as a resilience fallback and may race the relay safely.
- Privileged ops live under `/api/v1/internal/projection-operations/*` with capability `simulation.projection.ops`. Excluded from public OpenAPI; see `docs/api/internal/projection-operations.md` and `docs/operations/projection-relay-runbook.md`.
- Rebuild reads authoritative SimulationRun. Replay only re-queues retained processing targets (exhausted/retrying). No Domain mutation, no command dispatch, no new learner pages/projections. Full historical replay is unsupported.
- PS-024 (unified Workplace convergence suite) is the final Milestone 2 validation item: test/docs only. Do not add product behavior under PS-024.

### Unified Workplace Convergence Suite (PS-ROADMAP-024)

- Inventory + completeness: `packages/application/.../workplace-convergence-inventory.ts` (must stay aligned with the production registry and shell nav order).
- PostgreSQL suite: `packages/infrastructure/.../workplace-convergence.integration.test.ts` (env-gated on `DATABASE_URL` / `DATABASE_ADMIN_URL`).
- Playwright: `apps/web/e2e/workplace.convergence.*.spec.ts` + `e2e/helpers/convergence.ts`. Relay sync uses E2E tick (`convergeRelay` / `drainRelayUntilIdle`), not a continuous worker process.
- Completed History remains a derived projection of completed Activities — never rebuild it from the Activities projection.
- If a convergence scenario exposes a production defect, stop and attribute it to the owning earlier roadmap item; do not silently implement missing PS-010–PS-023 behavior here.
- See `docs/architecture/08-workplace-projection-contracts/12_Unified_Workplace_Convergence_Suite.md` and `docs/testing/e2e-workplace-convergence.md`.

### Mission Control vertical slice (PS-ROADMAP-011)

- Discriminator is snake_case `mission_control`; public route is kebab-case `GET …/mission-control`. Do not add a generic `…/projections/{projectionType}` endpoint.
- Mission Control payload schema version starts at **1**. Builders are deterministic, repository-free, and learner-safe. Empty (`available` + 0/`[]`/`null`) is distinct from `unavailable` channel counts.
- Persist through the shared type-keyed `simulation_projection` repository and `saveIfNewer`. No Mission Control-specific write path or second write model.
- Public query service binds `mission_control` internally; tenant comes from auth; run authorization precedes data return.
- Frontend server state stays in TanStack Query key `["mission-control", actorId, simulationRunId]`. Do not derive eligibility/attention/indicators in the browser or follow arbitrary payload URLs — Decision targets use trusted route helpers only.
- Decision submission remains in the existing Decision workspace. Post-Decision convergence invalidates/refetches Mission Control; do not optimistically construct Mission Control payloads.
- See `docs/architecture/08-workplace-projection-contracts/02_Mission_Control_Vertical_Slice.md`.

### Decision Log vertical slice (PS-ROADMAP-012)

- Production registry registers the full workplace family in `workplace-types.ts` / `WorkplaceProjectionRegistry` (including BC-006 W5 `performance` and `learner_progression`). Keep registry and `WORKPLACE_CONVERGENCE_MANIFEST` aligned; do not register unapproved future types early.
- Discriminator is snake_case `decision_log`; public route is kebab-case `GET …/decision-log`. Do not add a generic `…/projections/{projectionType}` endpoint.
- Decision Log payload schema version starts at **1**. Build from authoritative SimulationRun decisions + projection-safe content only — never from Mission Control or SimulationProjection rows as a second truth.
- Entry identity is authoritative `DecisionRecordId`. Presentation order is newest-first; `sequence` is chronological. Browser code must not reorder entries or invent optimistic history.
- Revealed outcomes appear only when the Decision is `resolved` and a non-empty public summary exists. Empty available history (`entries: []`) is distinct from unavailable/rebuild_failed query states.
- Frontend server state stays in TanStack Query key `["decision-log", actorId, simulationRunId]`. Post-Decision convergence invalidates Decision Log after simulation projection sync; do not construct temporary log entries from form data.
- See `docs/architecture/08-workplace-projection-contracts/03_Decision_Log_Vertical_Slice.md`.

### Unified Workplace Shell (PS-ROADMAP-013 / PS-ROADMAP-014)

- The shell is frontend route composition only. Do not add a shell projection, workplace aggregate, generic workplace API, or migration.
- Nested layout: `/app/runs/:simulationRunId` → `WorkplaceShell` with child routes `mission-control`, `inbox`, `meetings`, `stakeholders`, `documents`, `notifications`, `activities`, `completed-history`, `decision-log`, `performance`, and `progress` (learner progression). Default index redirects to Mission Control (`replace`).
- Shell navigation contains **exactly** Mission Control, Inbox, Meetings, Stakeholders, Documents, Notifications, Activities, Completed History, Decision Log, Performance, and Progress (`WORKPLACE_SHELL_NAV_ORDER` in `workplace-convergence-inventory.ts`). Do not add unimplemented placeholders until those slices are merged.
- Product navigation (shell) stays separate from simulation business actions (Mission Control Decision links, SubmitDecision).
- Child pages retain query ownership and keys. The shell must not copy projection payloads into context or browser storage.
- Use trusted helpers in `apps/web/src/features/workplace/routes.ts` and preserve `simulationRunId`.
- Active nav uses semantic `aria-current="page"`. See `docs/architecture/08-workplace-projection-contracts/04_Unified_Workplace_Shell.md`.

### Authoritative learner messages (canonical PS-ROADMAP-014)

- System-delivered learner messages are append-only `SimulationState.learnerMessages`. They are authoritative SimulationRun facts, not an Inbox projection.
- Occurrence IDs are stable (`learner_message:${consequenceId}`). Delivery order uses monotonic `deliverySequence`. Do not derive identity from array index, subject, or timestamps alone.
- Deliver through the `deliver_learner_message` consequence inside SubmitDecision resolution. Do not use `SendStakeholderMessage` for system Inbox delivery; that command is Stakeholder conversation authority (PS-018), not Inbox delivery.
- Snapshot learner-safe sender/subject/body at delivery time. Reject markup in learner-visible text. Do not store read/archive/reply state here.
- Emit `LearnerMessageDelivered` with state + outbox in the same repository transaction. Duplicate consequence application must not append another occurrence.
- See `docs/architecture/02-domain-model/17_Authoritative_Learner_Message_Lifecycle.md`.

### Inbox Vertical Slice (canonical PS-ROADMAP-015; historically labeled PS-ROADMAP-014 in PR #45)

- Inbox (`projectionType: "inbox"`, schema version 1) is a derived workplace projection built only from authoritative `learnerMessages`. Never mutate occurrences from rebuild/GET.
- Public `messageId` is the occurrence ID. Preserve server `messages` order (newest-first by `deliverySequence`). Do not sort, invent unread/archive/reply state, or optimistically append messages in the browser.
- Opening Inbox / expanding a message must not mark read. `GET /api/v1/simulation-runs/{id}/inbox` is side-effect free.
- Register Inbox in the shared production registry; route `LearnerMessageDelivered` to Inbox. Reuse saveIfNewer, source position, and event-ID inbox dedupe.
- Mission Control `unreadActionRequiredInboxItems` stays unavailable while read/action-required state is unsupported.
- Frontend query key: `["inbox", actorId, simulationRunId]`. See `docs/architecture/08-workplace-projection-contracts/05_Inbox_Vertical_Slice.md`.

### Authoritative Meeting lifecycle (PS-ROADMAP-016)

- Meeting occurrences are authoritative `SimulationState.meetings` (schema version 4) owned by SimulationRun. They are not a Meetings projection.
- Occurrence IDs are stable (`meeting_occurrence:${meetingId}`). Canonical order uses monotonic `scheduleSequence`. Do not derive identity from array index, title, or wall-clock alone.
- Commands: `ScheduleMeeting`, `MakeMeetingAvailable`, `StartMeeting`, `CompleteMeeting`, `CancelMeeting`. Each accepted command emits `SimulationActionAccepted` plus the dedicated Meeting* domain event (except identical no-ops that skip the Meeting* event).
- Availability is command-driven, never browser/wall-clock derived. Cancel is not allowed after start/complete.
- Snapshot learner-safe title/agenda/participants/channel/location at schedule time. Reject markup in learner-visible text.
- See `docs/architecture/02-domain-model/18_Authoritative_Meeting_Lifecycle.md`.

### Meetings Vertical Slice (PS-ROADMAP-017)

- Meetings (`projectionType: "meetings"`, schema version 1) is a derived workplace projection built only from authoritative `SimulationState.meetings`. Never mutate occurrences from rebuild/GET.
- Ordering: ascending `scheduleSequence` (stable identity `meetingOccurrenceId`). Frontend must not reorder or invent IDs.
- `GET /api/v1/simulation-runs/{id}/meetings` is read-only and side-effect free. No Meeting mutation REST endpoints.
- Register Meetings in the shared production registry; route Meeting* events to Meetings + Mission Control. Reuse saveIfNewer, source position, and event-ID inbox dedupe.
- Mission Control `upcomingMeetings` is server-owned: count of `scheduled` + `available` from the authoritative snapshot (not from the Meetings projection row). `started`/`completed`/`cancelled` are excluded.
- Frontend query key: `["meetings", actorId, simulationRunId]`. Read-only UI — no Start/Complete/Cancel controls. See `docs/architecture/08-workplace-projection-contracts/06_Meetings_Vertical_Slice.md`.
- Documents (PS-020), Notifications (PS-021), and Activities/Completed History (PS-022) are implemented. Do not implement PS-023 relay-worker operations here.

### Authoritative Stakeholder model (PS-ROADMAP-018)

- Runtime Stakeholders and conversations are authoritative `SimulationState.stakeholders` / `stakeholderConversations` (introduced in schema version 5) owned by SimulationRun. They are not a Stakeholder projection.
- One runtime Stakeholder per `StakeholderId` per run. Ordering uses monotonic `initializationSequence`. Pin learner-safe profile + definition version at initialization; exclude hidden authoring fields.
- Conversation cardinality v1: one per Stakeholder (`conversation:{stakeholderId}`), opened on first `SendStakeholderMessage`. Message identity: `stakeholder_message:{commandId}`. Direction: `learner_to_stakeholder` only.
- Commands: `InitializeStakeholder`, `SendStakeholderMessage`. Accepted commands emit `SimulationActionAccepted` plus dedicated Stakeholder* Domain events (except identical no-ops that skip those events).
- Do not duplicate decision `StakeholderSignalEmitted` facts into a second ledger. Do not invent trust/influence/sentiment scores. Do not generate AI replies. Do not append Stakeholder chat into Inbox `learnerMessages`.
- Write-side only in PS-018. Learner-facing Stakeholders projection/API/UI is PS-019. See `docs/architecture/02-domain-model/19_Authoritative_Stakeholder_Model.md`.

### Stakeholders Vertical Slice (PS-ROADMAP-019)

- Stakeholders (`projectionType: "stakeholders"`, schema version 1) is a derived workplace projection built only from authoritative `stakeholders` + `stakeholderConversations`. Never mutate authority from rebuild/GET.
- Ordering: Stakeholders by `initializationSequence` ascending; messages by `conversationSequence` ascending. Conversation is `null` until authoritative conversation exists. Author display is contract-stable `{ kind: "learner", label: "You" }` — never expose `authorActorId`.
- `GET /api/v1/simulation-runs/{id}/stakeholders` is read-only (authorized catch-up rebuild allowed). No Stakeholder mutation REST endpoints. No message composer / optimistic send / AI reply UI.
- Register Stakeholders in the shared production registry; route Stakeholder* events to Stakeholders only (not Mission Control). Reuse saveIfNewer, source position, and event-ID inbox dedupe. No new projection table/migration.
- Frontend query key: `["stakeholders", actorId, simulationRunId]`. Nav order after PS-020: Mission Control → Inbox → Meetings → Stakeholders → Documents → Decision Log.
- Do not merge Stakeholder chat into Inbox, add Mission Control Stakeholder metrics, or invent trust/influence scores. See `docs/architecture/08-workplace-projection-contracts/07_Stakeholders_Vertical_Slice.md`.
- Documents (PS-020), Notifications (PS-021), and Activities/Completed History (PS-022) are implemented. Do not implement PS-023 relay-worker operations here.

### Authoritative Documents model and Documents Vertical Slice (PS-ROADMAP-020)

- Runtime Documents are authoritative `SimulationState.documents` (schema version 6) owned by SimulationRun. Do not create a Document aggregate, repository, outbox, table, or mutation API.
- Documents are immutable learner-safe `plain_text` snapshots. Reject markup (`<`, `>`) and keep `UploadArtifact` separate from Documents.
- Command: `InitializeDocument`; event: `DocumentInitialized`; lifecycle v1 is `available` only.
- Documents projection (`projectionType: "documents"`, schema version 1) is derived from `SimulationState.documents` and persisted in the shared type-keyed `simulation_projection` repository.
- `GET /api/v1/simulation-runs/{id}/documents` is read-only (authorized catch-up rebuild allowed). Capabilities are `{ upload: "unsupported", edit: "unsupported", comment: "unsupported" }`.
- Frontend query key: `["documents", actorId, simulationRunId]`. Render body as React text with `white-space: pre-wrap`; do not add markdown/HTML renderer libraries.
- Document upload/edit/comment/archive remain out of scope. Notifications are implemented (PS-021). Activities/Completed History are implemented (PS-022).

### Authoritative Notification model and Notifications Vertical Slice (PS-ROADMAP-021)

- Runtime Notifications are authoritative `SimulationState.notifications` owned by SimulationRun. Do not create a Notification aggregate, repository, outbox, table, or mutation API.
- Notifications are immutable learner-safe plain-text snapshots. Lifecycle v1 is `active` only. Severity is omitted (deferred). Source kinds: `simulation | meeting | stakeholder | document | decision | inbox | authored_consequence`.
- Command: `InitializeNotification` (internal/trusted; E2E seam only — not a public API); event: `NotificationInitialized`.
- Notifications projection (`projectionType: "notifications"`, schema version 1) is derived from `SimulationState.notifications` and persisted in the shared type-keyed `simulation_projection` repository.
- `GET /api/v1/simulation-runs/{id}/notifications` is read-only (authorized catch-up rebuild allowed). Capabilities are `{ markRead: "unsupported", dismiss: "unsupported", preferences: "unsupported" }`.
- Frontend query key: `["notifications", actorId, simulationRunId]`.
- E2E seam: `POST /api/v1/e2e/commands/notification`. Do not expose as a public mutation API.
- See `docs/architecture/02-domain-model/21_Authoritative_Notification_Model.md` and `docs/architecture/08-workplace-projection-contracts/09_Notifications_Vertical_Slice.md`.

### Authoritative Activity model and Activities / Completed History Vertical Slice (PS-ROADMAP-022)

- Runtime Activities are authoritative `SimulationState.activities` owned by SimulationRun (schema v8). Do not create an Activity aggregate, repository, outbox, table, or separate Completed History authority.
- Lifecycle v1: `active | completed`. No reopen/cancel. No severity/due/priority/type categories in v1.
- Commands: `InitializeActivity` (trusted/internal for chapter init) + `CompleteActivity` (public learner command as of BC-004). Events: `ActivityInitialized`, `ActivityCompleted`.
- `activityProgress` remains an unused Learning placeholder — do not overload it for workplace Activities.
- Projections: `activities` (active-only, creationSequence ascending) and `completed_history` (completed-only, completionSequence descending). Both derive from authoritative Activities only.
- Read-only APIs: `GET …/activities` (`getActivitiesProjection`), `GET …/completed-history` (`getCompletedHistoryProjection`).
- Query keys: `["activities", actorId, simulationRunId]`, `["completed-history", actorId, simulationRunId]`.
- Nav order: Mission Control → Inbox → Meetings → Stakeholders → Documents → Notifications → Activities → Completed History → Decision Log.
- Public command: `POST …/commands/complete-activity`. E2E seams remain for InitializeActivity.
- See `docs/architecture/02-domain-model/22_Authoritative_Activity_Model.md` and `docs/architecture/08-workplace-projection-contracts/10_Activities_and_Completed_History_Vertical_Slice.md`.

### Business-case content schema and validation (BC-003)

- Canonical contract: `docs/business-cases/03-content-schema-and-validation/00_Content_Schema_and_Validation.md`.
- Domain authoring contracts live under `packages/domain/src/simulation/content/business-case/`. Pure validator: `validateBusinessCasePackage`. Runtime decision/consequence types remain separate (`ContentDecisionDefinition` / `ContentConsequenceDefinition` / `ContentConsequenceTiming` avoid clashing with SubmitDecision runtime contracts).
- Application ports/use cases: `packages/application/src/content/` (catalog, publication, create-run-from-case). Server resolves the selectable published default version; do not trust client `contentPackageVersionId`.
- Infrastructure currently ships an in-memory registry/resolver (`packages/infrastructure/src/content/`) plus additive migration `supabase/migrations/20260727080000_bc003_content_schema_and_experience_level.sql` (`content.*` tables + nullable `simulation_state.experience_level`). Apply with `pnpm run db:migrate` before Postgres tests after pull.
- API: `GET /api/v1/business-cases`, `GET /api/v1/business-cases/:businessCaseId`, `POST /api/v1/simulation-runs` with `{ businessCaseId, experienceLevel }`. Catalog responses are learner-safe (no rubrics/consequences/hidden evidence).
- Fixtures: `northstar-connected-care@1.0.0` and `harbor-logistics-recovery@1.0.0`. Validate with `pnpm content:validate --case <id> --version 1.0.0` or `pnpm content:validate:catalog`.
- Do not hardcode Northstar into React or shared projections. Do not execute authored JS/SQL/eval from content packages.

### Chapter One vertical slice (BC-004)

- Branch/work: content-driven Chapter One for `northstar-connected-care@1.0.0` (`chapter-01` — The Access Problem). Full Chapters 2–6 content is authored in BC-006 Workstream 2 (see below); Chapter One decision IDs (`decision.define-objective`, `decision.select-delivery-approach`, `decision.establish-governance`) remain the validated Ch1 contract.
- Create-run path: resolve published package → pin `contentPackageVersionId` + `experienceLevel` → seed content metric keys → start run → `initializeChapterFromContent` (commands only: stakeholders/documents/notifications/activities/meetings/messages). Never insert projection rows directly.
- Decision/projection providers prefer registry-backed packages (`cpv:northstar-connected-care:1.0.0`, Harbor). Composition also keeps scaffold `cpv_1`/`decision_1` as a fallback so E2E fixtures that still pin scaffold content keep working when the business-case registry is wired. Projection rebuilds pass `run.experienceLevel` into projection-safe prompts.
- Public workplace commands (SubmitDecision envelope: Idempotency-Key = commandId, If-Match): `complete-activity`, `start-meeting`, `complete-meeting`, `complete-chapter`. Chapter completion requirements and ending notification are resolved server-side from pinned content (`completeChapterFromContent`).
- Web: `/catalog`, `/catalog/:businessCaseId` (experience level required before start) → `/app/runs/:id/mission-control`. Reuse existing Workplace surfaces; do not build a second Workplace.
- Durable Postgres content repository wiring remains outstanding — API composition still uses the in-memory registry for fixtures. SimulationRun/state/outbox/projections stay durable when Postgres mode is selected.
- Focused API proof: `apps/api/src/content/chapter-one-vertical-slice.test.ts`.

### Chapter One validation (BC-005)

- Evidence plan: `docs/business-cases/04-chapter-one-validation/`. Suites: `apps/api/src/content/bc005-chapter-one-validation.test.ts` (memory reliability), `apps/api/src/content/bc005-postgres-path.integration.test.ts` (PATH-001..007; skip without `DATABASE_URL`), `packages/infrastructure/src/simulation/postgres/test-db-cleanup.parallel.integration.test.ts` (REL-010), `apps/web/e2e/chapter-one.validation.happy.spec.ts` (Playwright public API path).
- Progressive eligibility: after Chapter One init only the first required decision is pending (`pendingDecisions.count === 1`), not all three. Assert ranges or unlock after each submit.
- Postgres create-run needs tenant membership (`simulation.run.view` + `simulation.run.start`). E2E seeds membership via the decision-lifecycle fixture seam with a distinct scaffold `simulationRunId`, then creates Northstar through `POST /api/v1/simulation-runs`. Prefer `cleanupE2eTenant` over global truncate.
- Drain Postgres outbox with `registry.get(tenantId).module.outboxRelay.tick()` (or e2e `convergeRelay`) until `claimed === 0` before asserting projections.
- Parallel Postgres suites must use unique tenant IDs and `cleanupPostgresTenants` only — never global `TRUNCATE`.

### Northstar complete content package (BC-006 Workstream 2)

- Assembly: `createNorthstarConnectedCarePackage()` in `packages/domain/src/simulation/content/business-case/fixtures/northstar.ts` composes Chapter One plus chapters 2–6 from `northstar-chapter-*.ts` / `northstar-chapter-catalogs.ts`. Content version remains `1.0.0`.
- Companion contracts: `createNorthstarCanonicalContractSet()` adds coaching interventions and strict source-document traceability (`requireTraceabilityCoverage: true`). Inbox classification uses Workstream 1 `classifyInboxMessage`.
- Stakeholder IDs: preserve validated Chapter One IDs/names; extend with PMO, change-lead, site-leader, benefits-owner, quality, steering-secretariat, support-lead, delivery-lead, business-owner, frontline-manager, procurement, incident-lead. Stakeholder-arc name differences in docs are resolved by keeping Chapter One identity.
- Decision IDs: Chapter One keeps `decision.define-objective` / `select-delivery-approach` / `establish-governance`. Chapters 2–6 use `decision.northstar.chapter-0N.*`. Inbox shorthand `decision.cN.*` aliases map to catalog IDs (see comments in catalogs).
- Chapter 5 title: prefer blueprint/catalogs **Delivery and Readiness** over the Chapter Five doc H1 “Stabilization and Adoption”.
- Deferred elsewhere: coaching AI execution, ending eligibility calculation beyond declarative `eligibleWhen` (Workstream 6).
- Validate: `pnpm --filter @projectsim/domain test`, `pnpm run content:validate`, `pnpm run content:validate:catalog`. Harbor must remain isolated and valid.

### Northstar decision and consequence runtime (BC-006 Workstream 3)

- Runtime adapter: `mapBusinessCasePackageToRuntimeDecisions` / `mapContentDecisionToRuntimeDefinition` in `packages/domain/src/simulation/content/business-case/map-to-runtime-decisions.ts`. Registry providers remain the Application/Infrastructure entry (`registry-backed-decision-providers.ts`).
- Shared eligibility: `packages/domain/src/simulation/run/decision-eligibility.ts` (`isDecisionDefinitionAvailable` / `validateDecisionEligibility` / `buildDecisionEligibilityContext`). Projection builders must call the same helpers — never a display-only reinterpretation.
- Condition evaluation: pure `evaluateConditionExpression` in `packages/domain/src/simulation/content/business-case/evaluate-condition.ts` against authoritative facts (no wall clock, randomness, AI, or projections).
- Resolver version remains `decision-resolver/v1` (`SUPPORTED_RESOLVER_VERSION`). Existing Outcomes must never be silently recalculated under a newer resolver.
- Consequence logical identity remains `simulationRunId` + `DecisionRecordId` + `ConsequenceDefinitionId` + `resolverVersion`.
- Content pinning: resolution uses the run’s immutable `contentPackageVersionId`; mutable catalog defaults must not change an existing run.
- Chapter One IDs stay `decision.define-objective` / `decision.select-delivery-approach` / `decision.establish-governance`. Chapters 2–6 keep `decision.northstar.chapter-0N.*`.
- Evidence: eligibility checks authoritative documents / completed meetings / delivered messages / completed activities when mapped onto runtime `DecisionDefinition`. Northstar currently authors document evidence tags.
- Immediate consequences apply atomically in authored order; metric bounds fail closed (`METRIC_BOUNDS_EXCEEDED`); cross-context effects remain signals.
- Delayed consequences create pending `ScheduledEventInstruction` rows with provenance (`sourceDecisionId`, `sourceChapterId`, `targetChapterId`, `deferredEffectKind`, `deferredEffectPayload`). Schema version stays **8**; missing provenance fields rehydrate as `null`. Delayed effects must not materialize future Workplace/state changes in W3.
- Retries: Domain rejects duplicate decision definitions (`DECISION_ALREADY_SUBMITTED`); command-level identical idempotency receipts remain Application/Infrastructure responsibility.
- Cross-chapter causation: schedule instructions retain origin DecisionRecord + authored Decision/Chapter IDs for Workstream 4 release.
- Workstream 4 owns schedule execution / crises / chapter engine (see below). Ending selection and Workplace projection expansion remain later workstreams.

### Northstar simulation engine behavior (BC-006 Workstream 4)

- Trigger / schedule evaluation: `evaluateSimulationEngine` in `packages/domain/src/simulation/run/engine-evaluation.ts`. Boundaries: `chapter_exit`, `chapter_entry`, `decision_resolved`, `metric_changed`, `completion`, `manual`.
- Schedule lifecycle: `pending|scheduled → eligible → applied` with terminals `cancelled` / `expired` / `superseded` (`scheduled-event.ts`). Legacy `pending` remains a synonym of `scheduled`. Applied schedules are immutable.
- Deferred effect application: `applyDeferredEffectFromSchedule` applies metric/stakeholder-behavior/project-state/narrative-flag/unlock snapshots from `deferredEffectPayload`. Unsupported Workplace unlocks record acknowledgement flags only (no second authority).
- Ordering: category (`safety_compliance` → … → `ending`), then numeric `priority`, then stable schedule id (`compareSchedulesForApplication`).
- Chapter progression: `processCompleteChapter` evaluates optional `completionWhen`, runs chapter-exit engine, blocks on unresolved crises, then chapter-entry engine for `nextChapterId`. `completeChapterFromContent` passes pinned `crises` + `completionWhen`.
- Metrics: existing Domain metric deltas remain fail-closed (`METRIC_BOUNDS_EXCEEDED`). Engine metric applications reuse the same path.
- Stakeholder behavior: additive `SimulationState.stakeholderBehavior` map (trust/support/resistance). Schema version stays **8**; missing map → `{}` on rehydrate.
- Crises: additive `SimulationState.crises` (`crisis-runtime.ts`). Trigger once per crisis id; resolution via authored `resolutionWhen`. Blocking crises prevent chapter completion.
- Narrative flags: additive `SimulationState.narrativeFlags` for engine flags / unlock intents.
- Exactly-once schedule application: re-evaluating an applied schedule is a no-op (no duplicate metric/stakeholder deltas).
- Replay/reload: new schedule statuses and engine fields serialize on schema **8** with tolerant defaults for legacy snapshots.
- Deferred to Workstream 6/7: coaching execution, XP/mastery/achievements/reflection, experience-level learning tailoring, full ending determination, integrated release validation.

### Northstar authoritative projections and APIs (BC-006 Workstream 5)

- Registered workplace types (snake_case): existing Milestone 2 family plus `performance` and `learner_progression` (both schema v1). Taxonomy lives in `workplace-types.ts`; production registry + `WORKPLACE_CONVERGENCE_MANIFEST` must stay aligned.
- Builders (pure, deterministic, Domain): `mission-control-builder.ts`, `inbox-builder.ts`, `meetings-builder.ts`, `documents-builder.ts`, `decision-log-builder.ts`, `performance-builder.ts`, `learner-progression-builder.ts` (plus existing stakeholders/notifications/activities/completed-history).
- Shared envelope / `saveIfNewer` / semantic hash / source cursors / event-ID inbox rules remain the only consistency machinery. No per-surface write models or consistency metadata.
- Projection-safe content catalogs now include decisions, messages (classification + links), chapters (required work), meetings, documents, and activities via `mapBusinessCasePackageToProjectionSafeContent`. Inbox/Meetings/Performance/Learner Progression rebuilds require `contentProvider`.
- Public routes (kebab-case, type bound server-side): `…/mission-control`, `…/inbox`, `…/meetings`, `…/documents`, `…/decision-log`, `…/performance`, `…/learner-progression` (plus existing shell routes). Never add generic `…/projections/{projectionType}`.
- Web query keys: `["mission-control"|"inbox"|"meetings"|"documents"|"decision-log"|"performance"|"learner-progression", actorId, simulationRunId]`. Progress UI route segment is `/progress`; API suffix remains `learner-progression`.
- Identity: one DecisionRecord → one Decision Log entry; decision-bearing Inbox items reference one canonical Decision id; meeting `relatedDecisionIds` come only from authored projection-safe meeting metadata (never inferred from agenda text).
- Informational vs decision: Inbox `classification` uses `classifyInboxMessage`. Informational messages never increase Mission Control `pendingDecisions` or Inbox `classificationCounts.decision_bearing`. Missing message metadata fails closed to `informational`.
- Mission Control `pendingDecisions` equals authoritative eligible unresolved decisions; `unreadActionRequiredInboxItems` stays unavailable while read-state is unsupported; `activeActivities` / `blockingCrises` are available counts from authoritative state.
- Performance boundary: learner-safe runtime evidence only (metrics, counts, crisis identities, recently resolved public summaries). No XP, mastery, achievements, coaching, or reflection — those live on dedicated learning projections (Workstream 6).
- Learner-progression boundary: chapter requirement progress from authoritative completions + projection-safe chapter catalogs. No XP/mastery/achievements/reflection.
- Convergence: FULL_FAMILY fan-out includes `performance` and `learner_progression`. Rebuild/catch-up/query-time sync reuse shared Get* services (`current` | `rebuild_failed`).
- Package consumers resolve workspace packages from `dist/` — rebuild `@projectsim/infrastructure` after composition-root changes before API integration tests.
- Deferred to Workstream 7: full integrated Northstar release validation.

### Northstar learning experience (BC-006 Workstream 6)

- Authoritative path: `SimulationRunReadSnapshot` → pure Domain extractors/evaluators in `packages/domain/src/learning/` → rebuildable projection builders (`achievements` / `mastery` / `coaching`). SimulationState schema remains **8**; learning aggregates are derived, not stored as Core Simulation mutations.
- Evidence: `extractLearningEvidence` (`learning-evidence/v1`). Source types: `decision_learning_signal`, `completed_activity`, `completed_practice_activity`, `completed_reflection_activity`, `completed_chapter`. Decision evidence IDs reuse authored learning-signal IDs; activity/chapter IDs are `learning_evidence:{activity|chapter}:{runId}:{sourceId}:learning-evidence/v1`. Informational inbox/page views produce no evidence.
- Decision assessment: `assessResolvedDecision` (`decision-assessor/v1`). Passes through authored `qualityClassification` only (never invents Exemplary/Effective/… bands). Competency contributions come from evidence deltas; threshold-sensitive negatives on governance/quality-compliance (or unsafe/ethic reason codes) are flagged.
- Competency aggregation / mastery: `aggregateCompetencyEvidence` / `evaluateMastery`. Cumulative deltas + evidence counts are available; mastery **bands** remain `unavailable` with `mastery_thresholds_not_authored` until content authors thresholds.
- XP: `evaluateXpAwards` always returns `availability: "unavailable"`, reason `xp_amounts_not_authored`. No invented point values. Projection rebuilds cannot invent awards.
- Achievements: `evaluateAchievements` (`achievement-award/v1`) via authored `awardedWhen` conditions. Award identity: `achievement_award:{simulationRunId}:{achievementId}:achievement-award/v1` (once per run).
- Practice / reflection: workplace activities with `activityType` `practice` | `reflection`; completion via existing `CompleteActivity` (no separate free-text store or SubmitPracticeAttempt command until content/schema contracts exist). Completion evidence is derived from authoritative activity status.
- Coaching: `selectCoachingInterventions` filters by audience × experience level and `triggerWhen`; deterministic fallback text from title + guidance. AI must never select interventions, mutate SimulationState, award XP/achievements, or change mastery/evidence.
- Experience levels (Explorer / Practitioner / Leader): presentation/scaffolding only (e.g. explorer-only hints). Same evidence identities, safety/governance standards, and achievement conditions apply unless authored otherwise.
- Learning-safe content: `LearningSafeContent` via `mapBusinessCasePackageToLearningSafeContent` (+ Northstar coaching from canonical contract set). Distinct from W5 `ProjectionSafeContent`.
- Registered projection types (schema v1 each): `achievements`, `mastery`, `coaching`. FULL_FAMILY / convergence inventory must stay aligned.
- Public routes: `GET …/achievements`, `GET …/mastery`, `GET …/coaching` (type bound server-side). Web query keys: `["achievements"|"mastery"|"coaching", actorId, simulationRunId]`. Shell routes: `/achievements`, `/mastery`, `/coaching`.
- Hidden weights, answer keys, resolver internals, and outbox metadata must not appear in learning payloads.
- Deferred (content): authored XP amounts / level thresholds; mastery band thresholds; free-text reflection persistence; separate practice-attempt assessment model; AcknowledgeCoaching command.

### Northstar integrated validation and release readiness (BC-006 Workstream 7)

- Six-chapter harness: `apps/api/src/content/northstar-six-chapter-harness.ts` + `bc006-w7-northstar-six-chapter.test.ts` (strong mid-option path, adverse last-option path, Explorer/Practitioner/Leader).
- CompleteChapter side effects: after first successful completion, initialize next chapter workplace content via `initializeChapterFromContent` (chapter-scoped command IDs `cmd_init_{runId}_{chapterId}_{n}`). On final chapter, `selectFinalEnding` (`ending-resolver/v1`) then `lifecycle.complete`.
- Catalog metric deltas in `buildDecision` stay small (±1) so a full path remains inside fail-closed [0,100] bounds.
- Release validation commands: root `pnpm run format:check|lint|typecheck|test|build`, content validate Northstar/Harbor/catalog, package filters, Playwright workplace + learning a11y suites, Postgres suites when `DATABASE_URL` + `DATABASE_ADMIN_URL` set.
- Evidence docs: `docs/business-cases/09-validation/07_Workstream_7_Validation_Matrix.md`, `08_Workstream_7_Release_Recommendation.md`.
- Accepted limitations remain honest: XP/mastery unavailable; manual AT and production load not certified here. Ending discrimination is content-owned (see BC-007).
- Parent issue #83 must not be closed by the Workstream 7 PR (`Part of #83` only). BC-008 must not start from Workstream 7.

### Northstar content quality review (BC-007)

- Evidence directory: `docs/business-cases/10-content-quality-review/` (plan, inventory, narrative/business review, decision fairness, workload/assessment, defect log, review evidence, signoff).
- Review matrix / defect log: `00_Content_Quality_Review_Plan.md`, `05_Content_Defect_Log.md`, `06_BC007_Review_Evidence.md`, `07_BC007_Signoff_Recommendation.md`.
- Workload audit: deterministic chapter estimates via `auditContentQuality()` (`packages/domain/src/simulation/content/business-case/content-quality-audit.ts`); blueprint standard remains 600 minutes / 10 learning days — do not invent a new target.
- Canonical content-quality commands: `pnpm --filter @projectsim/domain exec vitest run src/simulation/content/business-case/content-quality-audit.test.ts`; keep `pnpm content:validate -- --case northstar-connected-care --version 1.0.0` and Harbor/catalog validates green.
- Stable-ID rule: preserve chapter/decision/stakeholder/meeting/document/activity/crisis/ending IDs; do not rename for style.
- Decision-fairness / evidence-before-decision: required decisions must keep eligibility evidence; informational Inbox must use `informationalOnly: true` when not requiring a response.
- Spoiler-safety: learner-facing guidance must not preview crisis severity, ending keys, answer keys, or secret weights.
- Quantitative-consistency: keep $4.8M / $480K / $3.2M and nine-month duration aligned with Content Bible; do not invent missing figures.
- Ending eligibility: E1–E9 use discriminative Chapter Six `eligibleWhen` conditions gated on resolved `final-closure-recommendation` (selection runs before chapter completion). E9 is the catch-all. Strong mid-option path → E2; adverse last-option path → E9.
- Assessment-validity boundary: no invented XP amounts or mastery thresholds; practice/reflection remain workplace activity completions until separate contracts exist.
- Accepted limitations: XP/mastery unavailable; free-text reflection / practice-attempt model deferred; residual document boilerplate; no learner-pilot evidence.
- Deferred to BC-008 Lovable refinement workstreams: presentation changes measured against the BC-008 UI baseline.
- Deferred to REL-001: production-readiness certification.

### BC-008 UI baseline (pre-Lovable)

- Evidence directory: `docs/business-cases/11-lovable-experience-refinement/`.
- Surface matrix: `04_Surface_Refinement_Matrix.md`.
- Responsive baseline: `05_Responsive_Baseline.md`.
- Accessibility baseline: `06_Accessibility_Baseline.md`.
- Screenshot directory: `docs/business-cases/11-lovable-experience-refinement/screenshots/` (indexed by `07_Screenshot_Index.md`; re-capture via `scripts/capture-baseline.mjs` without overwriting prior stamps).
- UX issue backlog: `08_Known_UX_Issues.md` (inventory only until a refinement workstream).
- Lovable MAY: layout, spacing, readability, navigation clarity, responsiveness, accessibility presentation, empty/loading/error presentation, guidance/urgency presentation of already-learner-safe content.
- Lovable MAY NOT: change SimulationState, commands, projections, APIs, decision/consequence/scoring/XP/mastery logic, architecture, database/migrations, content IDs, runtime behavior, or hardcode business logic; GitHub remains source of truth.
- This baseline PR must not modify runtime/domain/application/infrastructure code.

### BC-012 Legacy visual transfer (`navi-plan-game` → `projectsim-2`)

- Evidence directory: `docs/business-cases/12-legacy-visual-transfer/`.
- Source pin: `navi-plan-game` `main` @ `0eb6abfdafde14a6fedd06f3a8b0f75dc9f58870` (`00_Source_Reference.md`).
- Screen matrix: `01_Screen_Migration_Matrix.md`. Missing contracts: `02_Missing_Contracts.md`.
- Transfer only presentational design (tokens, layouts, nav chrome, cards, responsive, skeletons, non-authoritative animation). Never copy `src/lib/sim/**`, `useSim()`, legacy routing/Supabase/Lovable, browser-calculated progress/XP/eligibility/outcomes, or mock authoritative data.
- Preserve PS2 routes, query keys, projections, commands, Domain/Application/infrastructure, and convergence behavior.
- Implement one surface per feature branch + draft PR; order starts with Workplace Shell, then Mission Control.
- Closed prior attempt (no source SHA): PR #96 / `ui/legacy-visual-transfer-20260729` — treat as candidate visuals only after re-validation against the pinned master SHA.
