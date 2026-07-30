# Memory Architecture

**Document ID:** PS-AI-010  
**Version:** 1.0  
**Status:** Approved

## Memory Types

- Conversation memory
- Session memory
- Simulation Run memory
- Learner preference memory
- Coaching-history memory
- Persona memory
- Enterprise configuration memory

## Rules

1. Authoritative domain state is not AI memory.
2. Memory references approved source records.
3. Memory has explicit scope.
4. Cross-tenant memory is prohibited.
5. Sensitive memory has retention controls.
6. Memory can be deleted or expired according to policy.
7. Summarized memory retains source references.
8. Learner preference memory requires appropriate consent.
9. Memory cannot override current projections.
10. Memory retrieval is logged for material interactions.

## Memory Record

```ts
interface AIMemoryRecord {
  id: string;
  scopeType: string;
  scopeId: string;
  memoryType: string;
  content: string;
  sourceReferences: string[];
  expiresAt?: string;
  createdAt: string;
}
```

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial memory architecture |
