# ProjectSim Business Case Content Schema and Validation

**Document ID:** BC-003  
**Version:** 0.1 Draft  
**Status:** In review  
**Primary implementation tool:** Cursor  
**Source of truth:** GitHub  
**Related issue:** #72  
**Governing design:** BC-001 Version 1.1  
**Initial authored case:** `northstar-connected-care` Version `1.0.0`

---

## 1. Purpose

This document defines the canonical, reusable content contract for ProjectSim business cases.

The contract allows ProjectSim to:

- display a catalog of multiple business cases;
- let a learner select one business case and one experience level;
- create a Simulation Run pinned to one exact published content version;
- load case-specific chapters, stakeholders, messages, meetings, documents, activities, decisions, consequences, crises, assessments, and outcomes;
- validate authored content before publication;
- prevent cross-case and cross-version content leakage;
- add future business cases without hardcoding case logic into React components or shared runtime services.

BC-003 converts the educational and narrative content defined by BC-001 and BC-002 into a safe, versioned, testable application contract.

---

## 2. Existing Architecture Alignment

BC-003 extends the approved ProjectSim architecture.

The existing architecture already defines:

- `content.business_cases`;
- `content.content_packages`;
- `content.content_package_versions`;
- `content.content_assets`;
- `content.content_validation_results`;
- `content.content_publications`;
- immutable published content versions;
- checksums for accidental-modification detection;
- exact content-version references from Simulation Runs;
- a `ContentResolver` that loads a published version;
- layered schema, reference, completion-rule, decision, consequence, stakeholder, learning-objective, asset, and runtime-compatibility validation;
- `businessCaseId` and `contentPackageVersionId` on the authoritative `SimulationRun` aggregate.

BC-003 must preserve these boundaries.

BC-003 must not:

- introduce a second competing content runtime;
- embed case-specific business logic in shared command handlers;
- allow published content to execute arbitrary code;
- allow authored content to access persistence directly;
- replace authoritative Simulation Run state with content state;
- make UI components responsible for content validation or consequence calculation.

---

## 3. Architectural Ownership

### 3.1 Domain

`packages/domain/src/simulation/content/` owns:

- content-domain types;
- stable content identifiers;
- allowed declarative condition types;
- allowed declarative consequence-effect types;
- business invariants that do not depend on storage or a validation library;
- runtime-safe validated content definitions consumed by the Simulation Run.

The Domain package must not depend on:

- React;
- Supabase-generated types;
- PostgreSQL clients;
- file-system loaders;
- HTTP;
- a specific JSON-schema validation engine.

### 3.2 Application

`packages/application/src/content/` owns:

- catalog query use cases;
- exact-version resolution use cases;
- content publication orchestration;
- content validation orchestration;
- content registry and resolver ports;
- run-creation preconditions;
- mapping validated content into authoritative simulation commands.

### 3.3 Infrastructure

`packages/infrastructure/src/content/` owns:

- JSON Schema validation implementation;
- reference-graph validation implementation;
- PostgreSQL content repositories;
- file-system or bundled-content development adapters;
- checksum creation and verification;
- content registry implementation;
- published-version cache implementation;
- validation-result persistence.

### 3.4 API

`apps/api/src/content/` owns:

- learner catalog endpoints;
- case-detail endpoints;
- administrator validation and publication endpoints;
- exact-version resolution at run creation;
- API response mapping.

### 3.5 Web

`apps/web/` may:

- render catalog data;
- render case details;
- collect business-case and experience-level selection;
- render validated content projections.

`apps/web/` may not:

- import raw authored case files directly;
- decide publication eligibility;
- resolve cross-references;
- calculate authoritative consequences;
- inject Northstar-specific logic into shared components.

---

## 4. Canonical Identity Model

### 4.1 Business Case ID

A business case has one stable, globally unique public identifier.

Example:

```text
northstar-connected-care
```

Rules:

- lowercase ASCII;
- kebab-case;
- 3 to 80 characters;
- begins with a letter;
- never reused for another case;
- never changes after the first published version;
- independent of display title;
- unique across all tenants and installed content.

### 4.2 Content Version

A published content version uses semantic versioning:

```text
MAJOR.MINOR.PATCH
```

Examples:

```text
1.0.0
1.1.0
2.0.0
```

Rules:

- no `v` prefix;
- no mutable aliases inside a Simulation Run;
- a run stores the exact version selected at creation;
- corrections to published content create a new version;
- a new version may coexist with prior versions;
- existing runs continue using their pinned version unless an explicit migration capability is designed later.

### 4.3 Internal Version ID

`ContentPackageVersionId` remains the internal immutable identifier for one stored package version.

The authoritative mapping is:

```text
business_case_id + content_version -> content_package_version_id
```

The pair `(business_case_id, content_version)` must be unique.

### 4.4 Entity IDs

Every authored entity has a stable string ID scoped to one business case version.

Examples:

```text
chapter.orientation
stakeholder.executive-sponsor
message.sponsor-welcome
meeting.project-kickoff
document.project-charter
activity.review-project-charter
decision.delivery-approach
consequence.hybrid-approach-selected
outcome.transformational-leader
```

Rules:

- IDs are semantic, not positional;
- do not use array indexes as identities;
- do not rename an ID merely because display copy changes;
- IDs are unique within their entity collection;
- references resolve only inside the same business-case version;
- a reference may not point into another business case or version;
- retired IDs remain reserved within the same business case lineage.

