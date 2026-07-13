// First-class engine action types + Zod validators + mastery mapping helpers.
// These types are shared between the browser (form validation) and the server
// (authoritative processing). Client code MUST NOT compute authoritative
// scores / metric changes — it only submits inputs; the server engine
// computes outcomes.

import { z } from "zod";
import type { MetricImpact } from "./types";
import type { MasteryUpdate } from "./mastery.functions";

// -------- Interaction / Strategy vocabularies --------

export const INTERACTION_TYPES = [
  "chat",
  "meeting_response",
  "negotiation",
  "escalation",
  "information_request",
  "expectation_management",
  "feedback",
  "presentation",
] as const;
export type InteractionType = (typeof INTERACTION_TYPES)[number];

export const THREAT_STRATEGIES = [
  "Avoid",
  "Mitigate",
  "Transfer",
  "Accept",
  "Escalate",
] as const;
export const OPPORTUNITY_STRATEGIES = [
  "Exploit",
  "Enhance",
  "Share",
  "Accept",
  "Escalate",
] as const;
export type ThreatStrategy = (typeof THREAT_STRATEGIES)[number];
export type OpportunityStrategy = (typeof OPPORTUNITY_STRATEGIES)[number];
export type RiskStrategy = ThreatStrategy | OpportunityStrategy;

export const CONFLICT_TECHNIQUES = [
  "Collaborate / problem solve",
  "Compromise / reconcile",
  "Smooth / accommodate",
  "Force / direct",
  "Withdraw / avoid",
] as const;
export type ConflictTechnique = (typeof CONFLICT_TECHNIQUES)[number];

// -------- Zod validators (client + server) --------

const commonHeader = {
  runId: z.string().uuid(),
  sectionNumber: z.number().int().min(1).max(7),
};

export const StakeholderInteractionSchema = z.object({
  ...commonHeader,
  actionType: z.literal("stakeholder_interaction"),
  stakeholderId: z.string().min(1).max(64),
  interactionType: z.enum(INTERACTION_TYPES),
  learnerMessage: z.string().max(2000).optional(),
  selectedResponse: z.string().max(500).optional(),
  communicationGoal: z.string().max(200).optional(),
});
export type StakeholderInteractionInput = z.infer<typeof StakeholderInteractionSchema>;

export const RiskResponseSchema = z.object({
  ...commonHeader,
  actionType: z.literal("risk_response"),
  riskId: z.string().min(1).max(64),
  riskType: z.enum(["threat", "opportunity"]),
  responseStrategy: z.enum([...THREAT_STRATEGIES, ...OPPORTUNITY_STRATEGIES] as [
    string,
    ...string[],
  ]),
  reasoning: z.string().max(1000).optional(),
  ownerAssigned: z.string().max(120).optional(),
  contingencyDefined: z.boolean().optional(),
  residualRisk: z.number().min(0).max(100).optional(),
});
export type RiskResponseInput = z.infer<typeof RiskResponseSchema>;

export const ConflictManagementSchema = z.object({
  ...commonHeader,
  actionType: z.literal("conflict_management"),
  conflictId: z.string().min(1).max(64),
  parties: z.array(z.string().max(64)).min(1).max(10),
  conflictCause: z.string().max(500).optional(),
  selectedTechnique: z.enum(CONFLICT_TECHNIQUES),
  reasoning: z.string().max(1000).optional(),
});
export type ConflictManagementInput = z.infer<typeof ConflictManagementSchema>;

export const ActionInputSchema = z.discriminatedUnion("actionType", [
  StakeholderInteractionSchema,
  RiskResponseSchema,
  ConflictManagementSchema,
]);
export type ActionInput = z.infer<typeof ActionInputSchema>;

// -------- Outcome quality --------
export type OutcomeQuality = "excellent" | "good" | "risky" | "poor";

// -------- Delayed event descriptor --------
// Not persisted directly — the engine converts these into simulation_events rows.
export type DelayedEvent = {
  eventKey: string;
  eventType: "notification" | "issue" | "risk" | "meeting" | "email";
  priority?: "low" | "normal" | "high" | "urgent";
  dayOffset?: number;                // 1 = next day
  payload: Record<string, unknown>;
};

// -------- ProcessedAction outcome shape --------
export type ActionOutcome = {
  quality: OutcomeQuality;
  outcomeData: Record<string, unknown>;
  metricImpacts: MetricImpact;
  masteryImpacts: MasteryUpdate[];
  pmbokMapping: Record<string, unknown>;
  ecoMapping: Record<string, unknown>;
  delayedEvents: DelayedEvent[];
  actionKey: string;               // deterministic dedupe key
  subjectId: string;
};

// -------- Mastery topic keys (activated by these actions) --------
// Keep labels stable — they become durable rows in learner_mastery.
export const MASTERY_TOPICS = {
  stakeholderEngagement: "People — Stakeholder Engagement",
  communication: "People — Communication",
  negotiation: "People — Negotiation",
  conflictManagement: "People — Conflict Management",
  riskIdentification: "Uncertainty — Risk Identification",
  riskAnalysis: "Uncertainty — Risk Analysis",
  riskResponse: "Uncertainty — Risk Response",
  leadership: "People — Leadership",
  emotionalIntelligence: "People — Emotional Intelligence",
} as const;
