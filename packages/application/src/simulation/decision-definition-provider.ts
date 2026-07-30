import type {
  ContentPackageVersionId,
  DecisionDefinition,
  DecisionId,
  TenantId,
} from "@projectsim/domain";

/**
 * Application read port for immutable DecisionDefinition content
 * (PS-ROADMAP-004). Content version must come from SimulationRun — never from
 * the client command.
 */
export interface DecisionDefinitionProvider {
  getDecisionDefinition(
    tenantId: TenantId,
    contentPackageVersionId: ContentPackageVersionId,
    decisionDefinitionId: DecisionId,
  ): Promise<DecisionDefinition | null>;
}
