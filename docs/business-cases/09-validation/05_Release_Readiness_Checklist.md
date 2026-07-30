# BC-006 Phase 5 — Release Readiness Checklist

## Status
Release gate

## Purpose
This checklist defines the minimum evidence required before the Northstar flagship simulation may be approved for production release.

## 1. Documentation

- [ ] Phase 1 narrative documents are complete and approved.
- [ ] Phase 2 decision-system documents are complete and approved.
- [ ] Phase 3 simulation-engine documents are complete and approved.
- [ ] Phase 4 learning-experience documents are complete and approved.
- [ ] Phase 5 validation documents are complete and approved.
- [ ] Canonical identifiers are stable and unique.
- [ ] Traceability matrix has no unresolved orphaned items.
- [ ] Known limitations and approved waivers are documented.

## 2. Content

- [ ] All six chapters are represented in validated runtime content.
- [ ] Inbox, meeting, document, activity, and decision catalogs pass schema validation.
- [ ] Stakeholder arcs remain coherent across chapters.
- [ ] Required content is reachable.
- [ ] Optional and conditional content has valid activation rules.
- [ ] Every decision has complete options and consequences.
- [ ] Every ending is reachable through an approved path.
- [ ] PMBOK Guide Eighth Edition mappings are reviewed.

## 3. Domain and Application Behavior

- [ ] Invalid state transitions are rejected.
- [ ] Idempotency is enforced.
- [ ] Sequence ordering is durable.
- [ ] Immediate consequences apply exactly once.
- [ ] Delayed consequences schedule and activate correctly.
- [ ] Chapter completion and gating are deterministic.
- [ ] Stakeholder state persists and evolves correctly.
- [ ] Ending determination is deterministic and explainable.

## 4. Persistence and Security

- [ ] Database migrations are reviewed and tested.
- [ ] Row-level security is enabled and verified.
- [ ] Tenant isolation tests pass.
- [ ] Transaction boundaries protect authoritative writes.
- [ ] Event outbox behavior is verified.
- [ ] Retry and recovery behavior is tested.
- [ ] Sensitive learner input follows approved handling rules.
- [ ] Server-side authorization is enforced.

## 5. Projections and APIs

- [ ] Every learner-facing surface reads from authoritative state.
- [ ] Projection rebuilds reproduce incremental state.
- [ ] Duplicate events do not corrupt projections.
- [ ] Empty and unavailable states are defined.
- [ ] API contracts are versioned and validated.
- [ ] Error and concurrency semantics are stable.
- [ ] Cross-surface decision and completion counts converge.

## 6. Learning Experience

- [ ] Explorer, Practitioner, and Leader tailoring is correct.
- [ ] Coaching is grounded in authoritative simulation facts.
- [ ] Feedback timing follows the approved model.
- [ ] Assessment evidence is captured and traceable.
- [ ] Mastery updates are deterministic.
- [ ] Reflection and performance summaries persist.
- [ ] No required learning objective lacks assessment evidence.

## 7. Accessibility

- [ ] Required workflows are keyboard accessible.
- [ ] Screen-reader semantics are verified.
- [ ] Focus management is correct.
- [ ] Meaning does not depend on color alone.
- [ ] Contrast meets the approved standard.
- [ ] Reduced-motion behavior is supported.
- [ ] Required interactions have accessible alternatives.
- [ ] Learners are not blocked by unnecessarily strict timers.

## 8. Quality Assurance

- [ ] Content validation suite passes.
- [ ] Domain unit tests pass.
- [ ] Application integration tests pass.
- [ ] Persistence integration tests pass.
- [ ] Projection tests pass.
- [ ] API contract tests pass.
- [ ] End-to-end journey tests pass.
- [ ] Deterministic replay test passes.
- [ ] Regression suite passes.
- [ ] No unresolved critical or high-severity defects remain.

## 9. Performance and Reliability

- [ ] Command and projection latency meet agreed targets.
- [ ] Projection rebuild performance is acceptable.
- [ ] Outbox backlog recovery is tested.
- [ ] Concurrent simulation runs remain isolated.
- [ ] Retry behavior does not create duplicate effects.
- [ ] Recovery from interrupted sessions is verified.

## 10. Observability and Operations

- [ ] Command failures are observable.
- [ ] Projection lag is observable.
- [ ] Outbox failures are observable.
- [ ] Delayed-consequence backlog is observable.
- [ ] Content-version and commit SHA are recorded.
- [ ] Production dashboards and alerts are configured.
- [ ] Rollback and incident procedures are documented.
- [ ] Operational ownership is assigned.

## 11. Deployment

- [ ] Release candidate is built from the approved commit.
- [ ] Environment configuration is validated.
- [ ] Migration rehearsal passes.
- [ ] Backup and rollback procedures are verified.
- [ ] Smoke tests pass in the target environment.
- [ ] Release notes are prepared.
- [ ] Final approval is recorded.

## Release Decision
The release may proceed only when all mandatory items are complete or an explicit, time-bounded waiver is approved by the accountable owner. Critical security, data integrity, deterministic execution, tenant isolation, or required-journey failures are not waivable.
