# BC-006 Workstream 7 — Integrated Validation Matrix

## Status
Executed (2026-07-29)

## Purpose
Executable evidence map for Northstar Connected Care `1.0.0` release readiness.

## Legend
- **pass** — executable evidence green
- **pass-with-limitation** — behavior honest and gated; content/product limitation documented
- **deferred** — not a release blocker; ownership recorded

| ID | Requirement | Source | Layer | Evidence | Expected | Actual | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| V-CONTENT-001 | Northstar package valid/selectable | content validate | CLI | `pnpm run content:validate -- --case northstar-connected-care --version 1.0.0` | passed | passed | pass | |
| V-CONTENT-002 | Harbor package valid/selectable | content validate | CLI | Harbor validate + catalog | passed | passed | pass | |
| V-E2E-001 | Strong six-chapter path | 01_End_to_End_Validation | API | `bc006-w7-northstar-six-chapter.test.ts` | chapters 1–6 + completed run | green | pass | harness uses mid-option script |
| V-E2E-002 | Adverse six-chapter path | 01_End_to_End_Validation | API | same file (adverse profile) | completed run | green | pass | ending still E1 until discriminative eligibleWhen authored |
| V-E2E-003 | Explorer/Practitioner/Leader parity | W6/W7 | API | same file (levels) | same ending, completed | green | pass | presentation/coaching may differ |
| V-END-001 | Final ending deterministic | Outcome model | Domain/API | `final-ending.test.ts` + six-chapter | ending-resolver/v1 | E1 selected | pass-with-limitation | E1–E9 currently `eligibleWhen: always` |
| V-ADVANCE-001 | Next-chapter workplace init | W7 defect | Application | CompleteChapter → initializeChapterFromContent | chapter N+1 seeded | green | pass | DEF-W7-001 |
| V-LEARN-001 | XP unavailable honesty | W6 | API | achievements/mastery projections | unavailable / xp_amounts_not_authored | green | pass | |
| V-LEARN-002 | Mastery bands unavailable honesty | W6 | API | mastery projection | unavailable / mastery_thresholds_not_authored | green | pass | |
| V-LEARN-003 | Achievements once-per-run | W6 | API | closure-steward awarded | awarded | green | pass | |
| V-PROJ-001 | Full projection family readable | W5/W6 | API | WORKPLACE_PROJECTION_TYPES GETs | 200 + no hidden leaks | green | pass | |
| V-CH1-001 | Chapter One regression | BC-005 | API | bc005 + vertical-slice | green | green | pass | pendingDecisions >0 after advance |
| V-REPLAY-001 | Domain serialize/reload engine | W4 | Domain | bc006-w4-simulation-engine.test.ts | green | green | pass | |
| V-PG-001 | Postgres RLS/convergence | PS-024 | Infra | workplace-convergence.integration.test.ts | green when DB set | green | pass | env-gated |
| V-SEC-001 | Hidden-content negative asserts | W7 | API | six-chapter leak markers | absent | green | pass | |
| V-A11Y-001 | Workplace axe (Activities) | W5 | Playwright | workplace.convergence.happy | no serious/critical | green | pass | |
| V-A11Y-002 | Learning surfaces keyboard/semantics | W6/W7 | Web/CSS | Achievements/Mastery/Coaching pages | live regions + reduced-motion | green | pass | automated axe on learning pages: add-on suite |
| V-PERF-001 | Six-chapter duration budget | W7 | API | elapsedMs < 120s in-memory | <120s | ~0.5–1s | pass | local API harness, not production SLO |
| V-OPS-001 | Health/migrate/relay docs | AGENTS | Docs | AGENTS + scripts | documented | documented | pass | |

## Defects resolved in W7

| ID | Severity | Summary | Fix | Regression |
| --- | --- | --- | --- | --- |
| DEF-W7-001 | blocker | Next chapter workplace content never initialized after CompleteChapter | `completeChapterFromContent` calls `initializeChapterFromContent`; chapter-scoped init command IDs | six-chapter harness + vertical-slice expectations |
| DEF-W7-002 | critical | Final ending selection missing | `selectFinalEnding` (`ending-resolver/v1`) + run complete on chapter 6 | `final-ending.test.ts` + six-chapter |
| DEF-W7-003 | major | Chapter One suite assumed zero pending decisions after complete | update expectations for chapter-02 eligibility | vertical-slice + postgres path |
| DEF-W7-004 | blocker | Catalog metric deltas exceeded [0,100] on full path | reduce `buildDecision` metric deltas | six-chapter strong/adverse |

## Accepted limitations

1. XP amounts not authored → unavailable.
2. Mastery band thresholds not authored → unavailable.
3. Ending profiles E1–E9 use `eligibleWhen: always` → rank selects E1 until content authors discriminative conditions.
4. Free-text reflection persistence / separate practice-attempt model / AcknowledgeCoaching deferred.
5. Manual assistive-technology validation not performed in this environment.
6. Load testing is local harness timing only — not a production capacity claim.