---

## 5. Business Case Lifecycle

Canonical lifecycle states:

```text
draft -> validating -> validated -> in_review -> approved -> published -> retired
```

### 5.1 Draft

- editable;
- not visible in the learner catalog;
- may fail validation;
- may use incomplete content.

### 5.2 Validating

- temporarily locked for one validation execution;
- produces structured validation results;
- cannot publish while validation is running.

### 5.3 Validated

- passed all required validation layers;
- not yet selectable by learners;
- may return to draft if changed.

Any content change invalidates the prior validation result.

### 5.4 In review

- awaiting GitHub and product/content approval;
- immutable during one review revision;
- changes require a new review revision.

### 5.5 Approved

- approved for publication;
- checksum finalized;
- still not selectable until publication completes.

### 5.6 Published

- immutable;
- eligible for installation and learner selection according to availability rules;
- may be cached aggressively;
- cannot be changed in place.

### 5.7 Retired

- unavailable for new runs;
- still resolvable for existing pinned runs;
- retained for audit, replay, support, and historical reporting.

---

## 6. Catalog Availability Model

A published case version has an availability value:

```ts
type CaseAvailability =
  | "available"
  | "coming_soon"
  | "restricted"
  | "retired";
```

Rules:

- `available`: selectable for a new run;
- `coming_soon`: visible but not selectable;
- `restricted`: selectable only when authorization allows it;
- `retired`: not selectable for new runs but resolvable for existing runs;
- `draft`, `validated`, `in_review`, and `approved` versions never appear as selectable learner content;
- only one version may be marked as the default new-run version for a business case;
- multiple published versions may remain installed simultaneously.

---

## 7. Top-Level Content Package

The canonical runtime package is conceptually:

```ts
interface BusinessCaseContentPackage {
  readonly schemaVersion: number;
  readonly runtimeCompatibility: string;
  readonly manifest: BusinessCaseManifest;
  readonly chapters: readonly ChapterDefinition[];
  readonly stakeholders: readonly StakeholderDefinition[];
  readonly messages: readonly MessageDefinition[];
  readonly meetings: readonly MeetingDefinition[];
  readonly documents: readonly DocumentDefinition[];
  readonly notifications: readonly NotificationDefinition[];
  readonly activities: readonly ActivityDefinition[];
  readonly decisions: readonly DecisionDefinition[];
  readonly consequences: readonly ConsequenceDefinition[];
  readonly crises: readonly CrisisDefinition[];
  readonly assessment: AssessmentDefinition;
  readonly achievements: readonly AchievementDefinition[];
  readonly outcomes: readonly OutcomeDefinition[];
  readonly assets: readonly AssetReference[];
}
```

The top-level package is declarative data only.

It may not contain:

- executable JavaScript;
- SQL;
- arbitrary expressions evaluated with `eval`;
- network locations fetched at runtime without asset validation;
- persistence credentials;
- tenant-specific secrets;
- React components;
- functions serialized as strings.

---

## 8. Business Case Manifest

```ts
interface BusinessCaseManifest {
  readonly businessCaseId: BusinessCaseId;
  readonly contentVersion: string;
  readonly publicationStatus: "draft" | "published" | "retired";
  readonly availability: CaseAvailability;
  readonly defaultLocale: LocaleCode;
  readonly supportedLocales: readonly LocaleCode[];
  readonly title: LocalizedText;
  readonly shortTitle: LocalizedText;
  readonly summary: LocalizedText;
  readonly industry: LocalizedText;
  readonly organizationType: LocalizedText;
  readonly projectType: LocalizedText;
  readonly estimatedMinutes: number;
  readonly learningDays: number;
  readonly chapterCount: number;
  readonly difficulty: "introductory" | "intermediate" | "advanced" | "adaptive";
  readonly supportedExperienceLevels: readonly ExperienceLevel[];
  readonly learningFocus: readonly LocalizedText[];
  readonly pmbokAlignment: readonly PmbokAlignmentTag[];
  readonly learnerRole: LocalizedText;
  readonly prerequisites: readonly LocalizedText[];
  readonly thumbnailAssetId: AssetId | null;
  readonly heroAssetId: AssetId | null;
  readonly accessibilitySummary: LocalizedText;
  readonly runtimeCompatibility: string;
  readonly schemaVersion: number;
  readonly checksum: string;
}
```

### 8.1 Required Northstar values

```text
business_case_id: northstar-connected-care
content_version: 1.0.0
default_locale: en-US
estimated_minutes: 600
learning_days: 10
chapter_count: 6
difficulty: adaptive
experience_levels: explorer, practitioner, leader
```

---

## 9. Localized Learner-Facing Text

```ts
interface LocalizedText {
  readonly values: Readonly<Record<LocaleCode, string>>;
}
```

MVP rules:

- `en-US` is required for every learner-facing field;
- blank strings are invalid;
- unsupported locale keys are invalid;
- HTML is prohibited unless a field explicitly permits sanitized rich text;
- Markdown fields must use the approved safe subset;
- author-facing notes are separate from learner-facing text;
- missing translations fall back only to the package default locale;
- missing default-locale content is a publication-blocking error.

---

## 10. Experience Levels

```ts
type ExperienceLevel = "explorer" | "practitioner" | "leader";
```

Case content may vary guidance, hints, ambiguity, optional challenges, and feedback depth by level.

