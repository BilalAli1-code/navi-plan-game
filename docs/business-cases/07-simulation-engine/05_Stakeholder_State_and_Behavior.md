# BC-006 — Stakeholder State and Behavior

Status: Draft for implementation
Phase: 3 — Simulation Engine
Business case: Northstar Flagship Simulation

## 1. Purpose

This document defines how stakeholder relationships, trust, sentiment, influence, engagement, conversations, and chapter-specific behavior evolve during the Northstar simulation.

## 2. Stakeholder principles

1. Stakeholders are persistent domain participants, not disposable messages.
2. Behavior must respond to chapter context, prior decisions, project metrics, and relationship history.
3. Conversations are append-only and remain available after decisions are completed.
4. Stakeholder reactions must be deterministic from authoritative state and versioned behavior rules.
5. Learner actions may improve or damage relationships, but consequences must be evidence-based and explainable.
6. Stakeholder state contributes to project conditions and assessment but must not be reduced to a single score.

## 3. Canonical stakeholder state

```ts
interface StakeholderRuntimeState {
  stakeholderId: string;
  chapterPresence: string[];
  trust: number;
  confidence: number;
  influence: number;
  engagement: number;
  sentiment: StakeholderSentiment;
  stance: StakeholderStance;
  relationshipFlags: string[];
  activeStoryArcIds: string[];
  coalitionIds: string[];
  conversationThreadIds: string[];
  unresolvedConcernIds: string[];
  lastInteractionAt?: string;
  version: number;
}
```

Supported sentiment values:

- supportive
- neutral
- concerned
- resistant
- hostile

Supported stance values:

- advocate
- conditional_supporter
- observer
- skeptic
- blocker

## 4. Relationship dimensions

### Trust

Confidence that the learner acts honestly, consistently, and in stakeholder interests.

### Confidence

Belief that project leadership is competent and the project can succeed.

### Influence

Ability to affect project decisions, resources, approvals, adoption, or public perception.

### Engagement

Current willingness to participate, respond, support, review, or collaborate.

These dimensions are independent. A stakeholder may have high influence and low engagement, or high trust but low confidence in the delivery plan.

## 5. Behavior rule contract

```ts
interface StakeholderBehaviorRule {
  behaviorRuleId: string;
  stakeholderId: string;
  chapterId?: string;
  triggerExpression: string;
  priority: number;
  oncePerRun: boolean;
  reaction: StakeholderReactionDefinition;
}
```

A reaction may:

- release a message
- request or schedule a meeting
- create a concern
- support or oppose a decision
- change trust, confidence, engagement, or sentiment
- activate or conclude a story arc
- join or leave a coalition
- escalate to governance

## 6. Behavior inputs

Behavior may depend on:

- current chapter
- learner decision history
- evidence quality
- stakeholder interaction history
- unresolved concerns
- project metric thresholds
- active risks and issues
- other stakeholder reactions
- role and influence
- experience-level configuration

No behavior rule may read transient UI state.

## 7. Conversation model

```ts
interface StakeholderConversationThread {
  threadId: string;
  simulationRunId: string;
  stakeholderIds: string[];
  subject: string;
  chapterOpened: string;
  status: "active" | "resolved" | "archived";
  messageIds: string[];
}

interface StakeholderMessage {
  messageId: string;
  threadId: string;
  senderType: "learner" | "stakeholder" | "system";
  senderId: string;
  bodyRef: string;
  interactionType: "message" | "negotiation" | "escalation" | "commitment" | "challenge" | "feedback";
  relatedDecisionId?: string;
  relatedMeetingId?: string;
  occurredAt: string;
}
```

Archiving a thread changes visibility, not history. Completed decisions must not remove stakeholder communications.

## 8. Interaction outcomes

Every learner interaction may produce:

- relationship adjustments
- project metric adjustments
- competency evidence
- delayed stakeholder reactions
- commitment or concern records

Freeform text must not directly mutate state without an evaluated interaction outcome. AI-assisted evaluation, when used, must return structured, validated output and cannot bypass deterministic domain rules.

## 9. Story arcs

Story arcs define multi-chapter stakeholder continuity.

```ts
interface StakeholderStoryArcState {
  storyArcId: string;
  stakeholderIds: string[];
  status: "inactive" | "active" | "resolved" | "failed";
  currentBeatId?: string;
  activatedBy: string;
  resolutionEvidenceRefs: string[];
}
```

Story arcs may branch based on earlier decisions but must retain stable identifiers and explicit activation conditions.

## 10. Coalition behavior

Stakeholders may form temporary or persistent coalitions around:

- governance
- delivery speed
- compliance
- employee adoption
- customer impact
- financial value
- technical risk

Coalition behavior must be explicit. A coalition can amplify influence, alter meeting dynamics, or trigger escalation, but it cannot secretly rewrite previous stakeholder state.

## 11. Chapter-specific adaptation

### Chapter 1

Stakeholders test leadership credibility, strategic alignment, and listening behavior.

### Chapter 2

Stakeholders respond to planning transparency, role clarity, governance, scope, and resource choices.

### Chapter 3

Behavior reflects execution performance, communication quality, team dynamics, vendor performance, and emerging issues.

### Chapter 4

Stakeholders become more sensitive to transparency, recovery leadership, ethics, escalation, and risk response.

### Chapter 5

Behavior focuses on readiness, adoption, quality, operational ownership, and benefits confidence.

### Chapter 6

Stakeholders evaluate closure integrity, accountability, lessons learned, transition, and realized or expected value.

## 12. Escalation model

Escalation may be triggered by:

- unresolved high-severity concern
- repeated unsupported commitments
- compliance or ethical breach
- deteriorating trust below a threshold
- failure to communicate a material issue
- explicit learner escalation

Escalation must create an event and visible evidence. It may release meetings, governance messages, or corrective decisions.

## 13. Relationship adjustment rules

All adjustments must be bounded from 0 to 100 and recorded with provenance.

```ts
interface StakeholderStateAdjustment {
  adjustmentId: string;
  stakeholderId: string;
  dimension: "trust" | "confidence" | "influence" | "engagement";
  delta: number;
  sourceType: string;
  sourceId: string;
  resultingValue: number;
  rationale: string;
}
```

Influence should rarely change. Trust, confidence, and engagement may change more frequently.

## 14. Sentiment and stance derivation

Sentiment and stance are derived from relationship dimensions, active concerns, story arcs, and role-specific rules. They must not be independently editable without an explicit domain event.

## 15. Assessment linkage

Stakeholder interactions may provide evidence for:

- communication
- leadership
- conflict management
- negotiation
- stakeholder engagement
- ethical judgment
- systems thinking
- adaptability

Assessment should evaluate quality and context, not message volume.

## 16. Accessibility and content safety

Stakeholder content must:

- avoid discriminatory stereotypes
- remain professional and realistic
- provide sufficient context for decision-making
- support readable alternatives for visual sentiment indicators
- distinguish urgency from hostility

## 17. Validation rules

- every stakeholder in the Phase 1 catalogs has runtime state
- every released stakeholder message has a valid trigger
- prior conversations remain retrievable
- duplicate events do not duplicate messages or state adjustments
- chapter progression changes behavior without replacing identity
- reactions are traceable to evidence
- coalition and escalation effects are deterministic

## 18. Acceptance criteria

The model is complete when the full six-chapter stakeholder story can be replayed from authoritative events, all messages and decisions remain synchronized across surfaces, and stakeholder behavior changes appropriately based on chapter, learner choices, and project conditions.
