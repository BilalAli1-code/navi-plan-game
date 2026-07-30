import type {
  DecisionOutcomeDefinitionId,
  ResolverVersion,
} from "../../shared-kernel/ids";
import type { ConsequenceDefinition } from "./consequence-definition";

/**
 * Content-authored outcome for one Decision option (PS-ROADMAP-005).
 *
 * `qualityClassification` is intentionally nullable: no approved public enum
 * exists in current architecture docs. Do not invent a scoring framework here.
 */

export interface DecisionOutcomeDefinition {
  readonly id: DecisionOutcomeDefinitionId;
  readonly resolverVersion: ResolverVersion;
  /** Nullable until an approved quality-classification contract exists. */
  readonly qualityClassification: string | null;
  readonly consequenceDefinitions: readonly ConsequenceDefinition[];
  readonly explanationReference: string | null;
}
