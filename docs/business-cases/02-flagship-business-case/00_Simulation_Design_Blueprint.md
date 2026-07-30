# ProjectSim Flagship Business Case — Simulation Design Blueprint

**Document ID:** BC-001  
**Version:** 1.1  
**Status:** Approved  
**Original approval date:** 2026-07-26  
**Version 1.1 amendment:** Business Case Catalog and Multi-Case Selection  
**Primary owner:** GitHub  
**Repository location:** `docs/business-cases/02-flagship-business-case/00_Simulation_Design_Blueprint.md`  
**Related issues:** #64, #70

---

## 1. Purpose

This document defines the canonical educational, narrative, and learner-entry design for the first ProjectSim flagship business case and the rules that allow ProjectSim to support multiple independent business cases.

ProjectSim is not a single-case application. Learners must be able to browse a catalog, select the business case they want to work on, select an experience level, and then start or resume a simulation run for that case.

Northstar Community Health Network is the first flagship business case. It is not the only case the platform may support.

The flagship experience must be immersive, engaging, gamified, consequence-driven, and aligned with the PMBOK Guide Eighth Edition through realistic workplace judgment rather than memorization alone.

This blueprint governs BC-002, BC-003, BC-004, and later implementation, validation, pilot, and learner-experience work.

---

## 2. Design Authority

1. GitHub is the source of truth for approved business-case design and version history.
2. BC-001 defines the learner model, business-case selection experience, flagship educational intent, scenario boundaries, assessment strategy, and narrative progression.
3. BC-002 defines the complete Northstar business world and authored content.
4. BC-003 defines reusable business-case manifests, schemas, identifiers, validation, loaders, registries, publication rules, and version pinning.
5. Cursor implements content loading, validation, APIs, integration, tests, and production fixes.
6. Lovable refines catalog presentation and learner-facing Workplace presentation but does not become a content source of truth.
7. AI may support coaching and controlled dialogue but may not alter authoritative state, scores, eligibility, selected case, selected content version, or outcomes.
8. Shared platform code must remain reusable and case-neutral.
9. Case-specific business rules, narrative content, decisions, and consequences must remain inside the selected business-case package.

---

## 3. Product Experience Model

The learner journey begins before a simulation run exists:

1. Open the Business Case Catalog.
2. Browse or filter available business cases.
3. Open a business-case detail view.
4. Review the case summary, industry, project type, duration, difficulty, learning focus, and experience-level support.
5. Select the business case.
6. Select Explorer, Practitioner, or Leader mode.
7. Start a new run or resume an existing run for that case.
8. Enter the Workplace associated with the selected run.

A learner must never be placed into a default case without being shown which case and version will be used.

---

## 4. Business Case Catalog

### 4.1 Catalog purpose

The catalog is the learner-facing entry point for all published business cases.

It must support multiple cases installed and available at the same time.

### 4.2 Required case-card metadata

Every catalog entry must expose:

- stable business-case identifier;
- title;
- short summary;
- industry;
- organization type;
- project or initiative type;
- estimated learning duration;
- represented business-world timeline;
- supported experience levels;
- difficulty guidance;
- major learning objectives;
- PMBOK Guide Eighth Edition focus areas;
- delivery approaches represented;
- case content version;
- publication or availability status;
- cover image or visual identity reference;
- accessibility and language availability, when applicable;
- prerequisites, when applicable;
- whether the learner already has active or completed runs.

### 4.3 Catalog behavior

Learners must be able to:

- browse all available cases;
- filter by industry, duration, difficulty, learning focus, and experience level;
- compare basic case information;
- open a case detail page;
- identify active, completed, and not-started cases;
- resume an active run;
- start another permitted run;
- archive a run without deleting its authoritative history.

Search, recommendation, and personalization may be added later, but they may not replace explicit learner selection.

### 4.4 Publication states

A case may be:

- draft;
- validation;
- pilot;
- published;
- retired.

