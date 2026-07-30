# React Standards

**Document ID:** PS-ENG-004  
**Version:** 1.0  
**Status:** Approved

## Rules

1. Use functional components.
2. Keep components focused.
3. Keep business rules outside components.
4. Fetch server state through query hooks.
5. Submit mutations through command hooks.
6. Use local state for temporary interaction state.
7. Avoid storing derived server data in global state.
8. Provide loading, empty, error, and permission states.
9. Keep effects narrow and explainable.
10. Prefer composition over large conditional components.

## Component Pattern

```ts
interface DecisionCardProps {
  decision: DecisionProjection;
  onOpen: (decisionId: string) => void;
}

export function DecisionCard({
  decision,
  onOpen,
}: DecisionCardProps) {
  return (
    <button onClick={() => onOpen(decision.id)}>
      {decision.title}
    </button>
  );
}
```

## Hooks

Custom hooks should:

- Represent one responsibility
- Return stable shapes
- Hide transport details
- Avoid surprising side effects
- Include tests when logic is non-trivial

## Accessibility

Semantic HTML is the default. ARIA is used only where native semantics are insufficient.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial React standards |
