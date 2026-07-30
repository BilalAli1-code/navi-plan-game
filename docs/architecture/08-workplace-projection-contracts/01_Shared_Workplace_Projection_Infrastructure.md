# Shared Workplace Projection Infrastructure

**Document ID:** PS-ARCH-017  
**Roadmap item:** PS-ROADMAP-010  
**Version:** 1.0  
**Status:** Implemented (infrastructure seams)  
**Depends on:** PS-ROADMAP-009 / ADR-006

## Purpose

Record the executable infrastructure seams introduced for ADR-006 topology A3
without implementing workplace product surfaces.

## What shipped

| Seam | Location |
| --- | --- |
| `WorkplaceProjectionType` taxonomy | `packages/domain/src/projection/workplace-types.ts` |
| Shared envelope fields | `packages/domain/src/projection/envelope.ts` |
| Shared `evaluateProjectionSave` | `packages/domain/src/projection/save-policy.ts` |
| `deriveProjectionId` | `packages/domain/src/projection/ids.ts` |
| Rebuild registry + fan-out map | `packages/application/src/simulation/projection/workplace-projection-registry.ts` |
| Multi-type-aware event consumer | `packages/application/src/simulation/projection/projection-event-consumer.ts` |
| Type-keyed Postgres/memory repos | `postgres-projection-repository.ts`, `in-memory-projection-repository.ts` |

## Compatibility

- `SimulationProjection` schema version 1 remains flat and learner-facing.
- Public Decision projection route and Decision UI are unchanged.
- Only `projectionType: "simulation"` has a registered rebuild handler.

## Explicit non-delivery

Mission Control, Decision Log, Inbox, Meetings, Stakeholders, Documents,
Notifications, Activities, Completed History, new public workplace APIs, and
workplace UI remain later roadmap items (PS-011+).

## Revision History

| Version | Status | Description |
| --- | --- | --- |
| 1.0 | Implemented | PS-ROADMAP-010 shared infrastructure seams |
