import { err, ok, type SimulationCommandType } from "@projectsim/domain";
import type { SimulationCommandAuthorizer } from "@projectsim/application";
import type { MembershipStore } from "./membership";

/**
 * Capability required to execute each simulation command
 * (docs/architecture/05-api-architecture/03_Authentication_and_Authorization.md,
 * docs/architecture/02-domain-model/10_Identity_and_Access.md).
 *
 * PS-ROADMAP-004 debt: no dedicated `simulation.decision.submit` capability
 * exists in the approved auth model. SubmitDecision therefore uses the narrowest
 * existing learner-action mutation set (`simulation.run.view` +
 * `simulation.run.start`), matching other SimulationAction commands.
 */
export const DEFAULT_COMMAND_CAPABILITIES: Readonly<
  Record<SimulationCommandType, readonly string[]>
> = {
  SubmitDecision: ["simulation.run.view", "simulation.run.start"],
  InitializeActivity: ["simulation.run.view", "simulation.run.start"],
  CompleteActivity: ["simulation.run.view", "simulation.run.start"],
  InitializeStakeholder: ["simulation.run.view", "simulation.run.start"],
  SendStakeholderMessage: ["simulation.run.view", "simulation.run.start"],
  InitializeDocument: ["simulation.run.view", "simulation.run.start"],
  InitializeNotification: ["simulation.run.view", "simulation.run.start"],
  DeliverLearnerMessage: ["simulation.run.view", "simulation.run.start"],
  CompleteChapter: ["simulation.run.view", "simulation.run.start"],
  ScheduleMeeting: ["simulation.run.view", "simulation.run.start"],
  MakeMeetingAvailable: ["simulation.run.view", "simulation.run.start"],
  StartMeeting: ["simulation.run.view", "simulation.run.start"],
  CompleteMeeting: ["simulation.run.view", "simulation.run.start"],
  CancelMeeting: ["simulation.run.view", "simulation.run.start"],
  UploadArtifact: ["simulation.run.view", "simulation.run.start"],
};

export interface CapabilityAuthorizerOptions {
  readonly tenantId: string;
  readonly membershipStore: MembershipStore;
  readonly requiredCapabilities?: Readonly<
    Record<SimulationCommandType, readonly string[]>
  >;
}

/**
 * Production-shaped {@link SimulationCommandAuthorizer}.
 *
 * 1. Resolves the actor's membership for the configured tenant (never trusts a
 *    client-supplied tenant without membership validation).
 * 2. Requires every capability mapped to the command type.
 *
 * Returns `TENANT_ACCESS_DENIED` when the actor is not a member, and
 * `PERMISSION_DENIED` when membership exists but capabilities are insufficient.
 */
export const createCapabilityAuthorizer = (
  options: CapabilityAuthorizerOptions,
): SimulationCommandAuthorizer => {
  const required = options.requiredCapabilities ?? DEFAULT_COMMAND_CAPABILITIES;

  return {
    async authorize(command) {
      const membership = await options.membershipStore.findMembership(
        options.tenantId,
        command.actorId,
      );

      if (!membership) {
        return err({
          kind: "authorization",
          code: "TENANT_ACCESS_DENIED",
          retryable: false,
          message: `Actor ${command.actorId} is not a member of tenant ${options.tenantId}.`,
        });
      }

      const needed = required[command.commandType];
      const missing = needed.filter(
        (capability) => !membership.capabilities.includes(capability),
      );
      if (missing.length > 0) {
        return err({
          kind: "authorization",
          code: "PERMISSION_DENIED",
          retryable: false,
          message: `Actor ${command.actorId} lacks required capabilities: ${missing.join(", ")}.`,
          details: { missing },
        });
      }

      return ok(undefined);
    },
  };
};
