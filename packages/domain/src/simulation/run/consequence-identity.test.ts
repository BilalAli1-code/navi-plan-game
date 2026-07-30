import { describe, expect, it } from "vitest";
import {
  asConsequenceId,
  deriveDocumentIdFromConsequence,
  deriveNotificationIdFromConsequence,
} from "../../index";

describe("consequence-derived identities", () => {
  it("derives stable Document ids from Consequence ids", () => {
    expect(
      deriveDocumentIdFromConsequence(asConsequenceId("consequence_123")),
    ).toBe("document:consequence:consequence_123");
  });

  it("derives stable Notification ids from Consequence ids", () => {
    expect(
      deriveNotificationIdFromConsequence(asConsequenceId("consequence_123")),
    ).toBe("notification:consequence:consequence_123");
  });
});
