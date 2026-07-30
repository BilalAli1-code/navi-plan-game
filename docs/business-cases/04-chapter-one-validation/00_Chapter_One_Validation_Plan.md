# BC-005 — Chapter One Validation Plan

**Document ID:** BC-005  
**Version:** 0.1  
**Status:** Ready for execution  
**Business case:** `northstar-connected-care`  
**Content version:** `1.0.0`  
**Chapter:** `chapter-01` — The Access Problem  
**Related issue:** #78  
**Predecessor:** BC-004 / PR #75  
**Repository location:** `docs/business-cases/04-chapter-one-validation/00_Chapter_One_Validation_Plan.md`

---

## 1. Purpose

BC-005 proves that Northstar Chapter One is coherent, understandable, accessible, responsive, deterministic, durable, duplicate-free, correctly ordered, and operational through the complete ProjectSim production path.

BC-005 is a validation and defect-resolution milestone. It does not expand the flagship case into Chapters Two through Six and does not perform the final experience redesign reserved for BC-008.

BC-006 may not begin until all BC-005 blocking defects are resolved and the final validation evidence is approved.

---

## 2. Governing Sources

Validation must remain consistent with:

- `docs/02-business-case-and-release-roadmap.md`;
- `docs/business-cases/02-flagship-business-case/00_Simulation_Design_Blueprint.md`;
- `docs/business-cases/02-flagship-business-case/00_Case_Catalog_Manifest.md`;
- `docs/business-cases/02-flagship-business-case/01_Business_Case_Content_Bible.md`;
- `docs/business-cases/03-content-schema-and-validation/00_Content_Schema_and_Validation.md`;
- `AGENTS.md`;
- BC-004 implementation merged through PR #75;
- Issue #78.

BC-002 Issue #68 remains open. BC-005 validates the implemented Chapter One slice but does not claim that the complete six-chapter Content Bible is finished.

---

## 3. Validation Principles

1. Validate authoritative behavior, not only browser appearance.
2. Validate the complete command-to-Workplace path.
3. Treat projections as rebuildable read models, never authority.
4. Require deterministic results from the pinned content version.
5. Prove normal behavior and failure/recovery behavior.
6. Validate educational and narrative quality alongside technical correctness.
7. Use automated checks and documented manual review.
8. Fix defects before expanding scope.
9. Never use retries to conceal nondeterminism or flaky isolation.
10. Preserve case, version, tenant, learner, and Simulation Run boundaries.

---

## 4. Scope

### 4.1 Included

BC-005 validates:

- Business Case Catalog;
- Northstar case details;
- experience-level selection;
- Simulation Run creation and exact version pinning;
- Chapter One initialization;
- Mission Control;
- Inbox;
- Stakeholders;
- Documents;
- Meetings;
- Activities;
- Completed History;
- Notifications;
- three Chapter One decisions;
- Decision Log;
- project-health indicators;
- chapter progress and completion;
- chapter-ending notification/event;
- Chapter Two placeholder preparation;
- production composition and persistence;
- retry, refresh, catch-up, rebuild, and supported replay behavior;
- accessibility;
- responsive behavior;
- learner comprehension;
- narrative and assessment coherence;
- test reliability.

### 4.2 Excluded

BC-005 does not include:

- full Chapters Two through Six;
- completion of every BC-002 Content Bible requirement;
- Harbor Logistics as a complete learner experience;
- final visual redesign;
- production readiness certification;
- learner pilot execution;
- arbitrary AI-authored authoritative content;
- case-specific shared architecture or API routes.

---

## 5. Canonical Production Path

Every material Chapter One action must be validated through:

```text
Learner action or trusted initialization
→ Authoritative command envelope
→ Authorization and idempotency checks
→ Simulation Run aggregate
→ Domain events
→ Transactional outbox
→ Relay worker or supported catch-up path
→ Workplace projection rebuild and persistence
→ Learner-safe API response
→ Workplace UI convergence
```

Direct projection insertion, client-owned completion state, and browser-calculated authority are failures.

---

## 6. Validation Environments

### 6.1 Required production-equivalent environment

Use:

- PostgreSQL/Supabase persistence;
- `PROJECTSIM_API_COMPOSITION=postgres`;
- real migrations;
- tenant-scoped authorization;
- transactional outbox;
- relay worker or the approved deterministic relay test path;
- persisted Workplace projections;
- the real web application;
- the published Northstar package pinned to `1.0.0`.

