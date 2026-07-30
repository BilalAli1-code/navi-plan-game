# Engineering Principles

**Document ID:** PS-ENG-001  
**Version:** 1.0  
**Status:** Approved

## Principles

1. Prefer clarity over cleverness.
2. Keep business rules out of UI components.
3. Keep infrastructure details out of domain code.
4. Make invalid states difficult to represent.
5. Use explicit types and stable contracts.
6. Test behavior at the correct layer.
7. Optimize only after measurement.
8. Preserve history and traceability.
9. Use small, reviewable changes.
10. Automate repeatable work.
11. Treat security and accessibility as engineering requirements.
12. AI-generated code must meet the same standards as human-written code.

## Decision Priority

When trade-offs exist, prioritize:

```text
Correctness
→ Security
→ Maintainability
→ Observability
→ Performance
→ Convenience
```

## Simplicity Rule

A simpler design is preferred when it preserves:

- Domain invariants
- Testability
- Extensibility
- Operational safety

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial engineering principles |
