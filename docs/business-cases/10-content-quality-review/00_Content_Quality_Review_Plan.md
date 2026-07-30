# BC-007 — Content Quality Review Plan

**Status:** Complete for review
**Roadmap item:** BC-007
**Package under review:** `northstar-connected-care@1.0.0`
**Prerequisite:** BC-006 Workstream 7 merged (`d679202`) with verdict **BC-006 READY FOR FINAL REVIEW**

## 1. Objective

Conduct a rigorous content-quality review of the complete six-chapter Northstar Connected Care flagship simulation and resolve blocking educational, narrative, business, evidence, workload, and assessment defects.

## 2. Authority order

When sources differ:

1. Current `AGENTS.md`
2. Accepted roadmap and architecture decisions
3. Approved Simulation Design Blueprint
4. Approved Content Bible
5. Accepted BC-006 canonical catalogs and specifications
6. Merged executable Northstar content package
7. Merged BC-006 validation evidence
8. Older aspirational or superseded text

## 3. Review categories

Narrative · chronology · business logic · financial consistency · stakeholder consistency · meeting coherence · Inbox coherence · document coherence · activity coherence · decision evidence · decision fairness · option quality · consequence clarity · crisis coherence · ending coherence · duplication · information boundaries · learner workload · assessment validity · competency mapping · coaching relevance · achievement fairness · experience-level suitability · traceability

## 4. Out of scope

- New platform architecture, command/event models, projections, or engine behavior
- Broad UI / Lovable refinement (BC-008)
- Production-readiness certification (REL-001)
- Invented XP values or mastery thresholds
- New reflection or practice-attempt subsystems

## 5. Evidence artifacts

| Artifact | Path |
|---|---|
| Inventory and source map | `01_Content_Inventory_and_Source_Map.md` |
| Narrative and business consistency | `02_Narrative_and_Business_Consistency_Review.md` |
| Decision fairness and evidence | `03_Decision_Fairness_and_Evidence_Review.md` |
| Workload and assessment | `04_Learner_Workload_and_Assessment_Review.md` |
| Defect log | `05_Content_Defect_Log.md` |
| Review evidence | `06_BC007_Review_Evidence.md` |
| Signoff recommendation | `07_BC007_Signoff_Recommendation.md` |

## 6. Automated regression

- `auditContentQuality()` in `@projectsim/domain`
- `packages/domain/src/simulation/content/business-case/content-quality-audit.test.ts`
- Existing `pnpm content:validate` / catalog validation / W7 six-chapter harness