Only cases available under the learner’s access rules may be started. Retired cases may remain resumable when policy permits, but no new run may silently use a retired or replaced content version.

---

## 5. Multi-Case and Multi-Run Rules

### 5.1 Stable case identity

Each case must have a stable `business_case_id` that does not depend on its display name, folder name, or current version.

The Northstar flagship case uses the canonical identifier:

`northstar-connected-care`

### 5.2 Content-version pinning

Every simulation run must store and preserve:

- `business_case_id`;
- `business_case_version`;
- selected experience level;
- run identifier;
- learner or tenant ownership;
- creation timestamp;
- authoritative run status.

A run must continue using the version on which it was created unless an explicit, tested migration is approved.

Publishing a newer case version must not silently change an active or completed run.

### 5.3 Multiple runs

The platform must support separate runs for different business cases.

A learner may:

- have an active Northstar run;
- have an active or completed run for another case;
- resume the correct run from the catalog or learner dashboard;
- restart a case under an explicit new run when allowed;
- archive a run while preserving audit history.

Whether multiple active runs of the same case and version are permitted is a product policy expressed by configuration, not hardcoded into shared UI components.

### 5.4 Isolation

There must be no cross-case state leakage.

The selected case and pinned version must scope:

- chapters;
- events;
- stakeholders;
- meetings;
- Inbox messages;
- documents;
- notifications;
- activities;
- decisions;
- consequences;
- assessment rubrics;
- achievements;
- AI persona context;
- projections;
- APIs;
- Workplace views;
- analytics and reports.

Identifiers from one case or version must not resolve inside another case or version unless an explicit shared-reference contract exists.

### 5.5 Shared platform, independent content

All cases use the same authoritative command, outbox, relay, projection, API, authorization, and Workplace architecture.

A new business case must be addable without:

- adding case-specific conditionals to React components;
- adding case-specific command handlers to shared platform code;
- duplicating the Workplace application;
- changing the meaning of existing authoritative contracts;
- creating a second source of truth.

---

## 6. Target Learner

ProjectSim targets anyone interested in learning or improving project management, including:

- people exploring project management for the first time;
- students and career changers;
- project coordinators and administrators;
- junior and experienced project managers;
- program, product, operations, technology, healthcare, and functional professionals;
- PMP candidates seeking practical reinforcement;
- certified practitioners seeking advanced judgment and leadership practice.

The experience must explain necessary terminology without making advanced learners repeat unnecessary instruction.

---

## 7. Experience-Level Model

Every compatible case may support:

### 7.1 Explorer

- terminology explanations;
- guided evidence prompts;
- clearer decision framing;
- optional hints;
- stronger mentor guidance;
- recovery support.

### 7.2 Practitioner

- standard evidence access;
- limited hints;
- realistic ambiguity;
- competing stakeholder expectations;
- moderate time and information pressure.

### 7.3 Leader

- minimal prompting;
- higher ambiguity;
- incomplete or conflicting information;
- tighter trade-offs;
- stronger governance and procurement pressure;
- optional advanced challenges.

The case manifest must declare which levels it supports. The same run may not change its selected experience level silently after creation.

---

## 8. Flagship Case Identity

### 8.1 Catalog identity

- **Business case ID:** `northstar-connected-care`
- **Display title:** Northstar Connected Care Transformation
- **Organization:** Northstar Community Health Network
- **Industry:** Healthcare services
- **Project:** Connected Care Access Program
- **Case version governed by BC-002:** `1.0.0`
- **Estimated learning duration:** 10 hours
- **Learning structure:** 10 learning days, six chapters
- **Supported experience levels:** Explorer, Practitioner, Leader
- **Primary delivery environment:** Hybrid
- **Primary currency:** U.S. dollars

### 8.2 Organization

Northstar is a mid-sized nonprofit community health network operating:

- 12 outpatient clinics;
- approximately 1,800 employees;
- approximately 250 clinical providers;
- centralized scheduling, finance, technology, compliance, procurement, and patient-experience functions;
- approximately 400,000 patient visits per year.

