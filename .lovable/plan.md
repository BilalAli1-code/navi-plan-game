# Aligning ProjectSim with the Blueprint & Content Bible

The two docs (~3,300 lines) define a much richer simulation than what is currently implemented. The current code has the right *shape* (7 days, generic engine, casepack for Customer Portal, mastery/actions/events) but is missing the **chapter contract**, **in-world time**, **chapter gating**, **persistent stakeholder memory/commitments**, **separate communication vs decision-quality scoring**, and **context-aware Maya triggers** that the Blueprint requires. Trying to build all of that plus new Bible content in a single pass will produce shallow, unreliable changes.

I propose landing this in **three focused phases**. Each phase is self-contained, ships working code, passes typecheck/build/tests, and preserves auth/billing/entitlements/other cases.

## Phase 1 — Chapter model, gating, and in-world time (foundational)

Reusable engine changes only, no new business content. This is what everything else depends on.

- Rename the runtime concept from "Day" to **Chapter** in generic engine types (keep `day_number` DB columns; add a compatibility alias). Chapters ≠ calendar days (Blueprint §4.4, §8).
- Extend `DayDefinition` → `ChapterDefinition` with a **Chapter Contract** (Blueprint §7.2): `openingCondition`, `requiredActivities[]`, `keyDecisions[]`, `requiredOutputs[]`, `scoringEmphasis[]`, `advanceRule`.
- Add `SimState.inWorldDate` and `chapterInWorldSpan` so simulated time advances per chapter independently of learner time (Blueprint §8.3).
- Implement **configuration-driven chapter completion** in `daily.functions.ts`: a chapter closes only when its contract's `advanceRule` (required activities done + required decisions made + required outputs produced) is satisfied. No hard-coded per-case logic in the engine.
- Add **event gating** to `generator.ts` / a new `event-orchestrator.ts`: each seeded email/meeting/decision/risk carries `{chapter, requiresState?, requiresPriorDecision?}` and is only injected when its gate is satisfied (Blueprint §11.3).

Deliverables: engine types, chapter registry, gating helpers, migration adding `in_world_date` + `chapter_state` JSON to `simulation_runs`, unit tests for `canAdvanceChapter` and `isEventEligible`.

## Phase 2 — Stakeholder persistence, memory, commitments, scoring split

- Add `stakeholder_memories` and `stakeholder_commitments` tables (Blueprint §10). Wire read/write into `stakeholder-engine.ts` and `actions.engine.ts` so every interaction can create/close a memory or commitment.
- Extend `Stakeholder` state (trust / satisfaction / engagement / alignment — Blueprint §9.4) and apply deterministic deltas from action outcomes.
- Split scoring into **communication quality** and **decision quality** (Blueprint §12.3, §13). Store both on `simulation_actions` and roll up into `daily_progress` / `learner_mastery`.
- Add a lightweight rubric evaluator (server function) used by chat / negotiation / escalation panels; AI is used to score text, deterministic rules own the state (Blueprint §12.4, §15).

Deliverables: 2 tables + policies + grants, engine updates, updates to `ChatPanel`, `NegotiationPanel`, `EscalationPanel` to display the two scores, tests for commitment lifecycle.

## Phase 3 — Customer Portal (Project Horizon) content + Maya triggers

- Rewrite `casepacks/customer-portal.ts` to match the Bible verbatim: NorthStar Digital Solutions facts, 14 stakeholders with Bible-defined initial state, KPIs from §3.3, MVP scope from §5, and **all 7 chapters** using the new Chapter Contract with the Bible's opening conditions, proactive activity, required activities, key decisions, required outputs, cliffhangers, and persistent consequences.
- Seed proactive events per chapter (emails, meetings, escalations) with gates.
- Wire Maya's context payload to include: current chapter, unresolved commitments, degraded stakeholder relationships, recent decision quality, and last coaching level (Blueprint §14.3). Add trigger rules (§14.4) — silent by default, coaches on struggle/misalignment.

Deliverables: new casepack, seeded proactive events, Maya context builder, smoke tests that Chapter 1 → Chapter 2 progression works end-to-end.

## Cross-cutting rules I will follow

- Preserve auth, billing, entitlements, RLS, other business cases, and all currently working UI. No changes to `client.ts`, `client.server.ts`, `auth-middleware.ts`, `auth-attacher.ts`, generated `types.ts`, or `.env`.
- No hard-coded case logic in engine files. All case specifics live in `casepacks/*` and are consumed via the generic Chapter Contract.
- Reuse existing components (`DayDashboard`, `ChatPanel`, `MissionControl`, `Stakeholders`, `RiskResponsePanel`, `ConflictPanel`) — extend them, don't replace them.
- Every new `public.*` table gets `GRANT` + RLS + policies in the same migration.
- After each phase: `npx tsc --noEmit`, `npm run build`, `bunx vitest run`, and a Playwright smoke of the sim route.

## Ask before I start

1. **Do you want me to execute Phase 1 now** (engine foundation + gating + tests, ~1 large turn) and then check in before Phase 2/3? That's the only way to keep quality high on a change this size.
2. **Are the current DB columns (`day_number`, `daily_progress`) OK to keep as-is** while I add a compatibility `chapter_number` alias, or do you want a rename migration (breaking for any existing rows)?
3. **Any Bible sections I should treat as "must ship in Phase 3" vs "nice to have"** (e.g. all 7 chapters vs Chapters 1–3 fully wired + 4–7 stubbed)?

Once you confirm, I'll start Phase 1.
