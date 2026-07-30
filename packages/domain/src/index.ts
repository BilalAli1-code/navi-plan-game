/**
 * @projectsim/domain
 *
 * Framework-independent domain layer: bounded-context models, business rules,
 * invariants, and repository *interfaces*. Domain code must not perform
 * database, network, or UI work, and must not import the infrastructure or UI
 * packages. See docs/handbook/05_Domain_and_Application_Coding_Standards.md and
 * docs/architecture/03-system-architecture/03_Monorepo_and_Package_Architecture.md.
 */
export const DOMAIN_PACKAGE = "@projectsim/domain";

export * from "./shared-kernel";
export * from "./simulation";
export * from "./projection";
export * from "./learning";
