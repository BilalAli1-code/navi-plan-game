import { DOMAIN_PACKAGE } from "@projectsim/domain";
import { APPLICATION_PACKAGE } from "@projectsim/application";

/**
 * @projectsim/infrastructure
 *
 * Infrastructure layer: concrete implementations of the application ports
 * (PS-003) and the domain event publisher, plus composition roots that wire them
 * to the application service. Includes in-memory adapters (PS-004A), Postgres /
 * RLS / transactional outbox (PS-004B), and outbox relay + capability
 * authorization (PS-004C). Database types are infrastructure artifacts — domain
 * code must not import them. See
 * docs/handbook/06_Supabase_and_Database_Engineering_Standards.md.
 */
export const INFRASTRUCTURE_PACKAGE = "@projectsim/infrastructure";

/**
 * Infrastructure implements interfaces owned by the domain and application
 * layers (adapters depend inward on the ports they implement).
 */
export const INFRASTRUCTURE_IMPLEMENTS = [
  DOMAIN_PACKAGE,
  APPLICATION_PACKAGE,
] as const;

export * from "./simulation";
export * from "./content";
