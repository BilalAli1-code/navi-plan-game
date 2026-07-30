import { DOMAIN_PACKAGE } from "@projectsim/domain";

/**
 * @projectsim/application
 *
 * Application / API layer: authentication context, authorization, validation,
 * and command/query dispatch. It coordinates use cases but must not own
 * business rules (those live in @projectsim/domain).
 * See docs/handbook/05_Domain_and_Application_Coding_Standards.md.
 */
export const APPLICATION_PACKAGE = "@projectsim/application";

/** Allowed inbound dependency, encoding the architectural layering. */
export const APPLICATION_DEPENDS_ON = [DOMAIN_PACKAGE] as const;

export * from "./simulation";
export * from "./content";
