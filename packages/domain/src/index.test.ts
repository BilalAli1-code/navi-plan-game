import { describe, expect, it } from "vitest";
import { DOMAIN_PACKAGE } from "./index";

describe("@projectsim/domain scaffold", () => {
  it("given_the_domain_package_when_imported_then_it_exposes_its_name", () => {
    expect(DOMAIN_PACKAGE).toBe("@projectsim/domain");
  });
});
