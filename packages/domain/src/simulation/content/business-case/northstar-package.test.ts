/**
 * BC-006 Workstream 2 — complete Northstar content package tests.
 */

import { describe, expect, it } from "vitest";
import {
  classifyInboxMessage,
  validateCanonicalContentContractSet,
} from "./canonical-contracts";
import { createHarborLogisticsRecoveryPackage } from "./fixtures/harbor";
import { createNorthstarCanonicalContractSet } from "./fixtures/northstar-canonical";
import { createNorthstarConnectedCarePackage } from "./fixtures/northstar";
import {
  isSelectableForNewRuns,
  validateBusinessCasePackage,
} from "./validate";

const PLACEHOLDER_PATTERNS = [
  /Placeholder for Chapter/i,
  /chapter-placeholder/i,
  /later BC work/i,
  /\bTODO\b/,
  /\bFIXME\b/,
];

describe("BC-006 Northstar complete content package", () => {
  const pkg = createNorthstarConnectedCarePackage();
  const harbor = createHarborLogisticsRecoveryPackage();
  const validation = validateBusinessCasePackage(pkg);
  const harborValidation = validateBusinessCasePackage(harbor);
  const contractSet = createNorthstarCanonicalContractSet(pkg);
  const strictValidation = validateCanonicalContentContractSet(contractSet, {
    requireTraceabilityCoverage: true,
  });

  it("contains exactly six ordered chapters with only Chapter One initially unlocked", () => {
    expect(pkg.chapters).toHaveLength(6);
    expect(pkg.manifest.chapterCount).toBe(6);
    const orders = pkg.chapters.map((chapter) => chapter.order).sort();
    expect(orders).toEqual([1, 2, 3, 4, 5, 6]);
    expect(new Set(orders).size).toBe(6);
    expect(
      pkg.chapters.filter((chapter) => chapter.initialUnlock),
    ).toHaveLength(1);
    expect(pkg.chapters.find((chapter) => chapter.initialUnlock)?.id).toBe(
      "chapter-01",
    );
    for (const chapter of pkg.chapters.filter((item) => item.order > 1)) {
      expect(chapter.initialUnlock).toBe(false);
      expect(chapter.unlockWhen?.kind).toBe("chapter_status");
    }
  });

  it("removes Chapters 2–6 placeholders and placeholder text", () => {
    const serialized = JSON.stringify(pkg);
    for (const pattern of PLACEHOLDER_PATTERNS) {
      expect(serialized).not.toMatch(pattern);
    }
    for (const chapter of pkg.chapters.filter((item) => item.order > 1)) {
      expect(chapter.requiredActivityIds.length).toBeGreaterThan(0);
      expect(chapter.requiredDecisionIds.length).toBeGreaterThan(0);
      expect(chapter.completionWhen.kind).not.toBe("always");
      expect(chapter.title.values["en-US"]).not.toMatch(/placeholder/i);
      expect(chapter.summary.values["en-US"]).not.toMatch(/placeholder/i);
    }
  });

  it("requires every chapter required activity and decision to exist", () => {
    const activityIds = new Set(pkg.activities.map((item) => item.id));
    const decisionIds = new Set(pkg.decisions.map((item) => item.id));
    for (const chapter of pkg.chapters) {
      for (const activityId of chapter.requiredActivityIds) {
        expect(activityIds.has(activityId)).toBe(true);
      }
      for (const decisionId of chapter.requiredDecisionIds) {
        expect(decisionIds.has(decisionId)).toBe(true);
      }
    }
  });

  it("keeps Chapter One decision identity intact", () => {
    expect(
      pkg.decisions.some(
        (decision) => decision.id === "decision.define-objective",
      ),
    ).toBe(true);
    expect(
      pkg.decisions.some(
        (decision) => decision.id === "decision.select-delivery-approach",
      ),
    ).toBe(true);
    expect(
      pkg.decisions.some(
        (decision) => decision.id === "decision.establish-governance",
      ),
    ).toBe(true);
    expect(pkg.chapters[0]?.title.values["en-US"]).toBe("The Access Problem");
  });

  it("resolves stakeholder relationships and chapter behaviors", () => {
    const stakeholderIds = new Set(pkg.stakeholders.map((item) => item.id));
    const chapterIds = new Set(pkg.chapters.map((item) => item.id));
    for (const stakeholder of pkg.stakeholders) {
      for (const relationship of stakeholder.relationships) {
        expect(stakeholderIds.has(relationship.otherStakeholderId)).toBe(true);
      }
      for (const behavior of stakeholder.chapterBehavior) {
        expect(chapterIds.has(behavior.chapterId)).toBe(true);
      }
    }
  });

  it("resolves meeting, message, document, and activity cross-references", () => {
    const stakeholderIds = new Set(pkg.stakeholders.map((item) => item.id));
    const decisionIds = new Set(pkg.decisions.map((item) => item.id));
    const documentIds = new Set(pkg.documents.map((item) => item.id));
    const meetingIds = new Set(pkg.meetings.map((item) => item.id));

    for (const meeting of pkg.meetings) {
      for (const participant of meeting.participantStakeholderIds) {
        expect(stakeholderIds.has(participant)).toBe(true);
      }
      for (const decisionId of meeting.relatedDecisionIds) {
        expect(decisionIds.has(decisionId)).toBe(true);
      }
      for (const documentId of meeting.relatedDocumentIds) {
        expect(documentIds.has(documentId)).toBe(true);
      }
    }

    for (const message of pkg.messages) {
      if (message.senderStakeholderId) {
        expect(stakeholderIds.has(message.senderStakeholderId)).toBe(true);
      }
      if (message.relatedDecisionId) {
        expect(decisionIds.has(message.relatedDecisionId)).toBe(true);
      }
      if (message.relatedMeetingId) {
        expect(meetingIds.has(message.relatedMeetingId)).toBe(true);
      }
      for (const documentId of message.relatedDocumentIds) {
        expect(documentIds.has(documentId)).toBe(true);
      }
    }

    for (const document of pkg.documents) {
      for (const decisionId of document.supportsDecisionIds) {
        expect(decisionIds.has(decisionId)).toBe(true);
      }
    }

    for (const activity of pkg.activities) {
      for (const documentId of activity.relatedDocumentIds) {
        expect(documentIds.has(documentId)).toBe(true);
      }
      for (const decisionId of activity.relatedDecisionIds) {
        expect(decisionIds.has(decisionId)).toBe(true);
      }
    }
  });

  it("resolves evidence requirements, consequences, rubrics, and crises", () => {
    const evidenceTags = new Set(
      pkg.documents.flatMap((document) => document.evidenceTags),
    );
    const consequenceIds = new Set(pkg.consequences.map((item) => item.id));
    const competencyIds = new Set(
      pkg.assessment.competencies.map((item) => item.id),
    );
    const decisionIds = new Set(pkg.decisions.map((item) => item.id));
    const stakeholderIds = new Set(pkg.stakeholders.map((item) => item.id));

    for (const decision of pkg.decisions) {
      for (const requirement of decision.requiredEvidence) {
        expect(evidenceTags.has(requirement.evidenceTag)).toBe(true);
      }
      for (const option of decision.options) {
        const mapped = decision.consequenceIdsByOption[option.id] ?? [];
        expect(mapped.length).toBeGreaterThan(0);
        for (const consequenceId of mapped) {
          expect(consequenceIds.has(consequenceId)).toBe(true);
        }
      }
      for (const competencyId of Object.keys(
        decision.rubric.competencyWeights,
      )) {
        expect(competencyIds.has(competencyId as never)).toBe(true);
      }
    }

    for (const consequence of pkg.consequences) {
      if (consequence.sourceDecisionId) {
        expect(decisionIds.has(consequence.sourceDecisionId)).toBe(true);
      }
      for (const effect of consequence.effects) {
        if (effect.kind === "change_stakeholder_signal") {
          expect(stakeholderIds.has(effect.stakeholderId)).toBe(true);
        }
        if (
          effect.kind === "emit_competency_signal" ||
          effect.kind === "emit_assessment_signal"
        ) {
          expect(competencyIds.has(effect.competencyId)).toBe(true);
        }
      }
    }

    for (const crisis of pkg.crises) {
      for (const decisionId of crisis.relatedDecisionIds) {
        expect(decisionIds.has(decisionId)).toBe(true);
      }
      for (const stakeholderId of crisis.relatedStakeholderIds) {
        expect(stakeholderIds.has(stakeholderId)).toBe(true);
      }
    }
  });

  it("keeps outcome and achievement IDs unique", () => {
    expect(new Set(pkg.outcomes.map((item) => item.id)).size).toBe(
      pkg.outcomes.length,
    );
    expect(new Set(pkg.achievements.map((item) => item.id)).size).toBe(
      pkg.achievements.length,
    );
  });

  it("classifies inbox messages without treating informational items as decisions", () => {
    for (const message of pkg.messages) {
      const classification = classifyInboxMessage(message);
      if (message.informationalOnly) {
        expect(classification).toBe("informational");
        expect(message.requiresResponse).toBe(false);
      }
      if (classification === "decision_bearing") {
        expect(message.requiresResponse).toBe(true);
        expect(message.relatedDecisionId).not.toBeNull();
        expect(message.informationalOnly).toBe(false);
      }
      if (classification === "action_required") {
        expect(message.requiresResponse).toBe(true);
        expect(message.relatedDecisionId).toBeNull();
      }
    }
    const kickoffReminder = pkg.messages.find(
      (message) => message.id === "message.info-kickoff-reminder",
    );
    expect(kickoffReminder).toBeDefined();
    expect(classifyInboxMessage(kickoffReminder!)).toBe("informational");
  });

  it("validates coaching uniqueness, targets, and experience levels", () => {
    const coachingIds = contractSet.coachingInterventions.map(
      (item) => item.id,
    );
    expect(new Set(coachingIds).size).toBe(coachingIds.length);
    const chapterIds = new Set(pkg.chapters.map((item) => item.id));
    const decisionIds = new Set(pkg.decisions.map((item) => item.id));
    const activityIds = new Set(pkg.activities.map((item) => item.id));
    for (const coaching of contractSet.coachingInterventions) {
      expect(coaching.audience.length).toBeGreaterThan(0);
      for (const level of coaching.audience) {
        expect(["explorer", "practitioner", "leader"]).toContain(level);
      }
      if (coaching.chapterId) {
        expect(chapterIds.has(coaching.chapterId as never)).toBe(true);
      }
      for (const decisionId of coaching.relatedDecisionIds) {
        expect(decisionIds.has(decisionId as never)).toBe(true);
      }
      for (const activityId of coaching.relatedActivityIds) {
        expect(activityIds.has(activityId as never)).toBe(true);
      }
    }
  });

  it("passes strict source traceability with full canonical coverage", () => {
    expect(strictValidation.status).toBe("passed");
    expect(strictValidation.errors).toHaveLength(0);
    expect(contractSet.traceability.length).toBeGreaterThan(0);
  });

  it("is deterministic across repeated construction", () => {
    const first = createNorthstarConnectedCarePackage();
    const second = createNorthstarConnectedCarePackage();
    expect(first.manifest.checksum).toBe(second.manifest.checksum);
    expect(first.manifest.checksum.length).toBeGreaterThan(0);
  });

  it("passes BC-003 validation and remains selectable while Harbor stays isolated", () => {
    expect(validation.status).toBe("passed");
    expect(validation.errors).toHaveLength(0);
    expect(isSelectableForNewRuns(pkg, validation)).toBe(true);
    expect(harborValidation.status).toBe("passed");
    expect(isSelectableForNewRuns(harbor, harborValidation)).toBe(true);
    expect(harbor.manifest.businessCaseId).not.toBe(
      pkg.manifest.businessCaseId,
    );
    expect(harbor.chapters[0]?.id).toBe("chapter.orientation");
  });

  it("keeps package-scoped IDs unique within Northstar", () => {
    const localIds = [
      ...pkg.chapters.map((item) => item.id),
      ...pkg.stakeholders.map((item) => item.id),
      ...pkg.messages.map((item) => item.id),
      ...pkg.meetings.map((item) => item.id),
      ...pkg.documents.map((item) => item.id),
      ...pkg.notifications.map((item) => item.id),
      ...pkg.activities.map((item) => item.id),
      ...pkg.decisions.map((item) => item.id),
      ...pkg.decisions.flatMap((decision) =>
        decision.options.map((option) => option.id),
      ),
      ...pkg.consequences.map((item) => item.id),
      ...pkg.crises.map((item) => item.id),
      ...pkg.achievements.map((item) => item.id),
      ...pkg.outcomes.map((item) => item.id),
    ];
    expect(new Set(localIds).size).toBe(localIds.length);
  });

  it("embeds no executable content or environment-dependent values", () => {
    const serialized = JSON.stringify(pkg);
    expect(serialized).not.toMatch(/\beval\(/);
    expect(serialized).not.toMatch(/\bFunction\(/);
    expect(serialized).not.toMatch(/\bprocess\.env\b/);
    expect(serialized).not.toMatch(/\bDate\.now\b/);
    expect(serialized).not.toMatch(/\bMath\.random\b/);
    expect(serialized).not.toMatch(/\bSELECT\s+\*\s+FROM\b/i);
    expect(serialized).not.toMatch(/-----BEGIN [A-Z ]+PRIVATE KEY-----/);
  });

  it("reports expected Northstar catalog scale", () => {
    expect(pkg.meetings).toHaveLength(32);
    expect(pkg.messages).toHaveLength(62);
    expect(pkg.documents).toHaveLength(92);
    expect(pkg.activities).toHaveLength(72);
    expect(pkg.decisions).toHaveLength(37);
    expect(pkg.crises.length).toBeGreaterThanOrEqual(2);
    expect(pkg.stakeholders.length).toBeGreaterThanOrEqual(20);
    expect(contractSet.coachingInterventions.length).toBeGreaterThanOrEqual(12);
    expect(pkg.achievements.length).toBeGreaterThanOrEqual(8);
    expect(pkg.outcomes.length).toBeGreaterThanOrEqual(10);
  });
});
