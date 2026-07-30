/**
 * Shared kernel: branded identifiers, timestamps, result and error types, and
 * the canonical event envelope. Per
 * docs/architecture/02-domain-model/02_Bounded_Contexts.md the shared kernel
 * must not contain business rules, UI models, or AI prompts.
 */
export * from "./ids";
export * from "./time";
export * from "./result";
export * from "./exhaustive";
export * from "./errors";
export * from "./event-envelope";
