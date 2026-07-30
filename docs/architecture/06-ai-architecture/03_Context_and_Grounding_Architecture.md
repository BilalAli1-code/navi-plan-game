# Context and Grounding Architecture

**Document ID:** PS-AI-003  
**Version:** 1.0  
**Status:** Approved

## Purpose

Provide the smallest approved context required for a specific AI task.

## Grounding Sources

- Mission Control projection
- Current Day projection
- Stakeholder projection
- Learning projection
- Decision outcome projection
- Approved content excerpts
- Conversation history
- Report projection

## Grounding Package

```ts
interface GroundingPackage {
  interactionId: string;
  simulationRunId?: string;
  learnerId?: string;
  personaId: string;
  taskType: string;
  sourceVersions: Record<string, number>;
  context: Record<string, unknown>;
  restrictions: string[];
  createdAt: string;
}
```

## Rules

1. AI does not query unrestricted production tables.
2. Context is purpose-specific.
3. Hidden content is excluded unless required by the persona policy.
4. Source versions are recorded.
5. Learner-visible answers do not expose internal scoring formulas.
6. Sensitive fields are redacted.
7. Context size is bounded.
8. Stale projections may be rejected for critical tasks.
9. Grounding is reproducible where practical.
10. Context assembly is tested separately from prompt rendering.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial grounding architecture |
