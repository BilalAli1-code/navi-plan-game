import { describe, expect, it } from "vitest";
import { APPLICATION_DEPENDS_ON } from "@projectsim/application";
import { DOMAIN_PACKAGE } from "@projectsim/domain";
import { INFRASTRUCTURE_IMPLEMENTS } from "@projectsim/infrastructure";

/**
 * Cross-package integration test (docs/handbook/02_Repository_and_Workspace_Standards.md:
 * "Cross-package integration tests live in `tests/`.").
 *
 * This verifies the monorepo wiring only — that the built workspace packages
 * resolve and expose the expected architectural dependency direction. It does
 * not exercise business logic (none exists yet).
 */
describe("monorepo wiring", () => {
  it("given_the_application_layer_when_inspected_then_it_depends_on_the_domain", () => {
    expect(APPLICATION_DEPENDS_ON).toContain(DOMAIN_PACKAGE);
  });

  it("given_the_infrastructure_layer_when_inspected_then_it_implements_the_domain", () => {
    expect(INFRASTRUCTURE_IMPLEMENTS).toContain(DOMAIN_PACKAGE);
  });
});
