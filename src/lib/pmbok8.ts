// PMBOK Guide 8th Edition scaffolding — principles, performance domains, and
// alignment to PMI's Exam Content Outline (ECO). Pure data module used by the
// simulator (Maya coach) and exam UI. Additive only; does not replace legacy
// KnowledgeArea/ProcessGroup content.

import type { KnowledgeArea } from "./sim/legacy/types";

// ---------- PMBOK 8: 12 Principles of Project Management ----------
// PMBOK 8 keeps the 12 principles from PMBOK 7 and strengthens their linkage to
// value delivery, AI-augmented delivery, and adaptive tailoring.
export type PmbokPrinciple = {
  id: number;
  name: string;
  summary: string;
};

export const PMBOK8_PRINCIPLES: PmbokPrinciple[] = [
  { id: 1, name: "Stewardship", summary: "Be a diligent, respectful, and caring steward." },
  { id: 2, name: "Team", summary: "Create a collaborative project team environment." },
  { id: 3, name: "Stakeholders", summary: "Engage stakeholders effectively and proactively." },
  { id: 4, name: "Value", summary: "Focus on delivering value throughout the lifecycle." },
  { id: 5, name: "Systems Thinking", summary: "Recognize, evaluate, and respond to system interactions." },
  { id: 6, name: "Leadership", summary: "Demonstrate leadership behaviors that empower the team." },
  { id: 7, name: "Tailoring", summary: "Tailor the delivery approach based on context." },
  { id: 8, name: "Quality", summary: "Build quality into processes and deliverables." },
  { id: 9, name: "Complexity", summary: "Navigate complexity with iterative sensing and response." },
  { id: 10, name: "Risk", summary: "Optimize risk responses to protect value." },
  { id: 11, name: "Adaptability & Resilience", summary: "Embrace adaptability and resilience to change." },
  { id: 12, name: "Change", summary: "Enable change to achieve the envisioned future state." },
];

// ---------- PMBOK 8: 8 Performance Domains ----------
export type PmbokDomain = {
  id: string;
  name: string;
  summary: string;
};

export const PMBOK8_PERFORMANCE_DOMAINS: PmbokDomain[] = [
  { id: "stakeholders", name: "Stakeholders", summary: "Productive relationships that support desired outcomes." },
  { id: "team", name: "Team", summary: "High-performing team with shared ownership." },
  { id: "development-approach", name: "Development Approach & Life Cycle", summary: "Predictive, adaptive, or hybrid — tailored to context." },
  { id: "planning", name: "Planning", summary: "Coordinated, proactive planning that evolves with insight." },
  { id: "project-work", name: "Project Work", summary: "Efficient, effective execution and resource stewardship." },
  { id: "delivery", name: "Delivery", summary: "Scope and quality that realize business value." },
  { id: "measurement", name: "Measurement", summary: "Reliable data to inform decisions and improvement." },
  { id: "uncertainty", name: "Uncertainty", summary: "Handle ambiguity, volatility, and risk." },
];

// ---------- ECO — PMI Exam Content Outline (current) ----------
// Domains and their weight in the current PMP ECO.
export type EcoDomain = "People" | "Process" | "Business Environment";

export const ECO_DOMAINS: { domain: EcoDomain; weight: number; blurb: string }[] = [
  { domain: "People", weight: 42, blurb: "Lead, empower, and support the team." },
  { domain: "Process", weight: 50, blurb: "Manage the technical aspects of the project." },
  { domain: "Business Environment", weight: 8, blurb: "Connect projects to strategy and value." },
];

// Representative ECO tasks used to tag questions and scenarios. This list is
// not exhaustive but covers the most-tested tasks per domain.
export type EcoTask = {
  id: string; // e.g. "P-1.1"
  domain: EcoDomain;
  task: string;
};

