/**
 * Exhaustiveness helper (shared kernel).
 *
 * Placing `assertNever` in the `default` branch of a `switch` over a
 * discriminated union causes a compile-time error if a case is ever left
 * unhandled, satisfying docs/handbook/03_TypeScript_Standards.md rule 10
 * ("Exhaustively handle unions").
 */
export function assertNever(value: never, message?: string): never {
  throw new Error(
    message ?? `Unexpected unhandled value: ${JSON.stringify(value)}`,
  );
}