### 6.2 Supported local/test environment

Memory composition may be used for focused unit and application tests. It may not substitute for the required PostgreSQL production-path proof.

### 6.3 Isolation requirements

Each test must use isolated:

- tenant IDs;
- learner/actor IDs;
- Simulation Run IDs;
- command IDs;
- idempotency keys;
- content-version references where applicable.

Cleanup must never truncate or delete unrelated concurrent test data.

---

## 7. Baseline Chapter One Inventory

The expected Chapter One inventory is:

| Area | Expected content |
| --- | --- |
| Business case | `northstar-connected-care@1.0.0` |
| Chapter | `chapter-01` — The Access Problem |
| Experience levels | Explorer, Practitioner, Leader |
| Stakeholders | sponsor, program director, operations, clinical, technology, privacy, finance, patient experience, vendor, analyst |
| Inbox | 5 messages, including 1 informational message |
| Documents | 6 evidence-bearing documents |
| Meeting | Connected Care Program Kickoff |
| Activities | 6 required activities |
| Decisions | 3 required decisions |
| Ending | Chapter One completion notification/event |
| Next chapter | Chapter Two placeholder only |

Any intentional inventory change requires an approved content revision and corresponding validation updates.

---

## 8. End-to-End Learner Journey

Validate this sequence:

1. Learner opens the catalog.
2. Catalog lists selectable published cases without hidden content.
3. Learner opens Northstar details.
4. Learner selects Explorer, Practitioner, or Leader.
5. Server creates a run pinned to Northstar and the exact content package version.
6. Chapter One initializes exactly once.
7. Learner enters Mission Control.
8. Learner reviews the program authorization and evidence documents.
9. Learner reviews Inbox and stakeholder information.
10. Learner starts and completes the kickoff meeting.
11. Learner completes required evidence and activity work.
12. Learner submits Decision 1 — Define the Initial Project Objective.
13. Learner submits Decision 2 — Select the Initial Delivery Approach.
14. Learner submits Decision 3 — Establish Early Governance and Stakeholder Engagement.
15. Immediate consequences converge across all affected surfaces.
16. Delayed consequences create deterministic schedule instructions.
17. Decision Log contains three unique completed entries.
18. Required reflection and remaining activities are completed.
19. Server validates chapter-completion requirements.
20. Chapter One completes exactly once.
21. Ending feedback is projected and displayed.
22. Refresh and resume preserve the same completed state.
23. Chapter Two appears only as an approved placeholder.

---

## 9. Execution Modes

The journey must pass under each applicable mode.

### 9.1 Normal

One deliberate request per learner action with successful relay and projection convergence.

### 9.2 Idempotent retry

Repeat the same request using the same command ID, idempotency key, and payload.

Expected result:

- no duplicate authoritative action;
- no duplicate Domain events beyond approved receipt behavior;
- no duplicate consequence application;
- no duplicate projection item;
- no version advancement for a previously accepted action.

### 9.3 Conflicting retry

Reuse a command ID or idempotency key with a changed payload.

Expected result: fail closed with the approved conflict or validation error.

### 9.4 Stale aggregate version

Submit with stale `If-Match` or expected aggregate version.

Expected result:

- command is not applied;
- learner receives an understandable error;
- browser refreshes authoritative projections;
- no automatic resubmission.

### 9.5 Refresh and resume

Refresh or reopen the browser after each major checkpoint.

Expected result: state is reconstructed from APIs and projections without duplicated or missing work.

### 9.6 Relay retry

Simulate at-least-once relay delivery or a failed projection target followed by retry.

Expected result:

- successful targets remain monotonic;
- failed targets retry independently where supported;
- no learner-visible duplication;
- authoritative state remains unchanged by projection failure.

### 9.7 Query-time catch-up

Allow a learner query to trigger an approved catch-up rebuild.

Expected result: the same semantic projection as relay-driven convergence.

### 9.8 Projection rebuild

Delete or invalidate disposable projections in an isolated environment and rebuild from authoritative state.

Expected result:

- identical learner-safe semantic content;
- correct order;
- no duplicate entries;
- same completion state;
- no hidden Domain information exposed.

### 9.9 Process restart

Restart API/worker processes between accepted actions where the test environment supports it.

Expected result: durable state, outbox records, and projections resume correctly.

### 9.10 Concurrent actions

