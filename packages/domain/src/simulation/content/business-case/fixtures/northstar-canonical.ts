/**
 * BC-006 Workstream 2 — Northstar canonical companion contracts.
 *
 * Coaching interventions and strict source-document traceability for the
 * complete Northstar package. Not authoritative run state.
 */

import type { ConditionExpression } from "../conditions";
import {
  listCanonicalContentReferences,
  type CanonicalContentContractSet,
  type CanonicalContentEntityKind,
  type CanonicalContentTraceabilityEntry,
  type CoachingInterventionDefinition,
  type ContentSourceReference,
} from "../canonical-contracts";
import { localizedText } from "../localized";
import type { BusinessCaseContentPackage } from "../package";
import { createNorthstarConnectedCarePackage } from "./northstar";

export const NORTHSTAR_ASSESSMENT_ID = "assessment.northstar";

const SOURCE_BY_KIND: Readonly<
  Record<CanonicalContentEntityKind, ContentSourceReference>
> = {
  chapter: {
    documentPath:
      "docs/business-cases/05-full-northstar-simulation/00_Full_Simulation_Blueprint.md",
    section: "4. Six-Chapter Structure",
    anchor: null,
  },
  stakeholder: {
    documentPath:
      "docs/business-cases/05-full-northstar-simulation/06_Stakeholder_Story_Arcs.md",
    section: "4. Core Stakeholder Roster",
    anchor: null,
  },
  message: {
    documentPath:
      "docs/business-cases/05-full-northstar-simulation/09_Inbox_Catalog.md",
    section: "Canonical Message Contract",
    anchor: null,
  },
  conversation: {
    documentPath:
      "docs/business-cases/05-full-northstar-simulation/09_Inbox_Catalog.md",
    section: "Canonical Message Contract",
    anchor: null,
  },
  meeting: {
    documentPath:
      "docs/business-cases/05-full-northstar-simulation/08_Meeting_Catalog.md",
    section: "Canonical Meeting Contract",
    anchor: null,
  },
  document: {
    documentPath:
      "docs/business-cases/05-full-northstar-simulation/10_Document_Catalog.md",
    section: "Canonical Document Contract",
    anchor: null,
  },
  notification: {
    documentPath:
      "docs/business-cases/05-full-northstar-simulation/00_Full_Simulation_Blueprint.md",
    section: "5. Learner Journey",
    anchor: null,
  },
  activity: {
    documentPath:
      "docs/business-cases/05-full-northstar-simulation/11_Activity_Catalog.md",
    section: "Canonical Activity Contract",
    anchor: null,
  },
  decision: {
    documentPath:
      "docs/business-cases/06-decision-system/01_Decision_Catalog.md",
    section: "Canonical Identifier Pattern",
    anchor: null,
  },
  decision_option: {
    documentPath:
      "docs/business-cases/06-decision-system/01_Decision_Catalog.md",
    section: "Canonical Identifier Pattern",
    anchor: null,
  },
  consequence: {
    documentPath:
      "docs/business-cases/06-decision-system/02_Consequence_Catalog.md",
    section: "3. Identifier Pattern",
    anchor: null,
  },
  crisis: {
    documentPath:
      "docs/business-cases/05-full-northstar-simulation/00_Full_Simulation_Blueprint.md",
    section: "4. Six-Chapter Structure",
    anchor: null,
  },
  assessment: {
    documentPath:
      "docs/business-cases/06-decision-system/04_Scoring_and_Assessment.md",
    section: "6. Core Competencies",
    anchor: null,
  },
  competency: {
    documentPath:
      "docs/business-cases/06-decision-system/04_Scoring_and_Assessment.md",
    section: "6. Core Competencies",
    anchor: null,
  },
  coaching_intervention: {
    documentPath:
      "docs/business-cases/08-learning-experience/02_Coaching_and_Feedback_Model.md",
    section: "Coaching roles and boundaries",
    anchor: null,
  },
  achievement: {
    documentPath:
      "docs/business-cases/08-learning-experience/05_Performance_and_Reflection.md",
    section: "Achievements and recognition",
    anchor: null,
  },
  outcome: {
    documentPath:
      "docs/business-cases/06-decision-system/03_Outcome_and_Ending_Model.md",
    section: "5. Final Ending Profiles",
    anchor: null,
  },
  asset: {
    documentPath:
      "docs/business-cases/03-content-schema-and-validation/00_Content_Schema_and_Validation.md",
    section: "Assets",
    anchor: null,
  },
};

const chapterSource = (chapterOrder: number): ContentSourceReference => {
  if (chapterOrder === 1) {
    return {
      documentPath:
        "docs/business-cases/02-flagship-business-case/01_Business_Case_Content_Bible.md",
      section: "Chapter One",
      anchor: null,
    };
  }
  const files: Record<number, string> = {
    2: "docs/business-cases/05-full-northstar-simulation/01_Chapter_Two.md",
    3: "docs/business-cases/05-full-northstar-simulation/02_Chapter_Three.md",
    4: "docs/business-cases/05-full-northstar-simulation/03_Chapter_Four.md",
    5: "docs/business-cases/05-full-northstar-simulation/04_Chapter_Five.md",
    6: "docs/business-cases/05-full-northstar-simulation/05_Chapter_Six.md",
  };
  return {
    documentPath: files[chapterOrder] ?? SOURCE_BY_KIND.chapter.documentPath,
    section: `Chapter ${chapterOrder}`,
    anchor: null,
  };
};