### 8.3 Central project

The Connected Care Access Program will select, configure, integrate, pilot, and deploy a unified patient-access and scheduling platform across Northstar’s clinic network.

It includes:

- digital and assisted scheduling;
- workflow redesign;
- clinical and billing integrations;
- data migration and quality controls;
- staff training and adoption;
- vendor and procurement management;
- patient communication;
- responsible use of automation and AI-assisted recommendations;
- phased rollout and benefits measurement.

### 8.4 Central business problem

Northstar is experiencing long appointment wait times, inconsistent scheduling processes, call-center abandonment, avoidable appointment gaps, staff frustration, fragmented reporting, and declining patient satisfaction.

The learner must balance urgency with patient safety, privacy, workflow quality, staff adoption, technical readiness, financial discipline, governance, and sustainable value.

---

## 9. Learner Role and Authority

**Learner title:** Project Manager, Enterprise Transformation

The learner reports to the Program Director for Strategic Transformation and works under an executive sponsor and cross-functional steering committee.

The learner may:

- organize and tailor the delivery approach;
- facilitate meetings and stakeholder engagement;
- prepare and update artifacts;
- make decisions within delegated authority;
- propose scope, schedule, budget, quality, risk, resource, procurement, communication, and rollout changes;
- negotiate commitments;
- escalate issues;
- recommend continuation, recovery, redirection, pause, or termination.

The learner may not:

- approve spending outside delegated thresholds;
- sign or materially change vendor contracts;
- waive privacy, safety, legal, compliance, or governance requirements;
- invent information;
- manipulate authoritative metrics or scores;
- bypass required approvals;
- use AI coaching as a substitute for judgment.

---

## 10. Scenario Duration and Financial Scale

### 10.1 Learning duration

- 10 learning days;
- approximately 10 total learning hours;
- approximately 60 minutes per learning day;
- flexible completion pace;
- no calendar-based unlocking;
- pause and resume supported;
- required activities and decisions may not be skipped.

### 10.2 Business-world timeline

The project represents a nine-month transformation initiative from authorization through initial rollout and outcome review.

### 10.3 Financial scale

- approved project budget: **$4.8 million**;
- executive contingency reserve: **$480,000**;
- expected annual operating and access benefits after stabilization: **$3.2 million**.

---

## 11. PMBOK Guide Eighth Edition Alignment

The case applies the PMBOK Guide Eighth Edition’s principles-and-performance-domains foundation through actionable project work.

It emphasizes:

- value delivery;
- accountability;
- adaptability and tailoring;
- systems thinking;
- governance;
- stakeholders;
- teams and leadership;
- planning and project work;
- delivery and measurement;
- uncertainty, complexity, and risk;
- procurement and external dependencies;
- PMO and organizational support;
- responsible use of data, automation, and AI;
- non-prescriptive process guidance.

Every chapter integrates multiple project-management concerns. At least one material decision tests ethics, transparency, privacy, quality, or professional accountability.

---

## 12. Learning Objectives

The learner should be able to:

1. Identify the real project problem from incomplete evidence.
2. Connect decisions to organizational value and outcomes.
3. Tailor the delivery approach to context.
4. Analyze and engage stakeholders.
5. Build and support the project team.
6. Evaluate scope, schedule, cost, quality, resources, procurement, risk, governance, and adoption together.
7. Recognize assumptions, dependencies, uncertainty, and complexity.
8. Make defensible evidence-based decisions.
9. Communicate appropriately with different audiences.
10. Navigate conflict, resistance, priorities, and politics.
11. Apply change control and adaptation.
12. Explain intended and unintended consequences.
13. Demonstrate ethical judgment and accountability.
14. Use AI-related information responsibly with human oversight.
15. Reflect and transfer learning to real project work.

---

## 13. Educational Experience Principles

The experience must be:

- **immersive:** delivered through Mission Control, Inbox, meetings, stakeholder conversations, documents, notifications, activities, decisions, consequences, health indicators, and mentor interactions;
- **engaging:** driven by discovery, tension, realistic trade-offs, stakeholder behavior, and visible progress;
- **gamified:** using chapters, objectives, experience points, competency progress, achievements, optional challenges, and outcomes to reinforce learning;
- **evidence-based:** requiring appropriate information before material commitments;
- **consequence-driven:** providing direct, delayed, reversible, and irreversible effects;
- **reflective:** requiring reasoning, comparison, assumptions, and lessons learned.

Gamification must not reward repetitive clicking, speed alone, or reckless risk-taking.

---

## 14. Chapter Structure

### Chapter 1 — Orientation and Initial Problem

- introduce Northstar, the project, learner role, and Workplace;
- surface the apparent access problem;
- require evidence review;
- **3 required decisions**.

### Chapter 2 — Investigation and Stakeholder Tension

- reveal conflicting perspectives and operational realities;
- require root-cause and stakeholder investigation;
- **3 required decisions**.

### Chapter 3 — Strategic Direction and Commitment

- establish delivery, scope, vendor, governance, and rollout direction;
- **4 required decisions**.

### Chapter 4 — Crisis and Unexpected Consequence

- surface consequences and a major integration, privacy, adoption, vendor, or quality crisis;
- **4 required decisions**.

### Chapter 5 — Recovery and Final Recommendation

- stabilize, negotiate, and decide whether to proceed, redirect, pause, or terminate;
- **3 required decisions**.

### Chapter 6 — Outcome and Reflection

- present outcomes, consequences, assessment, and learning transfer;
- **2 required decisions**.

The flagship case contains **19 required decisions**.

---

## 15. Information Fairness

Information may remain hidden only when:

- the learner has not completed the relevant investigation;
- the relevant stakeholder has not been engaged;
- the event has not occurred;
- the information is not yet known;
- privacy, role, or governance boundaries prevent disclosure;
- disclosure would eliminate a fair intended trade-off.

The simulation may use ambiguity but may not use undisclosed scoring rules, retroactive facts, or impossible-to-anticipate penalties.

---

## 16. Intended Trade-Offs

The case must include:

- speed versus sustainable adoption;
- access improvement versus privacy, safety, and quality;
- scope ambition versus delivery confidence;
- cost reduction versus resilience;
- stakeholder satisfaction versus enterprise value;
- transparency versus political convenience;
- centralized control versus team empowerment;
- immediate action versus investigation;
- predictive certainty versus adaptive learning;
- local optimization versus network-wide outcomes;
- vendor dependence versus internal capability;
- automation efficiency versus human oversight;
- opportunity capture versus risk avoidance;
- recovery investment versus termination.

---

## 17. Consequence and Health Model

Every material decision must define immediate and delayed consequences, project-health effects, stakeholder and team effects, competency effects, event unlocks, reversibility, recovery opportunities, and explanation requirements.

Authoritative consequences must be deterministic, traceable, proportionate, testable, and scoped to the selected case and version.

Canonical health indicators are:

1. Value Delivery
2. Schedule Confidence
3. Financial Health
4. Quality and Readiness
5. Risk Exposure
6. Team Health
7. Stakeholder Trust
8. Governance Confidence

---

## 18. Assessment Strategy

- Decision Quality and Evidence Use — **30%**
- Value Delivery and Systems Thinking — **20%**
- Stakeholder and Team Leadership — **20%**
- Risk, Uncertainty, and Adaptability — **15%**
- Governance, Ethics, and Accountability — **10%**
- Reflection and Learning Transfer — **5%**

Scores derive from approved deterministic rubrics and authoritative learner actions. AI may explain or coach but may not calculate authoritative scores.

---

## 19. Success, Failure, and Outcomes

Success requires defensible value delivery, governance, ethics, evidence use, quality, risk management, stakeholder and team support, adaptation, completion, and reflection.