Submit independent or conflicting learner actions concurrently.

Expected result:

- optimistic concurrency protects authority;
- accepted actions remain ordered and deterministic;
- conflicts fail safely;
- projections converge to authoritative state.

---

## 10. Narrative and Learning Validation

### 10.1 Narrative coherence

Confirm:

- Northstar, the Connected Care Access Program, and the learner role are introduced clearly;
- urgency does not obscure privacy, quality, adoption, and governance concerns;
- evidence and stakeholder tension progress logically;
- the kickoff meeting adds information rather than duplicating Inbox content;
- each decision follows from available evidence;
- the ending reflects the learner’s three decisions;
- Chapter Two preparation follows logically without exposing unimplemented content.

### 10.2 PMBOK Guide Eighth Edition alignment

Confirm Chapter One applies, rather than merely names:

- value delivery;
- stakeholders;
- governance;
- systems thinking;
- tailoring;
- accountability;
- uncertainty;
- evidence-based judgment;
- team leadership;
- responsible technology and AI use.

### 10.3 Decision quality

For each decision, verify:

- required evidence exists and is discoverable;
- no option is trivially or universally correct;
- trade-offs are understandable;
- scoring and competency signals align with the approved rubric;
- options and consequences remain consistent across experience levels;
- immediate and delayed consequences are explainable;
- learner-safe feedback does not expose hidden scoring internals.

### 10.4 Experience-level comprehension

Validate separately for Explorer, Practitioner, and Leader.

Explorer must receive sufficient terminology support, evidence prompts, and optional hints.

Practitioner must receive realistic ambiguity with limited guidance.

Leader must receive higher ambiguity and minimal prompting without missing required evidence.

The three modes must preserve core scoring and consequence integrity.

### 10.5 Information fairness

Confirm:

- required evidence can be found before commitment;
- hidden information is not used to create impossible penalties;
- APIs do not reveal hidden information prematurely;
- content does not retroactively invent facts;
- learner-visible explanations remain consistent with the business world.

---

## 11. Stakeholder Validation

For every Chapter One stakeholder, validate:

- learner-safe identity and role;
- approved motivation and concern;
- relationship to the project and other stakeholders;
- information boundary;
- chapter timing;
- response to the learner’s actions;
- persistence of messages and conversations;
- state-appropriate tone;
- no response based on unavailable or future information.

Stakeholder responses must remain consistent after refresh, retry, and projection rebuild.

AI-supported dialogue may express approved state but may not invent authoritative facts, decisions, scores, or consequences.

---

## 12. Duplicate and Ordering Validation

### 12.1 Duplicate checks

Prove that the following appear no more than once per authoritative identity:

- initialized stakeholders;
- Inbox messages;
- documents;
- notifications;
- activities;
- meetings;
- decision availability entries;
- completed Decision Log entries;
- consequence applications;
- delayed schedule instructions;
- chapter completion;
- chapter-ending notification/event;
- achievements or assessment signals when implemented.

### 12.2 Ordering checks

Validate:

- authored Chapter One initialization order;
- action sequence order;
- deterministic outbox insertion order;
- chronological and presentation ordering in each projection;
- Decision Log newest-first presentation with stable chronological sequence;
- completed-history ordering by completion sequence;
- ending event after all required completion actions;
- no later state regresses behind earlier state.

Do not assume `sequenceNumber` is globally unique per event. Event-level deduplication uses event identity.

---

## 13. Cross-Surface Convergence Matrix

For each action, validate all affected surfaces.

| Learner action | Required converged surfaces |
| --- | --- |
| Run creation | Mission Control, Inbox, Stakeholders, Documents, Meetings, Activities, Notifications, available decisions |
| Document/evidence availability | Documents, Decision eligibility, Mission Control where applicable |
| Meeting start | Meetings, Mission Control |
| Meeting completion | Meetings completed state/history, Mission Control, dependent decision eligibility |
| Activity completion | Activities, Completed History, Mission Control, chapter progress |
| Decision submission | available decisions, Mission Control, Decision Log, indicators, affected stakeholders/notifications |
| Delayed consequence scheduling | authoritative schedule instructions; no premature future-state mutation |
| Reflection completion | Activities, Completed History, Mission Control, chapter progress |
| Chapter completion | Mission Control, Notifications, chapter status, ending feedback, Chapter Two placeholder |

A surface may be honestly empty or unavailable when permitted, but it may not fabricate or contradict authoritative state.

