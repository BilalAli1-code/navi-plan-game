/**
 * Northstar Connected Care package (BC-004 Chapter One + BC-006 Chapters 2–6).
 *
 * Assembles the complete declarative content package. Runtime decision
 * submission, delayed consequence scheduling, crisis engines, coaching AI,
 * and ending calculation remain outside this module (Workstreams 3–4).
 */

import { asBusinessCaseId } from "../../../../shared-kernel/ids";
import { stampPackageChecksum } from "../checksum";
import {
  BUSINESS_CASE_CONTENT_SCHEMA_VERSION,
  CURRENT_RUNTIME_COMPATIBILITY,
} from "../enums";
import { asPmbokAlignmentTag } from "../ids";
import { localizedText } from "../localized";
import type { BusinessCaseContentPackage } from "../package";
import { buildNorthstarChapterFiveEntities } from "./northstar-chapter-five";
import { buildNorthstarChapterFourEntities } from "./northstar-chapter-four";
import { buildNorthstarChapterOneEntities } from "./northstar-chapter-one";
import { buildNorthstarChapterSixEntities } from "./northstar-chapter-six";
import { buildNorthstarChapterThreeEntities } from "./northstar-chapter-three";
import { buildNorthstarChapterTwoEntities } from "./northstar-chapter-two";
import {
  createNorthstarAchievements,
  createNorthstarAssessment,
  createNorthstarOutcomes,
} from "./northstar-shared";
import { enrichNorthstarStakeholders } from "./northstar-stakeholders";

export const NORTHSTAR_BUSINESS_CASE_ID = asBusinessCaseId(
  "northstar-connected-care",
);
export const NORTHSTAR_CONTENT_VERSION = "1.0.0";

export const createNorthstarConnectedCarePackage =
  (): BusinessCaseContentPackage => {
    const chapterOne = buildNorthstarChapterOneEntities();
    const chapterTwo = buildNorthstarChapterTwoEntities();
    const chapterThree = buildNorthstarChapterThreeEntities();
    const chapterFour = buildNorthstarChapterFourEntities();
    const chapterFive = buildNorthstarChapterFiveEntities();
    const chapterSix = buildNorthstarChapterSixEntities();

    const laterChapters = [
      chapterTwo,
      chapterThree,
      chapterFour,
      chapterFive,
      chapterSix,
    ];

    const pkg: BusinessCaseContentPackage = {
      schemaVersion: BUSINESS_CASE_CONTENT_SCHEMA_VERSION,
      runtimeCompatibility: CURRENT_RUNTIME_COMPATIBILITY,
      manifest: {
        businessCaseId: NORTHSTAR_BUSINESS_CASE_ID,
        contentVersion: NORTHSTAR_CONTENT_VERSION,
        publicationStatus: "published",
        availability: "available",
        defaultLocale: "en-US",
        supportedLocales: ["en-US"],
        title: localizedText("Northstar Connected Care Transformation"),
        shortTitle: localizedText("Northstar Connected Care"),
        summary: localizedText(
          "Lead a nine-month, $4.8 million transformation to improve patient access across a 12-clinic community health network. Evaluate evidence, align competing stakeholders, tailor delivery, manage vendor and integration risk, respond to crisis, and guide the program toward a defensible outcome.",
        ),
        industry: localizedText("Healthcare services"),
        organizationType: localizedText(
          "Mid-sized nonprofit community health network",
        ),
        projectType: localizedText(
          "Enterprise digital transformation and service-access improvement",
        ),
        estimatedMinutes: 600,
        learningDays: 10,
        chapterCount: 6,
        difficulty: "adaptive",
        supportedExperienceLevels: ["explorer", "practitioner", "leader"],
        learningFocus: [
          localizedText("Value delivery"),
          localizedText("Stakeholder engagement"),
          localizedText("Hybrid delivery tailoring"),
          localizedText("Scope and prioritization"),
          localizedText("Governance and escalation"),
          localizedText("Risk and uncertainty"),
          localizedText("Privacy, quality, and professional accountability"),
          localizedText("Crisis response and project recovery"),
        ],
        pmbokAlignment: [
          asPmbokAlignmentTag("value-and-outcomes"),
          asPmbokAlignmentTag("stakeholder-engagement"),
          asPmbokAlignmentTag("tailoring-and-adaptability"),
          asPmbokAlignmentTag("governance-and-accountability"),
          asPmbokAlignmentTag("uncertainty-and-risk"),
          asPmbokAlignmentTag("planning-and-delivery"),
        ],
        learnerRole: localizedText(
          "Project Manager, Enterprise Transformation",
        ),
        prerequisites: [
          localizedText("Basic project management familiarity"),
          localizedText("Willingness to decide under incomplete evidence"),
        ],
        thumbnailAssetId: null,
        heroAssetId: null,
        accessibilitySummary: localizedText(
          "Keyboard-navigable Workplace with text alternatives for key Connected Care documents and decisions.",
        ),
        runtimeCompatibility: CURRENT_RUNTIME_COMPATIBILITY,
        schemaVersion: BUSINESS_CASE_CONTENT_SCHEMA_VERSION,
        checksum: "",
      },
      chapters: [
        chapterOne.chapter,
        ...laterChapters.map((chapter) => chapter.chapter),
      ],
      stakeholders: enrichNorthstarStakeholders(chapterOne.stakeholders),
      conversations: [],
      messages: [
        ...chapterOne.messages,
        ...laterChapters.flatMap((chapter) => chapter.messages),
      ],
      meetings: [
        ...chapterOne.meetings,
        ...laterChapters.flatMap((chapter) => chapter.meetings),
      ],
      documents: [
        ...chapterOne.documents,
        ...laterChapters.flatMap((chapter) => chapter.documents),
      ],
      notifications: [
        ...chapterOne.notifications,
        ...laterChapters.flatMap((chapter) => chapter.notifications),
      ],
      activities: [
        ...chapterOne.activities,
        ...laterChapters.flatMap((chapter) => chapter.activities),
      ],
      decisions: [
        ...chapterOne.decisions,
        ...laterChapters.flatMap((chapter) => chapter.decisions),
      ],
      consequences: [
        ...chapterOne.consequences,
        ...laterChapters.flatMap((chapter) => chapter.consequences),
      ],
      crises: laterChapters.flatMap((chapter) => chapter.crises),
      assessment: createNorthstarAssessment(chapterOne.assessment),
      achievements: createNorthstarAchievements(chapterOne.achievements),
      outcomes: createNorthstarOutcomes(chapterOne.outcomes),
      assets: [],
    };

    return stampPackageChecksum(pkg);
  };