const buildCoachingInterventions = (
  pkg: BusinessCaseContentPackage,
): CoachingInterventionDefinition[] => {
  const interventions: CoachingInterventionDefinition[] = [];
  for (const chapter of pkg.chapters) {
    const firstDecision = pkg.decisions.find(
      (decision) => decision.chapterId === chapter.id,
    );
    const firstActivity = pkg.activities.find(
      (activity) => activity.chapterId === chapter.id,
    );
    const triggerWhen: ConditionExpression = {
      kind: "chapter_status",
      chapterId: chapter.id,
      status: "unlocked",
    };
    interventions.push({
      id: `coaching.${chapter.id}.orientation`,
      chapterId: chapter.id,
      interventionType: "orientation",
      triggerWhen,
      audience: ["explorer", "practitioner", "leader"],
      title: localizedText(
        `${chapter.title.values["en-US"] ?? chapter.id} orientation`,
      ),
      guidance: localizedText(
        "Review available evidence, complete required activities, and resolve chapter decisions with explicit trade-offs.",
      ),
      relatedDecisionIds: firstDecision ? [firstDecision.id] : [],
      relatedActivityIds: firstActivity ? [firstActivity.id] : [],
    });
    if (firstDecision) {
      interventions.push({
        id: `coaching.${chapter.id}.decision-hint`,
        chapterId: chapter.id,
        interventionType: "hint",
        triggerWhen: {
          kind: "decision_status",
          decisionId: firstDecision.id,
          status: "available",
        },
        audience: ["explorer"],
        title: localizedText("Evidence checklist before deciding"),
        guidance: localizedText(
          "Confirm required evidence tags are available and note which stakeholders are affected before submitting.",
        ),
        relatedDecisionIds: [firstDecision.id],
        relatedActivityIds: firstActivity ? [firstActivity.id] : [],
      });
      interventions.push({
        id: `coaching.${chapter.id}.reflection`,
        chapterId: chapter.id,
        interventionType: "reflection_prompt",
        triggerWhen: {
          kind: "decision_status",
          decisionId: firstDecision.id,
          status: "resolved",
        },
        audience: ["explorer", "practitioner", "leader"],
        title: localizedText("Chapter decision reflection"),
        guidance: localizedText(
          "Which evidence most influenced your choice, and what residual risk remains for later chapters?",
        ),
        relatedDecisionIds: [firstDecision.id],
        relatedActivityIds: [],
      });
    }
  }
  return interventions;
};

const buildStrictTraceability = (
  contractSet: Omit<CanonicalContentContractSet, "traceability">,
): CanonicalContentTraceabilityEntry[] => {
  const chapterOrderById = new Map(
    contractSet.package.chapters.map((chapter) => [chapter.id, chapter.order]),
  );
  const decisionChapter = new Map(
    contractSet.package.decisions.map((decision) => [
      decision.id,
      decision.chapterId,
    ]),
  );

  return listCanonicalContentReferences({
    ...contractSet,
    traceability: [],
  }).map((entity) => {
    let sources: ContentSourceReference[] = [SOURCE_BY_KIND[entity.kind]];
    if (entity.kind === "chapter") {
      const order = chapterOrderById.get(entity.id as never) ?? 1;
      sources = [chapterSource(order)];
    } else if (
      entity.kind === "decision" ||
      entity.kind === "decision_option" ||
      entity.kind === "consequence"
    ) {
      const decisionId =
        entity.kind === "decision"
          ? entity.id
          : entity.id.includes(".chapter-")
            ? `decision.northstar.${entity.id.split(".").slice(2, 4).join(".")}`
            : entity.id;
      const chapterId =
        decisionChapter.get(decisionId as never) ??
        decisionChapter.get(entity.id as never);
      if (chapterId) {
        const order = chapterOrderById.get(chapterId) ?? 1;
        sources = [chapterSource(order), SOURCE_BY_KIND[entity.kind]];
      }
    } else if (
      entity.kind === "message" ||
      entity.kind === "meeting" ||
      entity.kind === "document" ||
      entity.kind === "activity" ||
      entity.kind === "notification" ||
      entity.kind === "crisis"
    ) {
      const match = /chapter-0(\d)|c(\d)\./.exec(entity.id);
      const order = match
        ? Number(match[1] ?? match[2])
        : entity.id.includes("program-kickoff") ||
            entity.id.includes("authorization") ||
            entity.id.includes("sponsor-welcome")
          ? 1
          : undefined;
      if (order !== undefined) {
        sources = [chapterSource(order), SOURCE_BY_KIND[entity.kind]];
      }
    }
    return { entity, sources };
  });
};

export const createNorthstarCanonicalContractSet = (
  pkg: BusinessCaseContentPackage = createNorthstarConnectedCarePackage(),
): CanonicalContentContractSet => {
  const coachingInterventions = buildCoachingInterventions(pkg);
  const partial = {
    package: pkg,
    assessmentId: NORTHSTAR_ASSESSMENT_ID,
    coachingInterventions,
  };
  return {
    ...partial,
    traceability: buildStrictTraceability(partial),
  };
};

/** Convenience export used by tests that only need coaching definitions. */
export const createNorthstarCoachingInterventions = (
  pkg: BusinessCaseContentPackage = createNorthstarConnectedCarePackage(),
): readonly CoachingInterventionDefinition[] =>
  createNorthstarCanonicalContractSet(pkg).coachingInterventions;