export const ECO_TASKS: EcoTask[] = [
  // People (14 tasks total in the ECO; representative subset)
  { id: "P-1.1", domain: "People", task: "Manage conflict" },
  { id: "P-1.2", domain: "People", task: "Lead a team" },
  { id: "P-1.3", domain: "People", task: "Support team performance" },
  { id: "P-1.4", domain: "People", task: "Empower team members and stakeholders" },
  { id: "P-1.5", domain: "People", task: "Ensure team members/stakeholders are adequately trained" },
  { id: "P-1.6", domain: "People", task: "Build a team" },
  { id: "P-1.7", domain: "People", task: "Address and remove impediments, obstacles, and blockers" },
  { id: "P-1.8", domain: "People", task: "Negotiate project agreements" },
  { id: "P-1.9", domain: "People", task: "Collaborate with stakeholders" },
  { id: "P-1.10", domain: "People", task: "Build shared understanding" },
  { id: "P-1.11", domain: "People", task: "Engage and support virtual teams" },
  { id: "P-1.12", domain: "People", task: "Define team ground rules" },
  { id: "P-1.13", domain: "People", task: "Mentor relevant stakeholders" },
  { id: "P-1.14", domain: "People", task: "Promote team performance through emotional intelligence" },
  // Process (17 tasks)
  { id: "PR-2.1", domain: "Process", task: "Execute project with the urgency required to deliver business value" },
  { id: "PR-2.2", domain: "Process", task: "Manage communications" },
  { id: "PR-2.3", domain: "Process", task: "Assess and manage risks" },
  { id: "PR-2.4", domain: "Process", task: "Engage stakeholders" },
  { id: "PR-2.5", domain: "Process", task: "Plan and manage budget and resources" },
  { id: "PR-2.6", domain: "Process", task: "Plan and manage schedule" },
  { id: "PR-2.7", domain: "Process", task: "Plan and manage quality of products/deliverables" },
  { id: "PR-2.8", domain: "Process", task: "Plan and manage scope" },
  { id: "PR-2.9", domain: "Process", task: "Integrate project planning activities" },
  { id: "PR-2.10", domain: "Process", task: "Manage project changes" },
  { id: "PR-2.11", domain: "Process", task: "Plan and manage procurement" },
  { id: "PR-2.12", domain: "Process", task: "Manage project artifacts" },
  { id: "PR-2.13", domain: "Process", task: "Determine appropriate project methodology/methods and practices" },
  { id: "PR-2.14", domain: "Process", task: "Establish project governance structure" },
  { id: "PR-2.15", domain: "Process", task: "Manage project issues" },
  { id: "PR-2.16", domain: "Process", task: "Ensure knowledge transfer to project continuity" },
  { id: "PR-2.17", domain: "Process", task: "Plan and manage project/phase closure or transitions" },
  // Business Environment (4 tasks)
  { id: "BE-3.1", domain: "Business Environment", task: "Plan and manage project compliance" },
  { id: "BE-3.2", domain: "Business Environment", task: "Evaluate and deliver project benefits and value" },
  { id: "BE-3.3", domain: "Business Environment", task: "Evaluate and address external business environment changes" },
  { id: "BE-3.4", domain: "Business Environment", task: "Support organizational change" },
];

// ---------- Mapping helpers ----------
// Map a legacy Knowledge Area to its most-related PMBOK 8 Performance Domain
// and one representative Principle. Used by Maya's coach panel.
const KA_TO_DOMAIN: Record<KnowledgeArea, string> = {
  Integration: "planning",
  Scope: "delivery",
  Schedule: "planning",
  Cost: "measurement",
  Quality: "delivery",
  Resource: "team",
  Communications: "stakeholders",
  Risk: "uncertainty",
  Procurement: "project-work",
  Stakeholder: "stakeholders",
};

const KA_TO_PRINCIPLE: Record<KnowledgeArea, number> = {
  Integration: 5,        // Systems Thinking
  Scope: 4,              // Value
  Schedule: 7,           // Tailoring
  Cost: 1,               // Stewardship
  Quality: 8,            // Quality
  Resource: 2,           // Team
  Communications: 3,     // Stakeholders
  Risk: 10,              // Risk
  Procurement: 1,        // Stewardship
  Stakeholder: 3,        // Stakeholders
};

const KA_TO_ECO: Record<KnowledgeArea, EcoDomain> = {
  Integration: "Process",
  Scope: "Process",
  Schedule: "Process",
  Cost: "Process",
  Quality: "Process",
  Resource: "People",
  Communications: "People",
  Risk: "Process",
  Procurement: "Process",
  Stakeholder: "People",
};

export function principleFor(ka: KnowledgeArea): PmbokPrinciple {
  return PMBOK8_PRINCIPLES.find((p) => p.id === KA_TO_PRINCIPLE[ka])!;
}
export function performanceDomainFor(ka: KnowledgeArea): PmbokDomain {
  return PMBOK8_PERFORMANCE_DOMAINS.find((d) => d.id === KA_TO_DOMAIN[ka])!;
}
export function ecoDomainFor(ka: KnowledgeArea): EcoDomain {
  return KA_TO_ECO[ka];
}
