import { describe, expect, it } from "vitest";
import {
  createHarborLogisticsRecoveryPackage,
  createNorthstarConnectedCarePackage,
  stampPackageChecksum,
} from "@projectsim/domain";
import {
  createInMemoryBusinessCaseRegistry,
  createInMemoryContentResolver,
} from "./in-memory-business-case-registry";

describe("InMemoryBusinessCaseRegistry", () => {
  it("installs both fixtures with package-scoped local IDs", () => {
    const registry = createInMemoryBusinessCaseRegistry();
    const northstar = registry.installFixture(
      createNorthstarConnectedCarePackage(),
    );
    const harbor = registry.installFixture(
      createHarborLogisticsRecoveryPackage(),
    );

    // Local IDs are package-scoped: both cases may reuse stakeholder.sponsor
    // even though Northstar Chapter One uses chapter-01 (Harbor keeps
    // chapter.orientation from the minimal fixture).
    expect(harbor.package.chapters[0]?.id).toBe("chapter.orientation");
    expect(northstar.package.chapters[0]?.id).toBe("chapter-01");
    expect(
      northstar.package.stakeholders.some(
        (s) => s.id === "stakeholder.sponsor",
      ),
    ).toBe(true);
    expect(
      harbor.package.stakeholders.some((s) => s.id === "stakeholder.sponsor"),
    ).toBe(true);
    expect(northstar.contentPackageVersionId).not.toBe(
      harbor.contentPackageVersionId,
    );
    expect(northstar.businessCaseId).not.toBe(harbor.businessCaseId);
  });

  it("never mixes versions in exact resolve or cache keys", async () => {
    const registry = createInMemoryBusinessCaseRegistry();
    const northstar = registry.installFixture(
      createNorthstarConnectedCarePackage(),
    );
    registry.installFixture(createHarborLogisticsRecoveryPackage());
    const resolver = createInMemoryContentResolver(registry);

    const exact = await resolver.resolveExactVersion({
      businessCaseId: northstar.businessCaseId,
      contentVersion: "1.0.0",
    });
    expect(exact?.businessCaseId).toBe("northstar-connected-care");
    expect(exact?.package.manifest.title.values["en-US"]).toContain(
      "Northstar",
    );

    const missing = await resolver.resolveExactVersion({
      businessCaseId: northstar.businessCaseId,
      contentVersion: "9.9.9",
    });
    expect(missing).toBeNull();
  });

  it("resolves retired versions for pinned runs but not as defaults", async () => {
    const registry = createInMemoryBusinessCaseRegistry();
    const retired = stampPackageChecksum({
      ...createHarborLogisticsRecoveryPackage(),
      manifest: {
        ...createHarborLogisticsRecoveryPackage().manifest,
        availability: "retired",
        checksum: "",
      },
    });
    const stored = registry.installFixture(retired);
    const resolver = createInMemoryContentResolver(registry);

    expect(
      await registry.resolveDefaultPublishedVersion(stored.businessCaseId),
    ).toBeNull();
    const pinned = await resolver.resolveForPinnedRun(
      stored.contentPackageVersionId,
    );
    expect(pinned?.contentPackageVersionId).toBe(
      stored.contentPackageVersionId,
    );
  });
});