The following remain common unless the case specification explicitly permits variation:

- authoritative business facts;
- required core decisions;
- authoritative consequence rules;
- core scoring standard;
- chapter completion criteria;
- outcome calculation rules.

```ts
interface ExperienceVariant<T> {
  readonly default: T;
  readonly explorer?: T;
  readonly practitioner?: T;
  readonly leader?: T;
}
```

A missing level-specific value uses `default`.

---

## 11. Chapter Definition

```ts
interface ChapterDefinition {
  readonly id: ChapterId;
  readonly order: number;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly learningObjectives: readonly LearningObjectiveId[];
  readonly initialUnlock: boolean;
  readonly unlockWhen: ConditionExpression | null;
  readonly completionWhen: ConditionExpression;
  readonly requiredActivityIds: readonly ActivityId[];
  readonly requiredDecisionIds: readonly DecisionId[];
  readonly entryEventIds: readonly ContentEventId[];
  readonly completionEventIds: readonly ContentEventId[];
  readonly estimatedMinutes: number;
  readonly learnerGuidance: ExperienceVariant<LocalizedText>;
}
```

Rules:

- chapter order is unique and begins at 1;
- the chapter graph is acyclic;
- at least one chapter is initially unlocked;
- every required activity and decision belongs to that chapter;
- all completion requirements are reachable;
- later chapters may depend on prior authoritative completion signals;
- content may not use wall-clock waiting to unlock learning chapters;
- Northstar must contain six chapters and 19 required decisions distributed according to BC-001.

---

## 12. Stakeholder Definition

```ts
interface StakeholderDefinition {
  readonly id: StakeholderId;
  readonly displayName: LocalizedText;
  readonly roleTitle: LocalizedText;
  readonly organization: LocalizedText;
  readonly stakeholderType: "internal" | "external" | "vendor" | "customer" | "governance";
  readonly profileSummary: LocalizedText;
  readonly motivations: readonly LocalizedText[];
  readonly goals: readonly LocalizedText[];
  readonly concerns: readonly LocalizedText[];
  readonly influence: "low" | "medium" | "high" | "critical";
  readonly interest: "low" | "medium" | "high";
  readonly initialTrust: number;
  readonly relationships: readonly StakeholderRelationship[];
  readonly chapterBehavior: readonly StakeholderChapterBehavior[];
  readonly informationAccess: readonly InformationBoundaryRule[];
  readonly portraitAssetId: AssetId | null;
  readonly accessibilityLabel: LocalizedText;
}
```

Rules:

- trust is within the approved normalized range;
- relationships reference existing stakeholders in the same case version;
- chapter behavior references existing chapters;
- hidden motivations never appear in learner-safe profiles before disclosure;
- AI persona context derives only from approved stakeholder content and authoritative run state.

---

## 13. Message and Conversation Definition

```ts
interface MessageDefinition {
  readonly id: MessageDefinitionId;
  readonly chapterId: ChapterId;
  readonly senderStakeholderId: StakeholderId | null;
  readonly channel: "inbox" | "stakeholder_chat" | "system";
  readonly subject: LocalizedText | null;
  readonly body: LocalizedText;
  readonly availableWhen: ConditionExpression;
  readonly deliveredWhen: TriggerDefinition;
  readonly relatedDecisionId: DecisionId | null;
  readonly relatedMeetingId: MeetingDefinitionId | null;
  readonly relatedDocumentIds: readonly DocumentId[];
  readonly informationalOnly: boolean;
  readonly requiresResponse: boolean;
  readonly urgency: "routine" | "important" | "urgent" | "critical";
  readonly accessibilitySummary: LocalizedText;
}
```

Rules:

- informational messages may not be counted as pending decisions;
- a decision-linked message references exactly one valid decision;
- a message must not create a duplicate decision object;
- stakeholder conversations are retained as history;
- completed decisions remain visible through the Decision Log and related context;
- delivery order is deterministic when multiple messages become available together.

---

## 14. Meeting Definition

```ts
interface MeetingDefinition {
  readonly id: MeetingDefinitionId;
  readonly chapterId: ChapterId;
  readonly title: LocalizedText;
  readonly purpose: LocalizedText;
  readonly participantStakeholderIds: readonly StakeholderId[];
  readonly agendaItems: readonly MeetingAgendaItem[];
  readonly availableWhen: ConditionExpression;
  readonly completionWhen: ConditionExpression;
  readonly relatedDecisionIds: readonly DecisionId[];
  readonly relatedDocumentIds: readonly DocumentId[];
  readonly estimatedMinutes: number;
  readonly required: boolean;
  readonly accessibilitySummary: LocalizedText;
}
```

Rules:

- participants exist in the same case version;
- required meetings are reachable;
- completion cannot require an unavailable decision;
- a meeting that contains a decision must link to the authoritative decision definition;
- meeting completion and decision completion remain distinct authoritative signals.

---

## 15. Document Definition

```ts
interface DocumentDefinition {
  readonly id: DocumentId;
  readonly chapterId: ChapterId | null;
  readonly documentType: string;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly body: LocalizedText | null;
  readonly assetId: AssetId | null;
  readonly availableWhen: ConditionExpression;
  readonly evidenceTags: readonly EvidenceTag[];
  readonly supportsDecisionIds: readonly DecisionId[];
  readonly containsHiddenSections: boolean;
  readonly disclosureRules: readonly DocumentDisclosureRule[];
  readonly accessibility: DocumentAccessibilityMetadata;
}
```

