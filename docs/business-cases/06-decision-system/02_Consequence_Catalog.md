# BC-006 Phase 2 — Consequence Catalog

**Status:** Draft for implementation  
**Parent issue:** BC-006 — Complete Northstar Flagship Simulation (#81)  
**Scope:** Canonical immediate and delayed consequence model for Northstar Connected Care.

---

## 1. Purpose

This document defines how authoritative decisions change project state, stakeholder relationships, future event availability, metrics, narrative tone, and ending eligibility. Consequences must be deterministic, authored, ordered, versioned, idempotent, and traceable to the originating decision record.

---

## 2. Consequence Rules

Every consequence definition must include:

- stable consequence definition ID;
- originating decision and option;
- resolver version;
- immediate or delayed timing;
- deterministic authored order;
- affected metric or state transition;
- stakeholder signal where applicable;
- future event or evidence effect;
- learner-safe public summary;
- hidden implementation detail boundary;
- replay and idempotency behavior.

Historical consequences are immutable after resolution. Later corrections must be represented as new compensating records.

---

## 3. Identifier Pattern

Use:

`consequence.northstar.chapter-XX.<decision-name>.<effect-name>`

Delayed schedule instructions use:

`schedule.northstar.chapter-XX.<effect-name>`

---

## 4. Consequence Categories

### 4.1 Metric changes

Possible affected metrics include:

- schedule confidence;
- budget confidence;
- scope stability;
- quality confidence;
- compliance confidence;
- operational readiness;
- vendor confidence;
- team sustainability;
- stakeholder trust;
- executive confidence;
- governance integrity;
- adoption readiness;
- business-value confidence.

All changes must respect authoritative metric bounds and fail closed when authored deltas exceed permitted ranges.

### 4.2 Project-state transitions

Examples:

- planning baseline approved;
- first deliverable conditionally accepted;
- recovery required;
- recovery approved;
- deployment authorized;
- deployment paused;
- hypercare extended;
- project conditionally accepted;
- project closed.

### 4.3 Stakeholder effects

Consequences may emit stakeholder signals for later relationship processing, including:

- trust increase or decline;
- confidence increase or decline;
- escalation likelihood;
- collaboration posture;
- resistance intensity;
- sponsor support;
- vendor defensiveness;
- frontline adoption support.

Core Simulation emits signals and does not directly mutate a separate stakeholder aggregate.

### 4.4 Narrative and event effects

Consequences may:

- unlock or suppress messages;
- alter message tone;
- unlock meetings;
- create required activities;
- expose evidence;
- activate risks or issues;
- change available decision options;
- alter future severity;
- affect ending eligibility.

---

## 5. Chapter One Consequence Families

### C1.A — Objective Framing

A technology-speed objective may increase sponsor confidence immediately but reduce clinical, privacy, and adoption confidence later.

A patient-access or balanced-value objective improves outcome clarity and stakeholder alignment but may reduce perceived speed.

### C1.B — Delivery Approach

Predictive selection may improve early schedule clarity while increasing rework risk under evolving requirements.

Adaptive selection may improve learning and stakeholder feedback while creating governance concerns in regulated or contract-heavy work.

Hybrid selection may improve tailoring but only when decision rights, stage gates, and integration points are explicit.

### C1.C — Governance

Cross-functional governance improves shared accountability but may increase meeting load.

Sponsor-led governance increases speed but raises escalation dependency and weakens distributed ownership.

---

## 6. Chapter Two Consequence Families

### C2.A — Scope Baseline

Weak scope boundaries increase Chapter Three rework and Chapter Four change pressure.

Phased or controlled-elaboration scope may preserve adaptability while requiring stronger governance.

### C2.B — Launch Commitment

Unsupported fixed dates increase later schedule variance, executive disappointment, and pressure to hide bad news.

Evidence-based ranges preserve credibility but may reduce short-term executive enthusiasm.

### C2.C — Quality and Acceptance

Weak criteria increase later defect disputes and conditional acceptance complexity.

Strong integrated criteria improve quality confidence but increase near-term planning effort.

### C2.D — Vendor Responsibility

Ambiguous boundaries increase dispute likelihood, cost exposure, and final claims.

Documented shared responsibility improves coordination but may expose previously hidden internal obligations.

---

## 7. Chapter Three Consequence Families

### C3.A — Vendor Mobilization

Accepting an unqualified substitution may preserve schedule optics while increasing capability and quality risk.

A corrective plan may delay mobilization but improve accountability and evidence.

### C3.B — Clinical Participation

Ignoring availability constraints increases workflow defects and adoption resistance.

Tailored engagement improves decision quality but may require schedule adjustment.

### C3.C — Integration Failure

Absorbing impact without change control reduces short-term friction but weakens budget and schedule credibility.

Formal re-planning improves traceability while exposing variance.

### C3.D — Deliverable Acceptance

Premature acceptance increases downstream defect and closure exposure.

Conditional acceptance creates explicit remediation obligations.

Rejection protects quality but may materially reduce schedule confidence.

---

## 8. Chapter Four Consequence Families

### C4.A — Containment

No containment increases deterioration severity.

Targeted containment protects quality and compliance but may increase schedule impact.

### C4.B — Vendor Recovery

Fair, evidence-based corrective action may preserve the relationship while strengthening accountability.

Unsupported blame increases vendor defensiveness and commercial escalation.

### C4.C — Compliance Protection

Rejecting unsafe shortcuts improves compliance and governance integrity but may reduce executive confidence in the delivery date.

Ignoring material concerns may unlock severe Chapter Five readiness barriers.

### C4.D — Change Control

Unauthorized baseline changes create governance violations and unreliable forecasts.

Approved phased change may protect value while increasing complexity.

### C4.E — Recovery Strategy

Every recovery strategy must contain trade-offs. No option may improve schedule, cost, scope, quality, risk, and trust simultaneously.

---

## 9. Chapter Five Consequence Families

### C5.A — Recovery Reporting

Overstated recovery creates later trust loss when evidence contradicts the message.

Balanced reporting preserves credibility and may unlock executive support.

### C5.B — Readiness Segmentation

Enterprise averages may conceal local failure risk.

Segmented readiness improves decision quality but may complicate deployment governance.

### C5.C — Defect Disposition

Misclassified release blockers create operational exposure or unnecessary delay.

Properly governed residual-risk acceptance preserves traceability.

### C5.D — Adoption Response

Dismissed resistance reduces training effectiveness and increases support demand.

Consultation and targeted redesign improve readiness but may alter scope or schedule.

### C5.E — Deployment Strategy

Full deployment maximizes speed and benefit opportunity but increases exposure when readiness is uneven.

Phased or pilot-first strategies reduce blast radius while delaying enterprise value.

Postponement protects operations when thresholds are not met but reduces sponsor confidence and may consume contingency.

---

## 10. Chapter Six Consequence Families

### C6.A — Incident Response

Delayed escalation increases operational impact and trust damage.

Proportionate containment preserves evidence and stakeholder confidence.

### C6.B — Continue, Pause, or Roll Back

Continuation may preserve momentum but increase exposure.

Pause or rollback protects operations but increases cost, schedule, and reputational impact.

### C6.C — Hypercare Exit

Premature exit transfers instability to operations.

Unnecessary extension consumes resources and delays closure.

### C6.D — Acceptance

Improper acceptance weakens contractual leverage and hides obligations.

Conditional acceptance preserves progress while retaining explicit follow-up governance.

### C6.E — Benefits Reporting

Reporting forecast value as realized value damages credibility.

Transparent benefit ownership supports responsible closure.

### C6.F — Final Closure

Premature closure creates orphaned obligations.

Delayed closure without cause wastes capacity and reduces governance confidence.

---

## 11. Delayed Consequence Chains

Required cross-chapter chains include:

1. weak Chapter One governance → Chapter Two ownership ambiguity → Chapter Three communication failure → Chapter Four recovery delay;
2. unsupported Chapter Two launch commitment → Chapter Three optimistic reporting → Chapter Four executive escalation → Chapter Five readiness pressure;
3. weak Chapter Two acceptance criteria → Chapter Three conditional acceptance → Chapter Five defect dispute → Chapter Six acceptance complexity;
4. poor stakeholder engagement → Chapter Four resistance → Chapter Five adoption weakness → Chapter Six support demand;
5. ambiguous vendor obligations → Chapter Four commercial tension → Chapter Five support dispute → Chapter Six final claim;
6. strong risk and governance discipline → faster recovery, better readiness evidence, and stronger closure credibility.

Each link must retain originating decision identity and resolver version.

---

## 12. Idempotency and Ordering

- One resolved decision applies its consequence definitions once.
- Consequences apply in deterministic authored order.
- Reprocessing does not duplicate effects or advance state versions.
- Delayed schedule instructions do not immediately mutate future state.
- Event delivery may be at-least-once, but authoritative effect application remains exactly once by logical identity.

---

## 13. Learner-Facing Disclosure

Learners may see:

- concise outcome summaries;
- visible metric changes where educationally appropriate;
- stakeholder reactions;
- unlocked or changed workplace items;
- delayed effects when they materialize.

Learners must not see:

- hidden consequence definitions;
- resolver internals;
- future unreleased events;
- secret scoring weights;
- infrastructure receipts or outbox metadata.

---

## 14. Validation Requirements

The catalog is complete only when:

- every decision option maps to at least one outcome and consequence set;
- every delayed effect has a source and release condition;
- no consequence bypasses Domain invariants;
- no option is universally positive;
- metric changes remain bounded;
- stakeholder effects are emitted as signals;
- hidden content remains hidden;
- replay is deterministic;
- cross-chapter chains are traceable;
- all consequence IDs are unique and immutable.
