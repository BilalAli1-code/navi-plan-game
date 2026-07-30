# Business Invariants

**Document ID:** PS-DOM-015  
**Version:** 1.0  
**Status:** Approved

## Platform

- Every aggregate has one owner.
- Cross-context mutation is prohibited.
- Every business change is traceable.
- Replay must be deterministic.

## Simulation

- A Simulation Run references one Content Package version.
- Action history is append-only.
- Decision outcomes are immutable.
- Metrics change only through consequences.
- Duplicate commands cannot duplicate effects.
- Completion is derived from explicit requirements.

## Content

- Published content is immutable.
- Version history is permanent.
- Content never stores learner progress.
- Completion rules are declarative.

## Stakeholders

- Conversation history is append-only.
- Trust changes require traceable causes.
- AI cannot redefine relationship state.
- Completed activities do not delete history.

## Learning

- Mastery requires evidence.
- Project success is not learning success.
- Assessments never overwrite history.
- Confidence accompanies mastery.
- Recommendations are reproducible.

## Projection

- Projections are read-only.
- Projections are rebuildable.
- UI does not calculate business state.
- Projection failure cannot corrupt domain state.

## Analytics

- Analytics never changes operational state.
- Forecasts expose confidence.
- Insights cite evidence.
- Metrics identify source and calculation version.

## AI

- AI is non-authoritative.
- AI cannot directly mutate aggregates.
- Prompts and schemas are versioned.
- Outputs record provenance.
- Responses must be validated.
- AI failure cannot block core simulation processing.

## Identity

- Tenant isolation is mandatory.
- Permissions grant capabilities, not ownership.
- Every command records actor identity.

## Infrastructure

- Events are durable.
- APIs are versioned.
- Migrations are reversible where practical.
- Deployments are reproducible.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial business invariants |