Required accessibility metadata:

- accessible title;
- document language;
- text alternative or accessible source for non-text assets;
- table headers where applicable;
- reading order;
- no critical evidence available only through color;
- downloadable assets must have an accessible equivalent.

---

## 16. Activity Definition

```ts
interface ActivityDefinition {
  readonly id: ActivityId;
  readonly chapterId: ChapterId;
  readonly title: LocalizedText;
  readonly instructions: ExperienceVariant<LocalizedText>;
  readonly activityType: "review" | "analysis" | "artifact" | "practice" | "reflection" | "communication";
  readonly availableWhen: ConditionExpression;
  readonly completionWhen: ConditionExpression;
  readonly required: boolean;
  readonly relatedDocumentIds: readonly DocumentId[];
  readonly relatedDecisionIds: readonly DecisionId[];
  readonly learningObjectiveIds: readonly LearningObjectiveId[];
  readonly estimatedMinutes: number;
}
```

Rules:

- required activities are included in chapter completion;
- completion is authoritative and idempotent;
- UI navigation alone does not complete an activity;
- reading activities define an explicit completion signal;
- artifact activities define a validated submission or selection contract.

---

## 17. Decision Definition

```ts
interface DecisionDefinition {
  readonly id: DecisionId;
  readonly chapterId: ChapterId;
  readonly title: LocalizedText;
  readonly situation: LocalizedText;
  readonly prompt: ExperienceVariant<LocalizedText>;
  readonly decisionType: "single_select" | "multi_select" | "rank" | "sequence" | "structured_response" | "evidence_select";
  readonly availableWhen: ConditionExpression;
  readonly requiredEvidence: readonly EvidenceRequirement[];
  readonly options: readonly DecisionOptionDefinition[];
  readonly rubric: DecisionRubric;
  readonly consequenceIdsByOption: Readonly<Record<DecisionOptionId, readonly ConsequenceId[]>>;
  readonly required: boolean;
  readonly reversible: boolean;
  readonly responseDeadline: SimulationTimeRule | null;
  readonly learningObjectiveIds: readonly LearningObjectiveId[];
  readonly accessibilitySummary: LocalizedText;
}
```

```ts
interface DecisionOptionDefinition {
  readonly id: DecisionOptionId;
  readonly label: LocalizedText;
  readonly description: LocalizedText;
  readonly rationalePrompt: LocalizedText | null;
  readonly availableWhen: ConditionExpression;
}
```

Rules:

- every required decision has at least two materially different valid options or an appropriate structured-response rubric;
- every option has one deterministic resolution path;
- evidence requirements are available or fairly discoverable before submission;
- unavailable options are not silently scored as failures;
- option ordering is stable;
- informational Inbox messages never create additional decision counts;
- each learner submission creates one Decision Log entry;
- retries remain idempotent.

---

## 18. Evidence Requirements

```ts
interface EvidenceRequirement {
  readonly evidenceTag: EvidenceTag;
  readonly minimumItems: number;
  readonly sourceTypes: readonly ("document" | "message" | "meeting" | "conversation" | "metric")[];
  readonly requiredForEligibility: boolean;
  readonly contributesToScoring: boolean;
}
```

Validation must prove that each required evidence tag can become available before the decision deadline or required completion point.

Hidden information may add nuance or improve scoring, but a learner may not be punished for failing to use evidence that the authored state made impossible to discover.

---

## 19. Consequence Definition

```ts
interface ConsequenceDefinition {
  readonly id: ConsequenceId;
  readonly sourceDecisionId: DecisionId | null;
  readonly sourceEventId: ContentEventId | null;
  readonly applyWhen: ConditionExpression;
  readonly timing: ConsequenceTiming;
  readonly effects: readonly ConsequenceEffect[];
  readonly learnerFeedback: ExperienceVariant<LocalizedText>;
  readonly reversible: boolean;
  readonly recoveryActivityIds: readonly ActivityId[];
}
```

Allowed effect families:

```ts
type ConsequenceEffect =
  | ProjectMetricDeltaEffect
  | StakeholderTrustDeltaEffect
  | UnlockContentEffect
  | LockContentEffect
  | ScheduleContentEventEffect
  | EmitLearningSignalEffect
  | EmitAssessmentSignalEffect
  | TransitionProjectStateEffect
  | AddRiskEffect
  | ResolveRiskEffect
  | AddIssueEffect
  | ResolveIssueEffect
  | RecordNarrativeFlagEffect;
```

Rules:

- effect types are allowlisted;
- arbitrary field mutation is prohibited;
- effects target known metrics, stakeholders, content, or project states;
- immediate and delayed effects are explicit;
- ordering is deterministic;
- duplicate delivery is safe;
- each applied effect is traceable to its source;
- effects are case-scoped and version-scoped;
- AI does not invent, select, or apply authoritative effects.

---

## 20. Declarative Conditions

Content uses an allowlisted abstract syntax tree rather than executable expressions.

