# BC-007 — Decision Fairness and Evidence Review

## 1. Coverage

All **37** required Northstar decisions reviewed for prompt clarity, option distinction, pre-decision evidence, consequence mapping, and experience-level presentation.

## 2. Evidence-before-decision

- Every required decision retains `requiredEvidence` with `requiredForEligibility: true`.
- BC-003 layer 6 continues to reject hidden-section evidence gates.
- Regression: `content-quality-audit.test.ts` asserts required evidence presence.

## 3. Informational vs decision-bearing Inbox

- Chapter One context messages (sponsor welcome, operations pressure, privacy caution, analyst incomplete evidence) set `informationalOnly: true` and `requiresResponse: false`.
- `classifyInboxMessage` keeps them informational; they do not inflate Mission Control pending decisions.
- `relatedDecisionId` retained as navigational context only.

## 4. Decision-link alignment

| Message | Linked decision | Resolution |
|---|---|---|
| `message.c3.scope-interpretation-conflict` | `decision.northstar.chapter-03.integration-assumption-failure` | Message subject/body rewritten to match integration-assumption situation (stable IDs preserved) |
| `message.c3.executive-compress-remediation` | `decision.northstar.chapter-03.executive-status-position` | Confirmed coherent; catalog shorthand noted in defect log |

## 5. Option quality

- Options remain meaningfully distinct within each decision.
- Cross-decision reuse of short labels (“Defer”, “Reject”) retained where context makes meaning clear; not treated as duplicate options inside a single decision.
- No answer-key wording in option labels.

## 6. Ending fairness

Discriminative `eligibleWhen` conditions authored on Chapter Six options.
Selection runs during `CompleteChapter` **before** chapter-06 is marked
completed, so gates use `decision_status=resolved` on
`decision.northstar.chapter-06.final-closure-recommendation` rather than
`chapter_status=completed`.

| Ending | Primary observable conditions |
|---|---|
| E1 | recommend-closure + distinguish benefits + full acceptance |
| E2 | conditional-closure + distinguish benefits + coordinated incident response |
| E3 | conditional-closure + distinguish benefits |
| E4 | weak benefits posture + closure recommend/conditional |
| E5 | defer-closure + pause/restrict deployment |
| E6 | report forecast as realized |
| E7 | continue deployment + vendor-led incident response |
| E8 | defer-closure |
| E9 | final-closure resolved (catch-all) |

Strong harness path → **E2**. Adverse harness path → **E9**. Experience levels share ending rules for equivalent actions.

## 7. Consequence clarity

- Immediate consequences remain option-selected and proportionate (±1 metric deltas).
- Learner feedback strings now include decision title + chosen label (less generic template).
- Delayed consequences (3) retain authored triggers; no premature disclosure.
