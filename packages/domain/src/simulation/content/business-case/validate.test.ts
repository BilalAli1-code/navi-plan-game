import { describe, expect, it } from "vitest";
import { asStakeholderId } from "../../../shared-kernel/ids";
import { createHarborLogisticsRecoveryPackage } from "./fixtures/harbor";
import { createNorthstarConnectedCarePackage } from "./fixtures/northstar";
import { stampPackageChecksum } from "./checksum";
import {
  isSelectableForNewRuns,
  validateBusinessCasePackage,
} from "./validate";

describe("BC-003 business-case validation", () => {
  it("validates the representative Northstar package", () => {
    const pkg = createNorthstarConnectedCarePackage();
    const result = validateBusinessCasePackage(pkg);
    expect(result.status).toBe("passed");
    expect(result.errors).toHaveLength(0);
    expect(isSelectableForNewRuns(pkg, result)).toBe(true);
  });

  it("validates the Harbor Logistics Recovery package", () => {
    const pkg = createHarborLogisticsRecoveryPackage();
    const result = validateBusinessCasePackage(pkg);
    expect(result.status).toBe("passed");
    expect(isSelectableForNewRuns(pkg, result)).toBe(true);
  });

  it("allows reused local IDs across different business cases", () => {
    const northstar = createNorthstarConnectedCarePackage();
    const harbor = createHarborLogisticsRecoveryPackage();
    // Harbor retains the BC-003 minimal IDs; Northstar Chapter One uses
    // chapter-01 / decision.define-objective. Shared stakeholder.sponsor
    // proves package-scoped identity across cases.
    expect(harbor.chapters[0]?.id).toBe("chapter.orientation");
    expect(harbor.decisions[0]?.id).toBe("decision.delivery-approach");
    expect(northstar.chapters[0]?.id).toBe("chapter-01");
    expect(
      northstar.stakeholders.some((s) => s.id === "stakeholder.sponsor"),
    ).toBe(true);
    expect(
      harbor.stakeholders.some((s) => s.id === "stakeholder.sponsor"),
    ).toBe(true);
    expect(northstar.manifest.businessCaseId).not.toBe(
      harbor.manifest.businessCaseId,
    );
    expect(validateBusinessCasePackage(northstar).status).toBe("passed");
    expect(validateBusinessCasePackage(harbor).status).toBe("passed");
  });

  it("fails invalid semantic versions", () => {
    const pkg = createHarborLogisticsRecoveryPackage();
    const invalid = {
      ...pkg,
      manifest: {
        ...pkg.manifest,
        contentVersion: "v1",
        publicationStatus: "draft" as const,
        checksum: "",
      },
    };
    const result = validateBusinessCasePackage(invalid);
    expect(result.status).toBe("failed");
    expect(result.errors.some((e) => e.code === "INVALID_SEMVER")).toBe(true);
  });

  it("fails duplicate local IDs within one case version", () => {
    const pkg = createHarborLogisticsRecoveryPackage();
    const dup = {
      ...pkg,
      stakeholders: [
        ...pkg.stakeholders,
        {
          ...pkg.stakeholders[0]!,
          id: pkg.stakeholders[0]!.id,
          displayName: pkg.stakeholders[0]!.displayName,
        },
      ],
      manifest: {
        ...pkg.manifest,
        publicationStatus: "draft" as const,
        checksum: "",
      },
    };
    const result = validateBusinessCasePackage(dup);
    expect(result.status).toBe("failed");
    expect(result.errors.some((e) => e.code === "DUPLICATE_LOCAL_ID")).toBe(
      true,
    );
  });

  it("fails missing stakeholder references", () => {
    const pkg = createHarborLogisticsRecoveryPackage();
    const broken = {
      ...pkg,
      messages: [
        {
          ...pkg.messages[0]!,
          senderStakeholderId: asStakeholderId("stakeholder.missing"),
        },
      ],
      manifest: {
        ...pkg.manifest,
        publicationStatus: "draft" as const,
        checksum: "",
      },
    };
    const result = validateBusinessCasePackage(broken);
    expect(result.status).toBe("failed");
    expect(result.errors.some((e) => e.code === "MISSING_REFERENCE")).toBe(
      true,
    );
  });

  it("fails missing evidence tags required for eligibility", () => {
    const pkg = createHarborLogisticsRecoveryPackage();
    const broken = {
      ...pkg,
      documents: pkg.documents.map((doc) => ({
        ...doc,
        evidenceTags: [],
      })),
      manifest: {
        ...pkg.manifest,
        publicationStatus: "draft" as const,
        checksum: "",
      },
    };
    const result = validateBusinessCasePackage(broken);
    expect(result.status).toBe("failed");
    expect(
      result.errors.some((e) => e.code === "MISSING_EVIDENCE_REFERENCE"),
    ).toBe(true);
  });

  it("fails circular chapter unlock dependencies", () => {
    const pkg = createHarborLogisticsRecoveryPackage();
    const chapterA = pkg.chapters[0]!;
    const chapterB = pkg.chapters[1]!;
    const cyclic = {
      ...pkg,
      chapters: [
        {
          ...chapterA,
          unlockWhen: {
            kind: "chapter_status" as const,
            chapterId: chapterB.id,
            status: "completed",
          },
          initialUnlock: false,
        },
        {
          ...chapterB,
          unlockWhen: {
            kind: "chapter_status" as const,
            chapterId: chapterA.id,
            status: "completed",
          },
          initialUnlock: false,
        },
      ],
      manifest: {
        ...pkg.manifest,
        publicationStatus: "draft" as const,
        checksum: "",
      },
    };
    const result = validateBusinessCasePackage(cyclic);
    expect(result.status).toBe("failed");
    expect(result.errors.some((e) => e.code === "CIRCULAR_DEPENDENCY")).toBe(
      true,
    );
  });

  it("fails missing default localized text", () => {
    const pkg = createHarborLogisticsRecoveryPackage();
    const broken = {
      ...pkg,
      manifest: {
        ...pkg.manifest,
        title: { values: {} },
        publicationStatus: "draft" as const,
        checksum: "",
      },
    };
    const result = validateBusinessCasePackage(broken);
    expect(result.status).toBe("failed");
    expect(result.errors.some((e) => e.code === "MISSING_LOCALIZED_TEXT")).toBe(
      true,
    );
  });

  it("fails published packages with checksum mismatch", () => {
    const pkg = createHarborLogisticsRecoveryPackage();
    const broken = {
      ...pkg,
      manifest: {
        ...pkg.manifest,
        checksum: "fnv1a64:v1:deadbeefdeadbeef",
      },
    };
    const result = validateBusinessCasePackage(broken);
    expect(result.status).toBe("failed");
    expect(result.errors.some((e) => e.code === "CHECKSUM_MISMATCH")).toBe(
      true,
    );
  });

  it("excludes draft packages from new-run selection", () => {
    const published = createHarborLogisticsRecoveryPackage();
    const draft = stampPackageChecksum({
      ...published,
      manifest: {
        ...published.manifest,
        publicationStatus: "draft",
        checksum: "",
      },
    });
    const result = validateBusinessCasePackage(draft);
    expect(result.status).toBe("passed");
    expect(isSelectableForNewRuns(draft, result)).toBe(false);
  });

  it("excludes retired packages from new-run selection", () => {
    const published = createHarborLogisticsRecoveryPackage();
    const retired = stampPackageChecksum({
      ...published,
      manifest: {
        ...published.manifest,
        availability: "retired",
        checksum: "",
      },
    });
    const result = validateBusinessCasePackage(retired);
    expect(isSelectableForNewRuns(retired, result)).toBe(false);
  });
});