---

## 14. Persistence and Security Validation

Validate:

- the server resolves the selectable published content version;
- the run pins `businessCaseId`, `contentPackageVersionId`, and `experienceLevel`;
- active runs are not silently upgraded;
- tenant authorization precedes catalog, run, projection, and command access;
- another tenant cannot read or modify the run;
- another learner cannot operate the run without authority;
- the client cannot substitute a Harbor or unauthorized version ID;
- authoritative state persists through PostgreSQL composition;
- outbox records are transactional with accepted actions;
- projection failures do not roll back accepted Domain actions;
- service-role credentials and hidden content never reach the browser;
- production rejects development-only authentication and E2E seams.

---

## 15. Accessibility Validation

### 15.1 Automated checks

Run automated accessibility checks across:

- Catalog;
- Case Details;
- experience selection;
- Mission Control;
- Inbox;
- Stakeholders;
- Documents;
- Meetings;
- Activities;
- Completed History;
- Notifications;
- Decision workspace;
- Decision Log;
- Chapter One ending.

### 15.2 Manual checks

Document manual verification of:

- keyboard-only operation;
- logical focus order;
- visible focus indicators;
- focus placement after route changes, dialogs, errors, and submissions;
- semantic page structure;
- accessible control names;
- screen-reader announcements for loading, validation, errors, accepted actions, and completion;
- contrast;
- non-color-only status communication;
- zoom at 200% and text resize;
- accessible evidence tables and documents;
- reduced motion where applicable;
- touch-target usability;
- understandable error recovery.

Blocking accessibility defects must be fixed before completion.

---

## 16. Responsive Validation

Validate at minimum:

| Class | Representative viewport |
| --- | --- |
| Small phone | 320 × 568 |
| Modern phone | 390 × 844 |
| Tablet portrait | 768 × 1024 |
| Laptop | 1366 × 768 |
| Desktop | 1440 × 900 |
| Wide desktop | 1920 × 1080 |

For every Workplace surface, verify:

- no unintended horizontal scrolling;
- no clipped action or evidence content;
- navigation remains usable;
- decision options remain readable and selectable;
- tables and documents remain understandable;
- loading and error states do not cause destructive layout shifts;
- completed history and logs remain readable;
- the ending state is visible and understandable;
- small-screen learners can complete the full chapter.

---

## 17. Test Reliability

### 17.1 Required suites

Run and record the repository’s actual commands for:

- install and dependency integrity;
- formatting;
- lint;
- typecheck;
- build;
- Domain tests;
- Application tests;
- Infrastructure tests;
- API tests;
- Web tests;
- content validation;
- PostgreSQL integration tests;
- Playwright end-to-end tests;
- focused BC-005 tests.

### 17.2 PostgreSQL parallel-test defect

The previously reported truncate-contention flakiness is a BC-005 blocking test-infrastructure defect.

The fix must:

- isolate test tenants and runs;
- avoid global truncation during parallel execution;
- use scoped cleanup or transaction/schema isolation;
- pass repeatedly under the normal full-suite concurrency;
- not rely on runner retries;
- not serialize the whole suite unless an approved technical reason is documented.

### 17.3 Waiting and retry rules

- Prefer condition-based waits.
- Do not use arbitrary sleeps for convergence.
- Do not mark a test as flaky instead of fixing it.
- Do not report skipped database tests as passed.
- Report environment-gated skips explicitly.

---

## 18. Required Automated Scenarios

At minimum, add or retain automated proof for:

1. full Explorer journey;
2. full Practitioner journey;
3. full Leader journey;
4. repeated initialization;
5. repeated decision submission;
6. repeated activity completion;
7. repeated meeting completion;
8. repeated chapter completion;
9. stale aggregate conflict;
10. conflicting idempotency payload;
11. browser refresh after each major checkpoint;
12. relay retry;
13. query-time catch-up;
14. projection rebuild;
15. API or worker restart where supported;
16. two Northstar runs under one learner;
17. two learners under one tenant;
18. two tenants;
19. Northstar and Harbor isolation;
20. hidden-content API inspection;
21. informational Inbox message exclusion from decision counts;
22. evidence-gated decision eligibility;
23. missing meeting blocks completion;
24. missing activity blocks completion;
25. ending event occurs once;
26. responsive smoke tests across representative viewports;
27. automated accessibility checks;
28. PostgreSQL full-suite parallel execution without contention.

