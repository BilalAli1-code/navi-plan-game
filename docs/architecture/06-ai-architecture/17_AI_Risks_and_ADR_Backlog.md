# AI Risks and ADR Backlog

**Document ID:** PS-AI-017  
**Version:** 1.0  
**Status:** Approved

## Risks

| Risk | Mitigation |
|---|---|
| AI becomes authoritative | Typed command boundary |
| Hidden scenario answers leak | Context policy and evaluation |
| Persona inconsistency | Versioned persona definitions |
| Hallucinated commitments | Grounding and schema validation |
| Sensitive data reaches providers | Data minimization and redaction |
| Provider lock-in | Provider adapters and model policies |
| Cost grows unpredictably | Budgets, routing, and telemetry |
| Prompt changes cause regressions | Versioned evaluations |
| Stakeholder behavior drifts | Grounding and persona tests |
| AI failure blocks learning | Deterministic fallbacks |

## ADR Backlog

- ADR-AI-001: AI Non-Authoritative Boundary
- ADR-AI-002: Central AI Orchestration Service
- ADR-AI-003: Projection-Based Grounding
- ADR-AI-004: Versioned Prompt Registry
- ADR-AI-005: Persona Registry
- ADR-AI-006: Provider Abstraction
- ADR-AI-007: Structured Output Validation
- ADR-AI-008: AI Provenance Storage
- ADR-AI-009: AI Memory Scoping
- ADR-AI-010: Evaluation Release Gates
- ADR-AI-011: Deterministic Fallbacks
- ADR-AI-012: Tenant AI Policy

## Review Triggers

Revisit this architecture when AI begins generating publishable content, autonomous agents are introduced, multimodal inputs become core, or enterprise customers require private model hosting.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial AI risks and ADR backlog |