```ts
type ConditionExpression =
  | { readonly kind: "always" }
  | { readonly kind: "all"; readonly conditions: readonly ConditionExpression[] }
  | { readonly kind: "any"; readonly conditions: readonly ConditionExpression[] }
  | { readonly kind: "not"; readonly condition: ConditionExpression }
  | { readonly kind: "chapter_status"; readonly chapterId: ChapterId; readonly status: string }
  | { readonly kind: "activity_status"; readonly activityId: ActivityId; readonly status: string }
  | { readonly kind: "decision_status"; readonly decisionId: DecisionId; readonly status: string }
  | { readonly kind: "decision_option_selected"; readonly decisionId: DecisionId; readonly optionId: DecisionOptionId }
  | { readonly kind: "meeting_status"; readonly meetingId: MeetingDefinitionId; readonly status: string }
  | { readonly kind: "document_available"; readonly documentId: DocumentId }
  | { readonly kind: "message_delivered"; readonly messageId: MessageDefinitionId }
  | { readonly kind: "metric_compare"; readonly metricKey: MetricKey; readonly operator: ComparisonOperator; readonly value: number }
  | { readonly kind: "narrative_flag"; readonly flag: NarrativeFlag; readonly value: boolean }
  | { readonly kind: "experience_level"; readonly level: ExperienceLevel };
```

Rules:

- conditions are pure and deterministic;
- conditions cannot call external services;
- conditions cannot inspect another learner or tenant;
- conditions cannot inspect content from another case version;
- the condition graph must not create impossible circular prerequisites;
- unknown condition kinds fail validation.

---

## 21. Crisis Definition

```ts
interface CrisisDefinition {
  readonly id: CrisisId;
  readonly chapterId: ChapterId;
  readonly title: LocalizedText;
  readonly triggerWhen: ConditionExpression;
  readonly initialEventIds: readonly ContentEventId[];
  readonly relatedDecisionIds: readonly DecisionId[];
  readonly relatedStakeholderIds: readonly StakeholderId[];
  readonly escalationRules: readonly CrisisEscalationRule[];
  readonly resolutionWhen: ConditionExpression;
  readonly outcomeFlags: readonly NarrativeFlag[];
}
```

Rules:

- crisis variants derive from declared conditions and prior decisions;
- a crisis cannot invent facts unavailable in the approved Content Bible;
- the crisis must remain understandable through accessible evidence;
- crisis resolution must not require undeclared UI behavior.

---

## 22. Assessment Definition

```ts
interface AssessmentDefinition {
  readonly competencies: readonly CompetencyDefinition[];
  readonly weights: Readonly<Record<CompetencyId, number>>;
  readonly decisionRubrics: readonly DecisionRubric[];
  readonly chapterAssessments: readonly ChapterAssessmentRule[];
  readonly finalOutcomeRules: readonly FinalOutcomeRule[];
}
```

Rules:

- weights total 100 percent;
- rubrics are deterministic and versioned;
- AI may explain scores but may not calculate authoritative scores;
- experience levels use the same core scoring standard;
- a single project metric cannot determine the entire final outcome;
- final outcome rules map only to declared outcome IDs.

Northstar scoring weights remain governed by BC-001.

---

## 23. Achievement and Outcome Definitions

```ts
interface AchievementDefinition {
  readonly id: AchievementId;
  readonly title: LocalizedText;
  readonly description: LocalizedText;
  readonly awardedWhen: ConditionExpression;
  readonly iconAssetId: AssetId | null;
}

interface OutcomeDefinition {
  readonly id: OutcomeId;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly classificationRank: number;
  readonly eligibleWhen: ConditionExpression;
  readonly reflectionPrompts: readonly LocalizedText[];
}
```

Rules:

- achievement conditions are transparent after award;
- achievements do not override competency scoring;
- outcome rules are mutually understandable, though more than one may be technically eligible before priority resolution;
- final priority resolution is deterministic;
- Northstar outcomes map to the six BC-001 classifications.

---

## 24. Asset References

```ts
interface AssetReference {
  readonly id: AssetId;
  readonly kind: "image" | "pdf" | "audio" | "video" | "data";
  readonly uri: string;
  readonly checksum: string;
  readonly mimeType: string;
  readonly locale: LocaleCode | null;
  readonly accessibilityLabel: LocalizedText;
  readonly transcriptAssetId: AssetId | null;
  readonly captionAssetId: AssetId | null;
}
```

Rules:

- asset checksums are verified;
- unsupported MIME types fail validation;
- private storage paths are resolved through approved infrastructure;
- learner clients never receive internal storage credentials;
- videos require captions;
- audio requires transcripts;
- evidence-bearing images require equivalent textual descriptions;
- PDFs must have accessible text or an accessible equivalent.

---

## 25. Validation Pipeline

Validation runs in ordered layers.

### Layer 1 — Parse and basic schema

Validate:

- valid JSON or approved source format;
- required fields;
- field types;
- enums;
- string limits;
- numeric ranges;
- semantic-version syntax;
- locale syntax;
- unknown-field policy.

### Layer 2 — Identity and uniqueness

Validate:

- globally unique `business_case_id`;
- unique `(business_case_id, content_version)`;
- unique IDs within each entity collection;
- no reserved-ID reuse;
- no conflicting default published versions.

### Layer 3 — Reference integrity

Validate all references:

- chapter;
- stakeholder;
- message;
- meeting;
- document;
- activity;
- decision;
- option;
- consequence;
- crisis;
- assessment;
- achievement;
- outcome;
- asset;
- learning objective;
- project metric.

All references must resolve inside the same package version.

### Layer 4 — Graph and reachability

Validate:

