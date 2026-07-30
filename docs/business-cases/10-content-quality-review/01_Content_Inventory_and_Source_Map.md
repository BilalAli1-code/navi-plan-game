# BC-007 — Content Inventory and Source Map

## 1. Executable package inventory (`northstar-connected-care@1.0.0`)

| Entity | Count |
|---|---:|
| Chapters | 6 |
| Stakeholders | 22 |
| Meetings | 32 |
| Inbox messages | 62 |
| Documents | 92 |
| Activities | 72 |
| Decisions | 37 |
| Options | 167 |
| Immediate consequences | 167 |
| Delayed consequences | 3 |
| Crises | 2 |
| Competencies | 11 |
| Coaching interventions | 18 |
| Achievements | 8 |
| Outcomes / endings | 10 (1 chapter outcome + E1–E9) |
| Traceability records | 713 |
| Manifest estimated minutes | 600 |
| Learning days | 10 |

### Per-chapter required work

| Chapter | Title | Required decisions | Required activities |
|---|---|---:|---:|
| chapter-01 | The Access Problem | 3 | 6 |
| chapter-02 | Planning | 6 | 13 |
| chapter-03 | Early Execution | 6 | 9 |
| chapter-04 | Mid-Project Recovery | 7 | 12 |
| chapter-05 | Delivery and Readiness | 7 | 14 |
| chapter-06 | Closure and Benefits Realization | 8 | 18 |

## 2. Canonical stakeholder roster (authoritative)

Source: Content Bible + fixtures (`northstar-chapter-one.ts`, `northstar-stakeholders.ts`).

| ID | Name | Role |
|---|---|---|
| stakeholder.sponsor | Elena Marquez | Executive Sponsor and Chief Operating Officer |
| stakeholder.program-director | Marcus Reed | Program Director, Strategic Transformation |
| stakeholder.operations | Renee Wallace | Vice President of Patient Access |
| stakeholder.clinical | Priya Shah | Chief Medical Officer |
| stakeholder.technology | Jordan Kim | Chief Information Officer |
| stakeholder.privacy | Aisha Bennett | Chief Privacy and Compliance Officer |
| stakeholder.finance | Thomas Grant | Chief Financial Officer |
| stakeholder.patient-experience | Sofia Nguyen | Director of Patient Experience |
| stakeholder.vendor | Maya Chen | Vendor Engagement Lead |
| stakeholder.analyst | Nia Brooks | Project Business Analyst |
| stakeholder.pmo | Jordan Alvarez | PMO Lead |
| stakeholder.change-lead | Camila Ortiz | Change and Adoption Lead |
| stakeholder.site-leader | David Nguyen | Regional Clinic Operations Director |
| stakeholder.benefits-owner | Laura Simmons | Benefits Realization Manager |
| stakeholder.quality | Dr. James Whitfield | Quality and Regulatory Lead |
| stakeholder.steering-secretariat | Patricia Cole | Steering Committee Secretariat |
| stakeholder.support-lead | Andre Williams | IT Service Management Lead |
| stakeholder.delivery-lead | Hannah Brooks | Integrated Delivery Lead |
| stakeholder.business-owner | Rachel Kim | Connected Care Product Owner |
| stakeholder.frontline-manager | Tony Martinez | Call Center Operations Manager |
| stakeholder.procurement | Diane Foster | Procurement Manager |
| stakeholder.incident-lead | Chris Palmer | Incident Governance Lead |

## 3. Source map

| Concern | Primary source | Executable source |
|---|---|---|
| Learning structure / workload | `00_Simulation_Design_Blueprint.md`, `00_Full_Simulation_Blueprint.md` | `northstar.ts` manifest |
| Business world | `01_Business_Case_Content_Bible.md` | chapter fixtures + catalogs |
| Chapters 2–6 narrative | `05-full-northstar-simulation/*` | `northstar-chapter-*.ts`, `northstar-chapter-catalogs.ts` |
| Decisions / endings | `06-decision-system/*` | decisions + `northstar-shared.ts` outcomes |
| Learning / assessment honesty | `08-learning-experience/*`, AGENTS W6 | assessment, achievements, coaching contracts |
| Integrated path proof | W7 matrix / recommendation | `bc006-w7-northstar-six-chapter.test.ts` |

## 4. Quantitative claims (reconciled)

| Claim | Value | Status |
|---|---|---|
| Transformation budget | $4.8 million | Consistent across Bible, manifest, Ch1 docs |
| Contingency | $480K | Consistent |
| Annual value after stabilization | $3.2M | Consistent in Initial Business Case |
| Project duration | Nine months | Bible + package; timeline corrected in BC-007 |
| Learning duration | 10 hours / 600 minutes / 10 days | Blueprint + package |