Failure may result from critical ethical, privacy, safety, legal, quality, financial, or authorization failure; repeated reckless decisions; or inability to create a credible path forward.

Final classifications are:

1. Transformational Leader
2. Value-Focused Recovery
3. Controlled Delivery
4. Fragile Success
5. Project at Risk
6. Governance Failure

---

## 20. AI Boundaries

AI may explain terminology, coach reflection, summarize approved information, generate controlled stakeholder dialogue, and provide level-appropriate hints.

AI may not create authoritative facts, reveal hidden information, choose for the learner, alter the selected case or version, modify scores or consequences, unlock chapters, or change project state.

---

## 21. Accessibility and Comprehension

The catalog, case detail page, run selection, and Workplace must provide:

- keyboard access;
- semantic structure and screen-reader support;
- sufficient contrast and visible focus;
- accessible documents and tables;
- plain-language explanations;
- non-color-only status signals;
- responsive layouts;
- understandable errors and recovery states;
- clear required-versus-optional indicators;
- reasonable reading load.

---

## 22. BC-002 Boundaries

BC-002 defines the complete Northstar content package and its catalog presentation metadata.

It must define:

- Northstar company, project, financial, stakeholder, governance, vendor, chapter, event, meeting, Inbox, conversation, document, notification, activity, decision, consequence, crisis, and ending content;
- all 19 required decisions;
- optional Leader challenges;
- catalog title, summary, learning focus, difficulty guidance, visual identity, and detail-page description;
- canonical content version `1.0.0`.

BC-002 must not define global catalog logic or shared loader behavior.

---

## 23. BC-003 Boundaries

BC-003 must define and validate a reusable multi-case content system, including:

- business-case manifest schema;
- catalog metadata schema;
- stable `business_case_id`;
- semantic `business_case_version`;
- publication and availability status;
- supported experience levels;
- case package registry;
- loaders for multiple published cases;
- run creation that pins case ID and version;
- validation that all references belong to the selected case and version;
- prevention of cross-case identifiers and state leakage;
- immutable published versions;
- upgrade and migration boundaries;
- import and seed tooling;
- automated tests with at least two independently loadable case fixtures.

Case-specific logic must not be hardcoded into React components or shared services.

---

## 24. BC-004 Chapter One Requirements

The vertical slice must begin before the Workplace:

1. Display the Business Case Catalog.
2. Show Northstar as a selectable published case.
3. Open the Northstar detail page.
4. Select an experience level.
5. Create a run pinned to `northstar-connected-care` and version `1.0.0`.
6. Enter Chapter One.

Chapter One must then include initial Workplace state, named stakeholders, Inbox messages, evidence documents, a meeting, three decisions, deterministic consequences, an Activity and completion, Decision Log entries, a chapter-ending event, level-specific guidance, assessment signals, and complete Domain-to-Workplace processing.

---

## 25. Acceptance Criteria

BC-001 Version 1.1 is complete when:

- [x] Northstar is defined as the first flagship case rather than the only case.
- [x] Business Case Catalog behavior is defined.
- [x] Learner case and experience-level selection are defined.
- [x] Catalog metadata requirements are defined.
- [x] Multiple cases and separate learner runs are supported by design.
- [x] Stable case identity and content-version pinning are required.
- [x] Cross-case state and content isolation are required.
- [x] Shared platform and case-neutral implementation boundaries are preserved.
- [x] BC-002 catalog metadata obligations are defined.
- [x] BC-003 multi-case schema, registry, loader, validation, and testing obligations are defined.
- [x] BC-004 begins with catalog selection and version-pinned run creation.
- [x] The original learner, PMBOK, educational, narrative, assessment, accessibility, and AI requirements remain intact.
- [ ] Version 1.1 is merged into `main`.

---

## 26. Approval

This Version 1.1 amendment is approved as the governing design for business-case selection and multi-case support.

Northstar remains the first flagship case. Future cases must use the shared catalog, manifest, versioning, run-pinning, isolation, and platform-neutrality rules defined here.