- chapter graph is acyclic;
- required content is reachable;
- completion conditions can become true;
- required evidence is discoverable;
- required decisions are available before chapter completion;
- no impossible circular unlocks;
- crisis and recovery paths are reachable where intended;
- at least one valid ending remains possible from every allowed authoritative path.

### Layer 5 — Decision and consequence integrity

Validate:

- every option has a resolution path;
- consequence IDs exist;
- effect targets exist;
- effect types are allowlisted;
- duplicate application is safe;
- delayed effects have valid trigger timing;
- reversible consequences define valid recovery behavior;
- scoring rubrics refer to valid competencies and evidence.

### Layer 6 — Educational and content integrity

Validate:

- required learning objectives are covered;
- PMBOK alignment tags are valid;
- estimated workload is within configured thresholds;
- required decision counts match the approved blueprint;
- informational messages are not decisions;
- required content is not duplicated across surfaces without an explicit canonical source;
- hidden-information boundaries remain fair.

### Layer 7 — Accessibility and localization

Validate:

- default-locale text exists;
- required accessibility summaries exist;
- assets have alternatives;
- documents provide accessible equivalents;
- critical state is not conveyed by color only;
- labels and headings are meaningful;
- optional translations are structurally complete when declared supported.

### Layer 8 — Runtime compatibility and publication

Validate:

- schema version is supported;
- runtime compatibility range is supported;
- checksum matches;
- publication state transition is valid;
- published content is immutable;
- required approvals exist;
- no draft dependency is referenced;
- catalog metadata is complete;
- exact-version resolution succeeds.

---

## 26. Validation Results

```ts
interface ContentValidationResult {
  readonly validationRunId: string;
  readonly contentPackageVersionId: ContentPackageVersionId;
  readonly checksum: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly status: "passed" | "failed";
  readonly errors: readonly ContentValidationIssue[];
  readonly warnings: readonly ContentValidationIssue[];
  readonly validatorVersion: string;
}

interface ContentValidationIssue {
  readonly code: string;
  readonly severity: "error" | "warning";
  readonly path: string;
  readonly entityId: string | null;
  readonly message: string;
  readonly relatedIds: readonly string[];
  readonly suggestedResolution: string | null;
}
```

Requirements:

- errors block publication;
- warnings require review but may not block unless configured;
- results are retained;
- results reference the validated checksum;
- changing content invalidates previous results;
- messages identify exact paths and entity IDs;
- validation output must be usable in CI and human review.

Canonical error-code families:

```text
SCHEMA_*
IDENTITY_*
REFERENCE_*
REACHABILITY_*
DECISION_*
CONSEQUENCE_*
ASSESSMENT_*
ACCESSIBILITY_*
LOCALIZATION_*
PUBLICATION_*
COMPATIBILITY_*
ISOLATION_*
```

---

## 27. Registry and Resolver Contracts

```ts
interface BusinessCaseCatalogReader {
  listSelectableCases(input: {
    tenantId: TenantId;
    learnerId: LearnerId;
    locale: LocaleCode;
  }): Promise<readonly BusinessCaseCatalogItem[]>;

  getCaseDetails(input: {
    businessCaseId: BusinessCaseId;
    locale: LocaleCode;
  }): Promise<BusinessCaseCatalogDetails | null>;
}

interface ContentPackageRegistry {
  resolveDefaultPublishedVersion(
    businessCaseId: BusinessCaseId,
  ): Promise<ContentPackageVersionId | null>;

  resolveExactVersion(input: {
    businessCaseId: BusinessCaseId;
    contentVersion: string;
  }): Promise<ContentPackageVersionId | null>;
}

interface ContentResolver {
  getPublishedVersion(
    versionId: ContentPackageVersionId,
  ): Promise<ValidatedBusinessCaseContentPackage>;
}
```

Rules:

- the catalog returns learner-safe metadata only;
- the registry resolves exact immutable versions;
- the resolver verifies checksum and publication status;
- cache keys include `contentPackageVersionId` and checksum;
- the resolver rejects a package whose internal manifest does not match the stored business case and version;
- existing runs may resolve retired versions;
- new runs may resolve only authorized selectable versions.

---

## 28. Run Creation Contract

The learner flow is:

```text
Browse catalog
-> Select business case
-> Review case details
-> Select experience level
-> Resolve exact published version
-> Authorize access
-> Create Simulation Run
-> Pin businessCaseId and contentPackageVersionId
-> Initialize case content through authoritative commands
-> Enter Workplace
```

Run creation must fail when:

- the case does not exist;
- the version is not published;
- the case is not available to the learner;
- the experience level is unsupported;
- runtime compatibility fails;
- validation status is stale or failed;
- checksum verification fails;
- the stored case ID and package manifest disagree.

A run may not change business cases after creation.

Changing experience level after creation is out of scope for BC-003 unless explicitly approved later.

---

## 29. Multi-Case Isolation

All case-specific runtime objects must carry or derive the authoritative scope:

```text
tenant_id
simulation_run_id
business_case_id
content_package_version_id
```

Isolation rules:

- content lookup starts from the run’s pinned `contentPackageVersionId`;
- content IDs are never resolved from a global unscoped map;
- commands operate on one Simulation Run;
- projections are keyed by tenant and Simulation Run;
- API routes authorize tenant and run access;
- AI context is assembled only from the selected run and pinned case version;
- analytics include case/version dimensions but never merge authoritative run state;
- restarting a case creates a new Simulation Run;
- archiving a run does not retire its content version;
- one learner may have multiple runs across multiple cases and versions.

