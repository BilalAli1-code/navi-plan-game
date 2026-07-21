import type { DeliveryApproach } from "./types";

export type StakeholderSpec = {
  id: string;
  name: string;
  role: string;
};

export type CaseSpecAlignment = {
  caseId: string;
  projectName: string;
  deliveryApproach: DeliveryApproach;
  stakeholderRoster: StakeholderSpec[];
  frozenStakeholderIds: string[];
  intentionalDeviations: string[];
};

export const PROJECT_HORIZON_ALIGNMENT: CaseSpecAlignment = {
  caseId: "software",
  projectName: "Project Horizon",
  deliveryApproach: "Hybrid",
  stakeholderRoster: [
    {
      id: "sponsor",
      name: "Elena Martinez",
      role: "Executive Sponsor / Chief Customer Officer",
    },
    { id: "product-owner", name: "Marcus Reed", role: "Product Owner" },
    { id: "cs-director", name: "Priya Shah", role: "Customer Service Director" },
    { id: "team-lead", name: "Daniel Cho", role: "Engineering Manager" },
    {
      id: "risk-officer",
      name: "Aisha Rahman",
      role: "Information Security Officer",
    },
    { id: "finance", name: "Robert Kim", role: "Finance Business Partner" },
    {
      id: "vendor",
      name: "Liam O'Connor",
      role: "External Integration Vendor Lead",
    },
    { id: "ux", name: "Naomi Brooks", role: "UX Research and Design Lead" },
    { id: "qa-lead", name: "Jordan Ellis", role: "QA and UAT Lead" },
    {
      id: "customer",
      name: "Maya Thompson",
      role: "Pilot Customer / Enterprise Account Administrator",
    },
  ],
  frozenStakeholderIds: [
    "sponsor",
    "product-owner",
    "cs-director",
    "it-manager",
    "architect",
    "ux",
    "team-lead",
    "qa-lead",
    "infra",
    "risk-officer",
    "finance",
    "procurement",
    "vendor",
    "customer",
  ],
  intentionalDeviations: [
    "Additional runtime stakeholders (it-manager, architect, infra, procurement) remain to preserve historical conversation continuity.",
    "Stakeholder IDs remain frozen to preserve references in simulation_events, simulation_actions, stakeholder_relationships, and stakeholder_memories.",
  ],
};
