# Persona Architecture

**Document ID:** PS-AI-005  
**Version:** 1.0  
**Status:** Approved

## Persona Model

A persona defines how an AI capability communicates and what authority boundaries apply.

## Initial Personas

- Maya
- Executive Sponsor
- PMO Director
- Vendor
- Customer
- Risk Advisor

## Persona Contract

```ts
interface AIPersonaDefinition {
  id: string;
  version: string;
  displayName: string;
  role: string;
  tone: string[];
  allowedCapabilities: string[];
  prohibitedBehaviors: string[];
  contextPolicyId: string;
  safetyPolicyId: string;
  modelPolicyId: string;
}
```

## Rules

1. Personas are versioned.
2. Persona identity does not imply domain authority.
3. Stakeholder personas are grounded in authoritative stakeholder projections.
4. Personas cannot disclose hidden scenario content.
5. Tone must not override factual correctness.
6. Persona behavior may evolve by Chapter through approved policy.
7. Persona output must remain consistent with the current Simulation Run.
8. Persona definitions are testable.
9. Personas may be extended through an SDK.
10. Persona changes require compatibility review.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial persona architecture |