Validation and tests must deliberately use overlapping local entity IDs in two fixture cases to prove scoping works correctly.

---

## 30. Persistence Mapping

BC-003 uses the approved content schema.

### 30.1 `content.business_cases`

Stores stable case identity and lineage.

Required logical fields:

- internal ID;
- public `business_case_id`;
- current display metadata or approved metadata reference;
- created timestamp;
- retired timestamp if applicable.

### 30.2 `content.content_packages`

Stores the package identity associated with one business case.

### 30.3 `content.content_package_versions`

Stores:

- internal immutable version ID;
- package ID;
- semantic version;
- lifecycle status;
- schema version;
- runtime compatibility;
- complete definition JSONB;
- checksum;
- publication timestamp;
- creation timestamp.

### 30.4 `content.content_validation_results`

Stores retained validation outcomes tied to exact version ID and checksum.

### 30.5 `content.content_publications`

Stores approval and publication audit information.

### 30.6 Simulation Run

The existing Simulation Run fields remain authoritative:

- `businessCaseId`;
- `contentPackageVersionId`;
- `runtimeVersion`.

BC-003 must not replace these with an unversioned case slug alone.

---

## 31. Publication Rules

Publication requires:

1. Complete content definition.
2. Current checksum.
3. Passing validation result for that checksum.
4. Approved review state.
5. Supported schema version.
6. Supported runtime compatibility.
7. Complete catalog metadata.
8. Complete accessibility metadata.
9. No unresolved publication-blocking review comments.
10. Immutable version record creation.

Published content:

- cannot be updated in place;
- may be retired;
- may remain installed for existing runs;
- may not reference draft assets or content;
- must remain reproducible by checksum.

---

## 32. API Direction

Minimum learner-facing API surface:

```text
GET /api/business-cases
GET /api/business-cases/:businessCaseId
POST /api/simulation-runs
GET /api/simulation-runs
GET /api/simulation-runs/:simulationRunId
```

`POST /api/simulation-runs` accepts conceptually:

```json
{
  "businessCaseId": "northstar-connected-care",
  "experienceLevel": "explorer"
}
```

The server resolves and pins the exact default published version.

The response includes:

- simulation run ID;
- business case ID;
- content version;
- experience level;
- initial run status;
- first available Workplace route.

Administrator or content-author APIs are separate and require stronger authorization.

---

## 33. Required Test Fixtures

### 33.1 Northstar fixture

A representative structured Northstar package must include at minimum:

- manifest;
- six chapters;
- representative stakeholders;
- Chapter One messages, meeting, documents, activities, and three required decisions;
- representative immediate and delayed consequences;
- assessment and outcome definitions.

Full Northstar conversion may continue as BC-002 content is completed.

### 33.2 Independent second case

Create a small technical fixture case with a different:

- business-case ID;
- industry;
- version;
- chapter IDs;
- stakeholder content;
- decision content;
- consequence content.

The second fixture exists to prove reuse and isolation. It is not a second production Content Bible.

Recommended fixture identity:

```text
business_case_id: harbor-logistics-recovery
content_version: 1.0.0
```

The fixture may intentionally reuse local IDs such as `chapter.orientation` and `decision.delivery-approach` to prove that resolution is correctly scoped by package version.

---

## 34. Automated Test Matrix

### Schema tests

- valid Northstar manifest passes;
- missing required field fails;
- unknown prohibited field fails;
- malformed semantic version fails;
- unsupported locale fails;
- invalid enum fails;
- invalid numeric range fails.

### Identity tests

- duplicate business-case ID fails;
- duplicate version fails;
- duplicate entity ID in one collection fails;
- same local entity ID in two different cases succeeds;
- retired ID reuse according to policy fails.

### Reference tests

- valid references pass;
- unresolved stakeholder fails;
- unresolved decision fails;
- unresolved consequence fails;
- cross-case reference fails;
- cross-version reference fails;
- asset mismatch fails.

### Reachability tests

- valid chapter graph passes;
- circular chapter graph fails;
- unreachable required activity fails;
- unavailable required evidence fails;
- impossible completion rule fails;
- no reachable ending fails.

### Publication tests

- validated approved version publishes;
- failed validation blocks publication;
- changed checksum invalidates approval;
- published version mutation fails;
- retired version cannot create a new run;
- retired version can resolve for an existing run.

### Catalog tests

- two published cases appear;
- coming-soon case appears but is not selectable;
- draft case does not appear;
- restricted case follows authorization;
- default published version is returned.

### Run-pinning tests

- run creation stores business case and exact package version;
- newly published version does not alter an existing run;
- new run uses the newly designated default version;
- unsupported experience level fails;
- mismatched manifest fails.

### Isolation tests

- Case A messages never appear in Case B;
- Case A stakeholders never appear in Case B;
- Case A consequences cannot target Case B;
- AI context contains only the current case and run;
- projections remain run-scoped;
- same local IDs in two cases remain independent.

### Determinism tests

- same initial state and command sequence produces the same result;
- duplicate command is idempotent;
- duplicate consequence delivery is idempotent;
- rebuild produces convergent projections;
- content checksum is stable for canonical serialization.

---

## 35. CI and Authoring Tooling

Required commands should be introduced conceptually as:

