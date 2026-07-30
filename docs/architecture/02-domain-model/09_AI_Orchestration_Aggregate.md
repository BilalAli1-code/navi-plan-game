# AI Orchestration Aggregate

**Document ID:** PS-DOM-009  
**Version:** 1.0  
**Status:** Approved

## Aggregate Root

`AIInteraction`

## Purpose

Coordinate grounded, safe, validated, versioned AI capabilities without making AI authoritative.

## Cognitive Services

- Maya Coach
- Stakeholder Dialogue
- Reflection Evaluation
- Feedback Generation
- Recommendation
- Scenario Narration
- Executive Briefing
- Knowledge Assistance
- Assessment Assistance

## Core Entities

- AI Interaction
- Persona
- Prompt Template
- Model Policy
- Model Invocation
- Grounding Context
- Structured Output
- Safety Decision
- AI Provenance
- AI Evaluation
- Memory Record

## Pipeline

```mermaid
flowchart LR
    A[Approved Projections] --> B[Context Builder]
    B --> C[Prompt Template]
    C --> D[Model Router]
    D --> E[Model]
    E --> F[Schema Validation]
    F --> G[Safety Validation]
    G --> H[Delivered AI Output]
```

## Invariants

1. AI is never authoritative.
2. AI cannot mutate aggregates directly.
3. AI receives bounded context, not unrestricted database access.
4. Prompts and output schemas are versioned.
5. Material AI outputs record provenance.
6. AI failures cannot corrupt or block core simulation state.
7. Personas cannot exceed configured authority.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial AI Orchestration Aggregate |
