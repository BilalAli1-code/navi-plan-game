# TypeScript Standards

**Document ID:** PS-ENG-003  
**Version:** 1.0  
**Status:** Approved

## Compiler Settings

Use strict TypeScript settings.

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "useUnknownInCatchVariables": true
  }
}
```

## Rules

1. Avoid `any`.
2. Use `unknown` for untrusted input.
3. Validate boundaries with schemas.
4. Prefer discriminated unions.
5. Use branded identifiers for domain IDs.
6. Prefer immutable data.
7. Avoid non-null assertions.
8. Export stable public contracts explicitly.
9. Distinguish DTOs from domain types.
10. Exhaustively handle unions.

## Example

```ts
type SimulationRunStatus =
  | { kind: "created" }
  | { kind: "active"; startedAt: string }
  | { kind: "paused"; pausedAt: string }
  | { kind: "completed"; completedAt: string };
```

## Error Handling

Use typed results for expected failures.

```ts
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };
```

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial TypeScript standards |
