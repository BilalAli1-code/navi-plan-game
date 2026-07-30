# BC-007 — Content Defect Log

| ID | Severity | Category | Chapter | Canonical IDs | Description | Resolution | Regression | Status |
|---|---|---|---|---|---|---|---|---|
| BC007-ENDING-001 | critical | ending coherence | 6 | `outcome.ending-e1`…`e9` | All endings used `eligibleWhen: always`, so rank always selected E1 | Authored discriminative Chapter Six option conditions; E9 catch-all | `final-ending.test.ts`, W7 six-chapter tests, content-quality audit | resolved |
| BC007-SPOILER-001 | major | information boundaries | 1–6 | chapter `learnerGuidance.leader`, Ch1 prompts/rubric, ending reflection | Learner-facing text referenced crisis severity, ending credibility, scoring hints | Reworded guidance/prompts/notes | content-quality spoiler test | resolved |
| BC007-DECISION-001 | major | Inbox coherence | 3 | `message.c3.scope-interpretation-conflict` | Message described scope dispute but linked to integration-assumption decision | Aligned message subject/body to linked decision; stable IDs preserved | content-quality audit test | resolved |
| BC007-STAKEHOLDER-001 | blocker (doc) | stakeholder consistency | all | core roster | Story Arcs §4 used wrong names/titles vs Bible/fixtures | Corrected §4 + authority banner; fixtures portrait/role alignment | inventory doc + package roster test path | resolved |
| BC007-TIMELINE-001 | critical | chronology | all | timeline doc | Timeline said ~10 months; Bible/package say nine-month | Timeline reconciled to nine-month representation | review evidence | resolved |
| BC007-NARRATIVE-001 | major | narrative | 5 | chapter-05 title | Chapter Five doc titled “Stabilization and Adoption” vs blueprint “Delivery and Readiness” | Doc H1/identity updated | review evidence | resolved |
| BC007-FINANCE-001 | enhancement | financial | 1 | budget docs | Verify $4.8M / $480K / $3.2M consistency | Confirmed consistent; no content change | inventory | resolved (no defect) |
| BC007-ASSESSMENT-001 | minor | Inbox / assessment | 1 | Ch1 informational messages | Catalog informational items had `informationalOnly: false` | Set `informationalOnly: true` | content-quality audit test | resolved |
| BC007-CONSEQUENCE-001 | major | consequence clarity | 2–6 | built consequences | Generic “Stakeholders react…” feedback for most options | Feedback includes decision title + option label | builders + package tests | resolved |
| BC007-TRACE-001 | major | traceability | bible | decision/ending counts | Content Bible still said 19 decisions / 6 endings | Bible counts updated to 37 decisions / 9 endings with BC-006 expansion note | review evidence | resolved |
| BC007-DUPLICATE-001 | minor | duplication | 2–6 | documents | Shared document boilerplate suffix common across many docs | Accepted limitation; not deleted (continuity/reinforcement) | audit duplicate candidates | accepted limitation |
| BC007-WORKLOAD-001 | minor | workload | 5–6 | docs/activities | Heavy late-chapter reading volume from supporting docs | Documented; no invented cuts of required evidence | workload audit band | accepted limitation |
| BC007-ASSESSMENT-002 | accepted limitation | assessment | all | XP / mastery | XP amounts and mastery thresholds not authored | Remain unavailable honestly | W6/W7 learning tests | accepted limitation |

## Severity summary

| Severity | Discovered | Resolved | Open blockers |
|---|---:|---:|---:|
| blocker | 1 | 1 | 0 |
| critical | 2 | 2 | 0 |
| major | 5 | 5 | 0 |
| minor | 2 | 1 | 0 (1 accepted limitation) |
| enhancement | 1 | 1 | 0 |
| accepted limitation | 2 | n/a | documented |
