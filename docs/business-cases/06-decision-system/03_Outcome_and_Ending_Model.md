# BC-006 Phase 2 — Outcome and Ending Model

**Status:** Draft for implementation  
**Parent issue:** BC-006 — Complete Northstar Flagship Simulation (#81)  
**Scope:** Canonical outcome states, cumulative ending profiles, and closure eligibility for Northstar Connected Care.

---

## 1. Purpose

This document defines how individual decision outcomes accumulate into project-health states, chapter exits, deployment results, and final learner endings. The simulation must support multiple credible outcomes rather than one perfect path.

---

## 2. Outcome Model

Each resolved decision produces:

- a stable decision outcome record;
- a learner-safe public summary;
- immediate consequences;
- optional delayed consequences;
- competency evidence;
- project-state effects;
- stakeholder and learning signals.

Outcomes are immutable after resolution and remain pinned to the resolver version used at the time of submission.

---

## 3. Outcome Quality Bands

Decision outcomes may be categorized for assessment as:

- **exemplary** — integrated, ethical, evidence-based, and well governed;
- **effective** — defensible with manageable trade-offs;
- **mixed** — partially effective with material omissions or avoidable exposure;
- **weak** — poorly supported, narrowly optimized, or inadequately governed;
- **critical failure** — unsafe, unethical, unauthorized, or materially misleading.

These bands support learning and scoring but do not replace the authored consequences for each option.

---

## 4. Chapter Exit States

### Chapter One

- authorized with strong alignment;
- authorized with unresolved assumptions;
- authorized under sponsor pressure;
- planning entry with weak governance.

### Chapter Two

- baseline approved;
- baseline approved with conditions;
- baseline deferred for remediation;
- baseline rejected with required recovery work.

### Chapter Three

- first deliverable accepted;
- conditionally accepted;
- rejected and remediated;
- executive escalation required.

### Chapter Four

- recovery approved;
- recovery approved with constraints;
- partial recovery authorized;
- revised plan required;
- executive intervention imposed.

### Chapter Five

- full deployment authorized;
- phased deployment authorized;
- conditional limited deployment;
- deployment postponed;
- deployment authorized with explicit risk acceptance.

### Chapter Six

- project closed successfully;
- project closed with transferred obligations;
- project conditionally closed;
- closure deferred;
- project stopped after controlled failure;
- project closed administratively but value remains at risk.

---

## 5. Final Ending Profiles

### E1 — Sustainable Value Delivered

The solution is deployed responsibly, operations accepts ownership, benefits accountability is established, stakeholder trust is strong, and residual obligations are controlled.

### E2 — Successful but Hard-Won Recovery

The project experiences material disruption but recovers through transparent leadership, disciplined governance, and controlled trade-offs. Some benefits are delayed, but the operating model is sustainable.

### E3 — Conditional Success

Core capabilities are delivered, but adoption, benefits, vendor, or operational obligations remain. Closure is defensible only because ownership and governance are explicit.

### E4 — Technical Delivery, Weak Adoption

The platform is deployed, but workflow acceptance, training effectiveness, or frontline trust is weak. Benefits remain at risk and support demand is elevated.

### E5 — Controlled Delay Protects Value

The learner postpones or phases deployment because readiness or safety thresholds are not met. Near-term executive satisfaction declines, but avoidable operational harm is prevented.

### E6 — Governance and Credibility Breakdown

Unsupported commitments, hidden risk, weak change control, or inconsistent reporting lead to executive intervention and reduced learner authority.

### E7 — Operationally Unstable Transition

Deployment proceeds without adequate ownership, support, or readiness. The project may technically close, but incidents, unresolved obligations, and stakeholder distrust remain.

### E8 — Responsible Stop or Redirection

The learner recommends stopping or materially redirecting an unsustainable component. The project does not meet its original plan, but value, ethics, and organizational learning are protected.

### E9 — Administrative Closure Without Value Assurance

Records and contracts are closed, but benefits ownership, residual risk, or operational accountability is incomplete. This ending is formally complete but professionally weak.

---

## 6. Ending Eligibility Dimensions

Ending selection must use authoritative cumulative state across:

- delivered capability;
- benefits confidence;
- schedule and cost performance;
- quality and compliance;
- operational readiness;
- adoption readiness;
- stakeholder trust;
- executive confidence;
- vendor performance;
- governance integrity;
- team sustainability;
- closure completeness;
- residual obligation ownership.

No ending should be selected from a single score alone.

---

## 7. Ending Selection Rules

1. Safety, compliance, and ethical violations may override otherwise positive delivery metrics.
2. Strong schedule performance cannot compensate fully for hidden risk or unsupported acceptance.
3. Delayed or phased delivery may qualify as a strong ending when it protects sustainable value.
4. Benefits must be distinguished as realized, emerging, forecast, or at risk.
5. Closure requires accepted ownership for every continuing obligation.
6. Stakeholder trust changes the narrative and coaching summary but does not replace objective evidence.
7. The ending resolver must be deterministic and versioned.
8. Learners may receive the same ending profile through different paths, but the explanation must reference their actual decisions and consequences.

---

## 8. Replay and Branching

- Completed runs preserve their original content and resolver versions.
- Replaying the same case creates a new simulation run.
- Historical decisions and outcomes are never overwritten.
- Experience-level changes require a new run unless an explicit migration policy is approved.
- Branch conditions may change evidence, tone, severity, and option availability, but not rewrite prior history.
- A replay may expose alternate paths without revealing hidden answers from the prior run by default.

---

## 9. Learner Final Report

The final report should include:

- ending profile;
- project outcome narrative;
- major decisions that shaped the result;
- strongest competencies;
- development areas;
- stakeholder and governance summary;
- value and benefits status;
- quality, risk, and readiness summary;
- lessons transferred to practice;
- recommended next learning focus.

The report must not expose secret weights, hidden consequences, or unavailable alternate endings.

---

## 10. Validation Requirements

- every ending is reachable through at least one valid path;
- no ending depends on UI-local state;
- critical safety and compliance states are represented;
- responsible delay and responsible stop are not treated automatically as failure;
- benefits and capability delivery remain distinct;
- closure obligations are traceable;
- ending selection is deterministic and versioned;
- final explanations are generated from authoritative history;
- outcome profiles remain compatible with Explorer, Practitioner, and Leader modes.
