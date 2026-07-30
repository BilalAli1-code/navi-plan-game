# BC-006 — Metric and Project Health Model

Status: Draft for implementation
Phase: 3 — Simulation Engine
Business case: Northstar Flagship Simulation

## 1. Purpose

This document defines the authoritative metric system used to represent project health, expose learner-visible signals, trigger narrative consequences, and support scoring without turning the simulation into a simple point game.

## 2. Metric principles

1. Metrics represent project conditions, not learner grades.
2. Learner assessment and project health are related but separate.
3. Every metric adjustment must have traceable provenance.
4. Metrics are bounded and deterministic.
5. Hidden metrics may drive narrative behavior but must not create unfair, unexplained outcomes.
6. Composite health is derived, never independently edited.

## 3. Canonical metric set

```ts
interface ProjectMetricState {
  scheduleHealth: number;
  costHealth: number;
  scopeStability: number;
  qualityConfidence: number;
  riskExposure: number;
  complianceConfidence: number;
  stakeholderTrust: number;
  teamSustainability: number;
  vendorConfidence: number;
  executiveConfidence: number;
  businessValueConfidence: number;
}
```

Recommended scale:

- `0–19`: critical
- `20–39`: weak
- `40–59`: pressured
- `60–79`: stable
- `80–100`: strong

`riskExposure` is inverse in meaning: higher values represent more exposure. Projections must normalize direction before calculating composite health.

## 4. Metric definitions

### Schedule health

Represents confidence that time objectives and major milestones can be achieved.

### Cost health

Represents forecast stability, financial control, and confidence in available funding.

### Scope stability

Represents clarity, control, and alignment around approved scope and change.

### Quality confidence

Represents confidence that outputs meet acceptance, usability, and fitness-for-purpose expectations.

### Risk exposure

Represents aggregate probability-impact exposure after considering response effectiveness.

### Compliance confidence

Represents confidence that legal, regulatory, ethical, privacy, security, and governance obligations are understood and controlled.

### Stakeholder trust

Represents aggregate confidence and relationship health among key stakeholder groups.

### Team sustainability

Represents workload health, psychological safety, capability, cohesion, and burnout risk.

### Vendor confidence

Represents confidence in supplier performance, commercial alignment, and dependency control.

### Executive confidence

Represents sponsor and governance confidence in leadership, transparency, and outcome viability.

### Business value confidence

Represents confidence that intended benefits remain achievable and aligned to strategy.

## 5. Metric adjustment contract

```ts
interface MetricAdjustmentDefinition {
  adjustmentId: string;
  metricKey: keyof ProjectMetricState;
  delta: number;
  sourceType: string;
  sourceDefinitionId: string;
  rationale: string;
  visibility: "visible" | "explained_later" | "hidden";
  capPolicy?: "clamp" | "reject";
}
```

Application rule:

```text
result = clamp(current + delta, 0, 100)
```

All resulting values and source references must be persisted through events.

## 6. Composite project health

Composite health is a projection calculated from normalized metrics.

```text
normalizedRisk = 100 - riskExposure
composite = weightedAverage(
  scheduleHealth,
  costHealth,
  scopeStability,
  qualityConfidence,
  normalizedRisk,
  complianceConfidence,
  stakeholderTrust,
  teamSustainability,
  vendorConfidence,
  executiveConfidence,
  businessValueConfidence
)
```

Weights may vary by chapter but must be versioned and documented. No single composite score may hide a critical safety or compliance failure.

## 7. Critical overrides

The projected health classification must include critical overrides.

Examples:

- severe compliance breach
- unresolved safety hazard
- confirmed unethical conduct
- invalid benefits case
- unrecoverable delivery condition

A critical override can classify the project as critical even when the weighted composite is otherwise stable.

## 8. Metric interactions

Metric changes may cause secondary effects only through explicit, versioned rules.

Examples:

- prolonged low team sustainability may reduce quality confidence
- unresolved risk exposure may reduce schedule and executive confidence
- poor stakeholder trust may weaken business value confidence
- strong governance transparency may improve executive confidence while temporarily lowering schedule confidence

Secondary effects must be visible in the event chain and cannot be silently recalculated outside authoritative logic.

## 9. Threshold triggers

Suggested thresholds:

- warning crossing below 60
- severe crossing below 40
- critical crossing below 20
- strong crossing above 80

For risk exposure, warning and critical crossings move upward.

Each threshold trigger must fire only on crossing unless explicitly configured for recurring evaluation.

## 10. Learner-visible and hidden state

Visible:

- high-level project health
- trend direction
- key drivers
- critical alerts

Conditionally visible:

- stakeholder sentiment summaries
- vendor confidence indicators
- executive confidence details

Hidden or delayed:

- exact trigger thresholds
- future consequence eligibility
- some stakeholder coalition states

Hidden mechanics must remain pedagogically fair. Learners should receive enough evidence to make reasoned decisions.

## 11. Trend model

Each metric projection should expose:

- current value
- previous value
- net chapter change
- recent adjustment causes
- trend: improving, stable, deteriorating

Trend windows must be based on event sequence, not device time.

## 12. Metric provenance

Every adjustment must answer:

- what changed
- by how much
- why
- which action caused it
- when it applied
- whether it was immediate or delayed

This provenance supports coaching, replay, debugging, and learner feedback.

## 13. Relationship to assessment

A good project outcome does not automatically prove strong learner competence, and a difficult project outcome does not automatically prove weak competence.

Assessment evaluates:

- reasoning quality
- evidence use
- governance judgment
- ethical behavior
- stakeholder leadership
- adaptability

Project metrics evaluate simulated project conditions.

## 14. Ending inputs

Ending determination may use:

- final metric bands
- critical overrides
- unresolved risks and issues
- stakeholder relationship states
- benefits readiness
- decision quality pattern
- recovery effectiveness

Ending rules must reference evidence, not only the composite score.

## 15. Validation rules

- every metric stays within 0–100
- every delta has a unique application ID
- duplicate events cannot duplicate deltas
- inverse metrics are normalized consistently
- critical overrides are explicit
- projections expose the same metric state across all surfaces
- replay reproduces the same metric history

## 16. Acceptance criteria

This specification is complete when all Phase 2 consequences map to valid metric effects or explicitly state that they have no metric effect, all threshold-driven narrative triggers are represented, and project health can be reconstructed from the authoritative event history.