```text
pnpm content:validate
pnpm content:validate --case northstar-connected-care --version 1.0.0
pnpm content:catalog
pnpm content:checksum
pnpm content:test
```

Requirements:

- CI validates every changed content package;
- CI prints structured and human-readable errors;
- invalid content fails the pull request;
- published content checksum changes fail the pull request unless a new version is created;
- fixture validation runs in normal PR-tier tests;
- full package graph and isolation validation runs before publication.

---

## 36. Implementation Sequence for Cursor

### Phase 1 — Architecture discovery

1. Inspect existing content-related Domain types.
2. Inspect Simulation Run creation and lifecycle services.
3. Inspect content database migrations and repositories.
4. Inspect API composition and authorization.
5. Identify existing JSON-schema or validation dependencies.
6. Confirm package placement before adding dependencies.
7. Record any required ADR only when the approved architecture does not already decide the issue.

### Phase 2 — Contracts

1. Add stable content identifiers and enums.
2. Add manifest and top-level package types.
3. Add entity definitions.
4. Add declarative condition types.
5. Add allowlisted consequence-effect types.
6. Add catalog and resolver ports.
7. Add structured validation-result types.

### Phase 3 — Validation

1. Implement basic schema validation.
2. Implement uniqueness validation.
3. Implement reference validation.
4. Implement reachability validation.
5. Implement decision and consequence validation.
6. Implement accessibility and localization validation.
7. Implement runtime-compatibility validation.
8. Implement canonical checksum creation.

### Phase 4 — Registry and resolution

1. Implement in-memory registry for tests and local development.
2. Implement exact-version resolver.
3. Implement selectable catalog query.
4. Implement checksum verification.
5. Implement version-aware caching.
6. Implement retired-version resolution for existing runs.

### Phase 5 — Persistence and publication

1. Reconcile existing content migrations with required fields.
2. Add migrations only where gaps exist.
3. Implement validation-result persistence.
4. Implement publication transaction and immutability guard.
5. Preserve RLS and tenant authorization where tenant scope applies.

### Phase 6 — Run selection

1. Add catalog application service.
2. Add case-details service.
3. Extend run-creation input with case selection and experience level.
4. Resolve and pin the exact version server-side.
5. Initialize content through authoritative commands.
6. Return learner-safe run metadata.

### Phase 7 — Fixtures and tests

1. Convert the Northstar manifest and representative Chapter One content.
2. Add the Harbor Logistics fixture.
3. Add schema tests.
4. Add reference and reachability tests.
5. Add catalog and run-pinning tests.
6. Add cross-case isolation tests.
7. Add publication immutability tests.
8. Add deterministic consequence tests.

### Phase 8 — API integration

1. Add catalog endpoint.
2. Add case-detail endpoint.
3. Update run-creation endpoint.
4. Preserve standard API envelopes and authorization.
5. Add API contract and integration tests.

---

## 37. BC-004 Handoff

BC-004 begins only after BC-003 provides a validated path for:

1. listing Northstar in the Business Case Catalog;
2. selecting Northstar;
3. selecting Explorer, Practitioner, or Leader;
4. resolving Northstar Version `1.0.0`;
5. creating a run pinned to Northstar’s exact version;
6. initializing Chapter One from structured content;
7. rendering the initial Workplace projections;
8. processing Chapter One decisions and consequences through the authoritative command, outbox, relay, projection, API, and Workplace path.

BC-004 must not bypass the content registry with a hardcoded Northstar import.

---

## 38. Out of Scope

BC-003 does not require:

- completing all Northstar narrative copy;
- building all six Northstar chapters in the learner UI;
- creating a second production-quality business case;
- changing the authoritative command/outbox/relay architecture;
- historical migration of runs between content versions;
- a visual no-code content authoring studio;
- marketplace billing;
- learner-generated business cases;
- arbitrary author-defined executable logic;
- automatic AI generation of authoritative content.

---

## 39. Acceptance Criteria

BC-003 is complete when:

- [ ] The canonical specification is reviewed and approved.
- [ ] Content contracts cover manifest, chapters, stakeholders, messages, meetings, documents, notifications, activities, decisions, consequences, crises, assessments, achievements, outcomes, and assets.
- [ ] Stable identity and semantic-version rules are implemented.
- [ ] Catalog availability and lifecycle rules are implemented.
- [ ] The registry supports multiple installed and published cases.
- [ ] The resolver loads one exact immutable version.
- [ ] Simulation Runs remain pinned to `businessCaseId` and `contentPackageVersionId`.
- [ ] Cross-case and cross-version references are rejected.
- [ ] Required content reachability is validated.
- [ ] Accessibility and localization metadata are validated.
- [ ] Published content is immutable and checksum-protected.
- [ ] Northstar representative content validates.
- [ ] A second independent fixture validates.
- [ ] Catalog and run-selection APIs are implemented or contract-ready for BC-004.
- [ ] Automated tests cover validation, registry, resolution, publication, pinning, isolation, and determinism.
- [ ] No case-specific logic is hardcoded into React or shared runtime services.
- [ ] The implementation is merged into `main`.

---

## 40. Approval

This specification becomes canonical when:

- it is reviewed in GitHub;
- required review comments are resolved;
- Issue #72 acceptance criteria for the specification are confirmed;
- the approved document is merged into `main`;
- the Cursor implementation PR references this document and Issue #72.