---

## 19. Manual Review Sessions

Conduct and document these reviews:

### 19.1 Narrative review

Review the entire chapter as one story without inspecting implementation details.

### 19.2 Learner-comprehension review

For each experience level, answer:

- What is the project problem?
- What is the learner responsible for?
- What work is required next?
- What evidence supports each decision?
- What trade-off is being made?
- What changed after the decision?
- Why is Chapter One complete or incomplete?

### 19.3 Stakeholder review

Confirm every message and response matches role, motivation, knowledge, timing, and current state.

### 19.4 Accessibility review

Complete keyboard and screen-reader-oriented manual checks.

### 19.5 Responsive review

Complete the chapter on phone, tablet, and desktop layouts.

---

## 20. Defect Classification and Severity

Every finding must have one category:

- software;
- content;
- usability;
- accessibility;
- responsive;
- assessment;
- security/privacy;
- test infrastructure;
- true new feature request.

Severity:

- **Blocker:** prevents the chapter or production path from completing safely.
- **Critical:** creates incorrect authority, data leakage, duplicate effects, inaccessible required work, or unfair assessment.
- **Major:** materially harms comprehension, consistency, reliability, or responsive use.
- **Minor:** limited issue that does not invalidate the chapter.
- **Enhancement:** useful improvement outside BC-005 defect scope.

Blocker, Critical, and Major defects must be resolved or receive explicit approved disposition before BC-005 closes.

---

## 21. Evidence Requirements

For every validation item, record:

- scenario ID;
- date and environment;
- tester or automation source;
- experience level;
- tenant, learner, run, case, and version identities using safe test values;
- steps or command;
- expected result;
- actual result;
- pass, fail, blocked, or not applicable;
- logs, screenshots, trace IDs, test output, or artifact references;
- defect link where failed;
- retest result.

Never include secrets, production personal data, access tokens, service-role keys, or hidden learner content in public evidence.

---

## 22. Exit Criteria

BC-005 may be approved only when:

- the canonical production path passes;
- normal and failure/recovery modes pass;
- Chapter One remains duplicate-free and correctly ordered;
- every Workplace surface converges;
- narrative and learning reviews pass;
- stakeholder behavior is coherent;
- evidence and trade-offs are understandable;
- experience levels remain fair and consistent;
- accessibility checks pass;
- responsive checks pass;
- isolation and hidden-content checks pass;
- PostgreSQL production composition passes;
- parallel test flakiness is resolved;
- full CI passes;
- no unresolved Blocker, Critical, or Major defect remains;
- Issue #68 remains correctly open unless separately completed;
- the validation evidence is merged into `main`.

---

## 23. Cursor Implementation Handoff

Use branch:

```text
cursor/bc-005-chapter-one-validation
```

Cursor must:

1. inspect the merged BC-004 implementation and current tests;
2. add an architecture and test-discovery section to its draft PR;
3. implement missing automated validation scenarios;
4. run documented manual-review support where automation is insufficient;
5. fix blocking defects within their owning package boundaries;
6. resolve PostgreSQL parallel-test contention;
7. update the evidence document continuously;
8. link the PR using `Closes #78`;
9. keep Issue #68 open;
10. stop before BC-006.

---

## 24. Acceptance Checklist

- [ ] Validation plan approved.
- [ ] Production-equivalent environment documented.
- [ ] Full end-to-end learner journey passes.
- [ ] Normal, retry, conflict, refresh, catch-up, rebuild, restart, and concurrency modes pass where applicable.
- [ ] Initialization and actions are idempotent.
- [ ] No duplicate content, effects, or history exists.
- [ ] Ordering remains deterministic.
- [ ] All Workplace surfaces converge.
- [ ] Narrative review passes.
- [ ] Learner-comprehension review passes for all experience levels.
- [ ] Stakeholder review passes.
- [ ] Decision evidence, trade-offs, consequences, and feedback are coherent.
- [ ] Hidden information remains fair and protected.
- [ ] Accessibility automation and manual checks pass.
- [ ] Responsive validation passes.
- [ ] PostgreSQL production composition passes.
- [ ] PostgreSQL parallel-test flakiness is resolved.
- [ ] Full repository validation and CI pass.
- [ ] No unresolved blocking defect remains.
- [ ] Evidence log is complete.
- [ ] BC-005 implementation and evidence are merged into `main`.
