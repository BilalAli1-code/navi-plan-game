# ProjectSim Simulation Design Blueprint

**Document type:** Platform architecture and simulation-design specification  
**Version:** 2.0  
**Status:** Implementation-ready foundation  
**Applies to:** Every ProjectSim business case, simulation chapter, stakeholder interaction, assessment, report, and future feature  
**Related documents:** `AGENTS.md` and `docs/02-Business-Case-Content-Bible.md`

---

## 1. Purpose of This Document

This blueprint defines the permanent design and architectural rules for ProjectSim.

It explains how ProjectSim converts a business case into an immersive, AI-supported project-management simulation in which the learner:

- Enters a realistic organization.
- Inherits a business problem and project mandate.
- Works through a continuous project lifecycle.
- Communicates with persistent AI stakeholders.
- Produces project-management outputs.
- Makes decisions with short-term and long-term consequences.
- Receives contextual coaching from Maya.
- Is assessed continuously across project outcomes, communication, leadership, and PM competency.
- Completes an executive review based on the actual project history created during the simulation.

This blueprint is platform-level and reusable.

It must not contain case-specific facts that belong in a Business Case Content Bible, such as:

- Company names.
- Stakeholder names.
- Project budgets.
- Customer-satisfaction baselines.
- Product scope.
- Case-specific risks.
- Exact emails or conversations.
- Case-specific chapter events.
- Final business-case outcomes.

Those details belong in `docs/02-Business-Case-Content-Bible.md` or a future case-specific content file.

---

## 2. Source-of-Truth and Alignment Contract

ProjectSim uses a clear hierarchy of authority.

### 2.1 Authority Order

When documents, code, generated content, or AI responses conflict, use this order:

1. **`AGENTS.md`**  
   Defines permanent repository rules, development protections, and ProjectSim product principles.

2. **`docs/01-Simulation-Design-Blueprint.md`**  
   Defines platform architecture, reusable simulation behavior, scoring principles, state ownership, and implementation standards.

3. **Applicable Business Case Content Bible**  
   Defines the company, project, stakeholder cast, KPIs, scope, storyline, chapter events, required activities, and case-specific consequences.

4. **Runtime business-case configuration and seeded content**  
   Implements the applicable Content Bible in structured data.

5. **AI-generated dialogue and coaching**  
   May express the simulation state but may never redefine authoritative facts, scores, events, or outcomes.

### 2.2 Conflict Resolution

If a conflict is found:

- Preserve `AGENTS.md`.
- Preserve the reusable platform principles in this blueprint.
- Treat the applicable Content Bible as authoritative for case-specific content.
- Update runtime configuration and code to match the documents.
- Do not silently create a third version of the storyline in components, prompts, or helper functions.
- Record intentional deviations in a versioned decision log.

### 2.3 Alignment Rule

Every implemented business case must pass an alignment review covering:

- Project identity.
- Stakeholder names and roles.
- Business objectives and KPIs.
- Scope and exclusions.
- Delivery approach.
- In-world timeline.
- Chapter order.
- Event sequence.
- Required activities.
- Risks and conflicts.
- Stakeholder memory.
- Customer metrics.
- Completion rules.
- Final-outcome logic.

---

## 3. Product Vision

ProjectSim is an immersive, AI-powered project-management simulator, not a quiz engine.

The platform develops practical project leadership by placing learners inside realistic business environments where they must:

- Understand business value.
- Lead projects across the lifecycle.
- Manage uncertainty.
- Communicate with different audiences.
- Make defensible trade-offs.
- Build stakeholder trust.
- Protect customers and the organization.
- Learn from consequences.

The intended learner reaction is:

> I did not complete a course module. I managed a real project.

---

## 4. Core Design Principles

### 4.1 Business Before Project

Every simulation begins with a business need, not a project-management task.

The learner must understand:

- Why the initiative exists.
- Which business outcomes matter.
- Who benefits.
- What happens if the organization does nothing.
- Which constraints shape the project.
- How value will be measured.

### 4.2 Story Before Tasks

Activities must emerge from the storyline.

The learner should not receive disconnected instructions such as:

> Create a risk register because this chapter teaches risk management.

Instead, the learner encounters uncertainty, dependencies, assumptions, and stakeholder concerns that make a risk register necessary.

### 4.3 Experience Before Explanation

The learning loop is:

1. Experience a project situation.
2. Interpret the available evidence.
3. Decide or communicate.
4. Observe stakeholder and project consequences.
5. Reflect.
6. Receive coaching and PM-framework mapping.
7. Apply the learning later.

### 4.4 Chapters Are Not Calendar Days

A simulation may use seven learner-facing chapters that each take approximately one hour.

Those chapters may represent:

- One project day.
- Several project days.
- Multiple project weeks.
- A major lifecycle transition.

Progression is controlled by completion of required simulation work, not by real-world time.

### 4.5 Continuous Project State

The simulation never resets between chapters.

The following persist:

- Decisions.
- Project metrics.
- Risks and issues.
- Documents.
- Stakeholder relationships.
- Messages.
- Promises and commitments.
- Customer feedback.
- Team morale.
- Executive confidence.
- Open actions.
- Benefits forecasts.
- Project history.

### 4.6 Consequences Matter

Every significant decision should have more than one effect.

A choice may:

- Increase stakeholder satisfaction.
- Reduce alignment with another stakeholder.
- Improve schedule confidence.
- Increase cost.
- Reduce customer value.
- Create technical debt.
- Protect team morale.
- Increase executive trust.
- Trigger a later event.

There should rarely be a universally perfect option.

### 4.7 Communication Is Gameplay

Communication is not decorative text.

Emails, chat messages, meetings, briefings, negotiations, interviews, and difficult conversations must:

- Reveal information.
- Create commitments.
- Change relationships.
- Trigger work.
- Affect project decisions.
- Produce measurable consequences.
- Demonstrate learner judgment.

### 4.8 Stakeholders Are Persistent

Stakeholders must have:

- Objectives.
- Concerns.
- Influence.
- Communication preferences.
- Knowledge boundaries.
- Relationship state.
- Structured memories.
- Behavioral triggers.
- Proactive behaviors.

They must remember how the learner communicates and whether commitments are honored.

### 4.9 Maya Coaches Without Taking Control

Maya may:

- Ask reflective questions.
- Highlight missing evidence.
- Warn about risks.
- Explain relevant PM concepts after action.
- Help the learner review options.
- Identify communication patterns.

Maya must not:

- Select the learner's answer.
- Complete required work.
- write a perfect response before the learner attempts one.
- Override project facts.
- Directly alter authoritative scores or outcomes.

### 4.10 The Simulation Engine Owns Truth

AI may generate dialogue, explanations, and coaching.

Deterministic application logic must own:

- Project state.
- Chapter state.
- Event eligibility.
- Stakeholder metrics.
- Customer metrics.
- Scores.
- Commitments.
- Consequences.
- Completion.
- Final outcomes.

---

## 5. The Five Aligned Simulation Layers

Every simulation must align five layers.

### 5.1 Business Layer

Defines:

- Organization.
- Strategy.
- Business problem.
- Opportunity.
- Project mandate.
- Benefits.
- Constraints.
- Baseline KPIs.
- Success criteria.

### 5.2 Story Layer

Defines:

- Narrative arc.
- Chapter themes.
- Rising pressure.
- Stakeholder subplots.
- Cliffhangers.
- Crisis.
- Recovery.
- Resolution.
- Persistent story threads.

### 5.3 Project Lifecycle Layer

Defines:

- Initiation.
- Planning.
- Execution.
- Monitoring and control.
- Transition.
- Closing.
- Benefits handoff.

The lifecycle is continuous and may overlap across chapters.

### 5.4 Learning Layer

Defines:

- PM knowledge areas.
- Process groups.
- Performance domains.
- Principles.
- Leadership competencies.
- Communication competencies.
- Reflection.
- Assessment.
- Coaching.

### 5.5 Technology Layer

Defines:

- Simulation orchestrator.
- State engine.
- Event engine.
- Memory engine.
- Relationship engine.
- Communication evaluator.
- AI stakeholder service.
- Maya service.
- Data persistence.
- Analytics.
- User experience.

A feature is complete only when it fits all relevant layers.

---

## 6. Reusable Business Case Framework

Every Business Case Content Bible must define the following.

### 6.1 Organization

- Company name.
- Industry.
- Size.
- Locations.
- Strategy.
- Culture.
- Operating model.
- Organizational pressures.
- Current business environment.

### 6.2 Business Problem

- Current-state problem.
- Evidence.
- Baseline metrics.
- Root causes.
- Cost of inaction.
- Strategic urgency.
- External pressure.

### 6.3 Proposed Initiative

- Project name.
- Product, service, or change being delivered.
- Sponsor.
- Delivery approach.
- Expected benefits.
- Funding context.
- In-world duration.

### 6.4 Scope

- Initial MVP or authorized scope.
- Candidate features or optional deliverables.
- Explicit exclusions.
- Constraints.
- Assumptions.
- Dependencies.
- Acceptance criteria.

### 6.5 Stakeholder Ecosystem

- Primary stakeholders.
- Secondary stakeholders.
- Customers or users.
- Vendors.
- Regulators or governance groups when relevant.
- Power and interest.
- Conflicting goals.
- Information boundaries.
- Communication preferences.

### 6.6 Metrics

- Business outcomes.
- Customer outcomes.
- Project health.
- Stakeholder outcomes.
- Team outcomes.
- Learning outcomes.
- Benefits-realization measures.

### 6.7 Storyline

- Three-act or equivalent story structure.
- Chapter sequence.
- Persistent threads.
- Proactive events.
- Conditional events.
- Required activities.
- Outputs.
- Consequences.
- Chapter hooks.
- Final outcome variants.

---

## 7. Seven-Chapter Simulation Model

ProjectSim's default flagship format is a seven-chapter simulation.

A business case may use another length only when its Content Bible explicitly defines it.

### 7.1 Standard Narrative Shape

| Chapter | Narrative Purpose | Typical Lifecycle Emphasis |
|---|---|---|
| 1 | Assignment, orientation, discovery, initial alignment | Initiation and tailoring |
| 2 | Integrated planning under business pressure | Planning |
| 3 | Trade-offs, baseline approval, and scope alignment | Planning and change control |
| 4 | Delivery begins and people problems emerge | Execution and monitoring |
| 5 | Major crisis exposes earlier decisions | Monitoring, control, and leadership |
| 6 | Recovery, validation, readiness, and decision preparation | Execution, control, and transition |
| 7 | Launch or responsible delay, transition, and executive review | Transition, closing, and benefits handoff |

The applicable Content Bible owns the exact titles, events, timing, and deliverables.

### 7.2 Chapter Contract

Every chapter must define:

- Story theme.
- In-world timing.
- Lifecycle emphasis.
- Opening condition.
- Available workspace content.
- Proactive stakeholder activity.
- Required learner activities.
- Required communication.
- Required decisions.
- Required outputs.
- Available risks and conflicts.
- Maya coaching triggers.
- Scoring emphasis.
- Persistent consequences.
- Reflection.
- Completion conditions.
- Cliffhanger or transition.

### 7.3 Chapter Progression

A chapter is unlocked only when:

- The previous chapter is complete.
- Required consequences have been processed.
- Required state transitions are valid.
- The next chapter's prerequisite conditions are satisfied.

A user interface action must never bypass server-side progression rules.

---

## 8. Project Lifecycle and Time Model

ProjectSim must separate three concepts.

### 8.1 Learner Chapter

The learner-facing progression unit.

Example:

```text
Chapter 4 of 7
```

### 8.2 Lifecycle State

The project-management lifecycle emphasis.

Examples:

- Initiation.
- Planning.
- Execution.
- Monitoring and control.
- Transition.
- Closing.

A chapter may include more than one lifecycle state.

### 8.3 In-World Time

The simulated project date or period.

Examples:

- Project Week 1.
- Project Weeks 6–10.
- Three days before launch.
- Ninety-day benefits review.

### 8.4 State Separation Rule

Never treat `currentChapter`, `lifecyclePhase`, and `inWorldTime` as the same field.

A recommended model is:

```ts
type SimulationPosition = {
  currentChapter: number;
  chapterStatus: "locked" | "available" | "active" | "complete";
  lifecyclePhases: string[];
  inWorldStart: string;
  inWorldEnd: string;
  narrativeBeat: string;
};
```

### 8.5 Progression Ownership

The server must validate:

- Chapter access.
- Required work.
- Pending consequences.
- Lifecycle transition.
- Event unlocks.
- Completion.

The client may request progression but may not authoritatively set it.

---

## 9. Simulation World Design

### 9.1 Living Organization

The simulation world should continue to feel active while the learner works.

The environment may contain:

- Inbox.
- Team chat.
- Calendar.
- Documents.
- Meetings.
- Project dashboard.
- Risks.
- Issues.
- Change requests.
- Decisions.
- Customer research.
- Reports.
- Notifications.
- Activity feed.
- Maya coaching.

### 9.2 Proactive Stakeholders

Stakeholders do not wait for the learner to open a chat.

They initiate contact when triggered by:

- Missed commitments.
- Project variances.
- Risk exposure.
- New business information.
- Scope decisions.
- Unanswered requests.
- Customer feedback.
- Team conflict.
- Executive pressure.
- Delivery milestones.

### 9.3 Information Asymmetry

Each stakeholder knows only what their role, history, and information level permit.

Examples:

- Finance knows budget concerns.
- Security knows unresolved findings.
- The sponsor may not know an issue unless informed.
- A vendor knows its delivery constraints but may minimize them.
- Customers know their experience but not internal project politics.

AI prompts must respect these boundaries.

### 9.4 Stakeholder Relationship State

The standard relationship model uses values from 0 to 100:

- Trust.
- Satisfaction.
- Confidence.
- Engagement.
- Alignment.
- Frustration.
- Information level.

The applicable Content Bible may add case-specific dimensions but should not redefine these standard meanings.

### 9.5 Relationship Effects

A single interaction may produce mixed effects.

Example:

```json
{
  "trustDelta": 5,
  "satisfactionDelta": -3,
  "confidenceDelta": 4,
  "engagementDelta": 1,
  "alignmentDelta": -2,
  "frustrationDelta": 2,
  "informationLevelDelta": 8
}
```

A stakeholder may dislike an outcome while respecting the learner's honesty and leadership.

---

## 10. Project Memory and Commitment Framework

### 10.1 Memory Types

The simulation must store structured memories, including:

- Decision.
- Commitment.
- Concern.
- Preference.
- Conflict.
- Escalation.
- Fact learned.
- Risk disclosure.
- Missed deadline.
- Successful collaboration.
- Customer insight.
- Leadership pattern.

### 10.2 Commitment Model

When a learner or stakeholder makes a clear promise, the system should create a commitment.

```ts
type Commitment = {
  id: string;
  simulationRunId: string;
  ownerType: "learner" | "stakeholder" | "team" | "vendor";
  ownerId?: string;
  beneficiaryStakeholderId?: string;
  description: string;
  createdAtSimulationTime: string;
  dueAtSimulationTime?: string;
  status: "open" | "complete" | "missed" | "renegotiated" | "cancelled";
  importance: "low" | "medium" | "high" | "critical";
  sourceMessageId?: string;
  sourceEventId?: string;
};
```

### 10.3 Memory Use

Structured memory influences:

- Future stakeholder tone.
- Proactive follow-ups.
- Escalation probability.
- Trust changes.
- Maya coaching.
- Executive-review questions.
- Final performance narrative.

### 10.4 Memory Is Not Raw Chat History

Raw messages may be retained for audit and replay.

The AI context should use concise, structured memories rather than sending every historical message on every request.

---

## 11. Storyline and Event Orchestration

### 11.1 Event Types

The engine should support:

- Scheduled chapter events.
- Triggered events.
- Conditional events.
- Consequence events.
- Escalations.
- Stakeholder messages.
- Meetings.
- Customer feedback.
- Business news.
- Risks.
- Issues.
- Change requests.
- Deliverable reviews.
- Maya interventions.

### 11.2 Event Metadata

A recommended event contract is:

```ts
type SimulationEvent = {
  id: string;
  businessCaseId: string;
  storyThreadId?: string;
  eventType: string;
  title: string;
  summary: string;
  availableFromChapter: number;
  expiresAfterChapter?: number;
  prerequisiteEventIds?: string[];
  triggerConditions?: TriggerCondition[];
  requiredForCompletion: boolean;
  visibleChannels: Array<
    "mission-control" |
    "inbox" |
    "chat" |
    "calendar" |
    "documents" |
    "notifications" |
    "activity-feed"
  >;
  stakeholderIds?: string[];
  lifecycleTags?: string[];
  competencyTags?: string[];
  consequenceRuleIds?: string[];
};
```

### 11.3 Event Gating

Future content must not appear before it is unlocked.

The system must prevent:

- Future emails appearing in Chapter 1.
- Future meetings appearing on the calendar.
- Later crisis documents being discoverable early.
- Chapter 7 launch content appearing during planning.
- AI stakeholders revealing facts not yet known.

### 11.4 Consequence Chains

A consequence may be immediate, delayed, or cumulative.

Example:

```text
Security excluded during planning
→ threat modeling delayed
→ authorization design weakness remains hidden
→ defect found late
→ remediation cost increases
→ sponsor confidence decreases
→ launch options become more constrained
```

The Content Bible defines case-specific chains.

The engine executes them deterministically.

### 11.5 Recovery Paths

Poor decisions should create difficulty, not always permanent failure.

Recovery may require:

- Additional cost.
- Scope reduction.
- Schedule change.
- Executive escalation.
- Trust rebuilding.
- Customer communication.
- Additional testing.
- Team support.
- Responsible delay.

---

## 12. Communication and Collaboration Framework

### 12.1 Supported Interaction Modes

ProjectSim should support:

- Email.
- Direct chat.
- Group chat.
- Executive briefing.
- Stakeholder interview.
- Customer discovery.
- Negotiation.
- Difficult conversation.
- One-on-one.
- Stand-up or coordination meeting.
- Steering committee.
- Go/No-Go review.
- Final executive presentation.

### 12.2 Communication Evaluation

The evaluator should score the dimensions applicable to the interaction:

- Clarity.
- Relevance.
- Empathy.
- Ownership.
- Transparency.
- Actionability.
- Audience fit.
- Risk awareness.
- Professionalism.
- Decision quality.

### 12.3 Separate Communication and Decision Quality

A message can be polite but strategically poor.

A decision can be responsible but disappoint a stakeholder.

Store these separately:

```ts
type CommunicationEvaluation = {
  clarity: number;
  relevance: number;
  empathy: number;
  ownership: number;
  transparency: number;
  actionability: number;
  audienceFit: number;
  riskAwareness: number;
  professionalism: number;
  communicationScore: number;
  decisionQualityScore: number;
  coachingSummary: string;
  relationshipEffects: RelationshipDelta;
  projectEffects: ProjectMetricDelta;
};
```

### 12.4 Context-Specific Rubrics

Rubric weighting changes by audience and interaction.

Examples:

- Executives value brevity, ownership, and recommendations.
- Customers value empathy, accountability, and clear recovery.
- Engineers value precision, evidence, and decision clarity.
- Finance values assumptions, numbers, and control.
- Security values transparency, evidence, and risk treatment.
- Team members value listening, fairness, support, and clear expectations.

### 12.5 Anti-Gaming Rules

The evaluator should penalize:

- Empty corporate language.
- Unsupported promises.
- Avoiding the question.
- Excessive length.
- False certainty.
- Confidentiality violations.
- Contradicting prior commitments.
- Agreeing with every stakeholder.
- Empathy without action.
- Escalation without attempting appropriate resolution.

---

## 13. Metrics and Assessment Framework

Assessment is continuous and multidimensional.

### 13.1 Project Health

Standard project-health dimensions may include:

- Scope.
- Schedule.
- Cost.
- Quality.
- Risk exposure.
- Security.
- Team health.
- Operational readiness.
- Benefits forecast.

### 13.2 Customer Outcomes

Customer satisfaction must be calculated from underlying drivers rather than manually edited as one score.

A business case may define weights for:

- Product quality.
- Usability.
- Reliability.
- Issue resolution.
- Communication.
- Delivered value.
- Adoption.
- Accessibility.
- Trust.

The applicable Content Bible owns the baseline, targets, and exact weighting.

### 13.3 Stakeholder Engagement

Engagement is not a single global mood.

It is calculated per stakeholder from:

- Relationship state.
- Participation.
- Information level.
- Response history.
- Follow-through.
- Alignment.
- Frustration.
- Decision involvement.

### 13.4 PM Competency

Activities may map to:

- Integration.
- Scope.
- Schedule.
- Cost.
- Quality.
- Resources and team.
- Communications.
- Risk.
- Procurement.
- Stakeholders.
- Leadership.
- Systems thinking.
- Value delivery.
- Tailoring.
- Adaptive delivery.
- Ethics and professional responsibility.

The learning taxonomy may reference applicable concepts from PMBOK editions and PMI practice guidance, but gameplay must remain centered on realistic work.

### 13.5 Outcome Versus Judgment

The final evaluation distinguishes:

- Quality of decisions with information available at the time.
- Quality of execution.
- Quality of communication.
- Project outcome.
- Business outcome.
- Ethical and leadership behavior.

A responsible delay may score better than an unsafe on-time launch.

---

## 14. Maya Coaching Framework

### 14.1 Maya's Role

Maya is a persistent project-leadership coach.

She helps the learner improve judgment without removing uncertainty.

### 14.2 Coaching Levels

#### Level 1 — Subtle Nudge

Used before a lower-risk action when the learner may have overlooked something.

#### Level 2 — Reflective Question

Used when the learner should reconsider assumptions, stakeholders, or evidence.

#### Level 3 — Risk Warning

Used when a pattern could create meaningful project, customer, ethical, or organizational harm.

#### Level 4 — Learning Debrief

Used after an action to connect experience with PM principles and future application.

### 14.3 Trigger Inputs

Maya may respond to:

- Repeated weak communication.
- Missing stakeholder involvement.
- Unmanaged risk.
- Contradictory decisions.
- Missed commitments.
- Poor customer discovery.
- Unsupported confidence.
- Ethical concerns.
- Team overload.
- Strong leadership worthy of reinforcement.

### 14.4 Coaching Timing

Maya should not interrupt every action.

Use coaching when it:

- Changes learning value.
- Prevents confusion.
- Highlights a meaningful pattern.
- Supports reflection.
- Connects consequences to prior actions.

---

## 15. AI Stakeholder Architecture and Guardrails

### 15.1 Controlled Agent Inputs

Each stakeholder response may receive:

- Stakeholder profile.
- Communication preference.
- Current relationship state.
- Structured stakeholder memories.
- Current chapter and in-world time.
- Current project state.
- Facts known to the stakeholder.
- Recent relevant messages.
- Open commitments.
- Active events.
- Allowed response actions.
- Tone and length constraints.

### 15.2 Agent Restrictions

A stakeholder agent must not:

- Invent project facts.
- Change authoritative metrics.
- Approve work without permission.
- Reveal hidden information.
- Create unconfigured major events.
- Score the learner.
- Modify relationships directly.
- Ignore role boundaries.
- Resolve the simulation independently.

### 15.3 Separate Services

Use separate operations for:

1. Context assembly.
2. Learner-message evaluation.
3. Deterministic relationship and project effects.
4. Stakeholder-response generation.
5. Commitment extraction.
6. Memory creation.
7. Event creation or triggering.
8. Persistence.

### 15.4 Failure Handling

If AI generation fails:

- Preserve the learner's submitted message.
- Do not duplicate effects.
- Do not partially mutate authoritative state.
- Retry safely.
- Use a controlled fallback response when necessary.
- Record observability data without exposing internal prompts.

---

## 16. Chapter Completion and Progression Rules

A chapter is complete only when all configured requirements are satisfied.

### 16.1 Standard Requirements

- Required activities completed.
- Required decisions recorded.
- Required deliverables created or updated.
- Critical stakeholder communications addressed.
- Required risks and conflicts handled.
- Required commitments completed or formally renegotiated.
- Reflection submitted.
- Consequences processed.
- Chapter summary generated.
- Next chapter unlocked.

### 16.2 Completion Is Configuration-Driven

Completion rules must be authored in structured business-case content.

Do not use broad shortcuts such as:

- Reading any one email completes the workplace category.
- Making any one decision completes all chapter decisions.
- Opening a document completes the deliverable.
- Client navigation sets the current chapter directly.

### 16.3 Server Authority

The server must calculate:

- Requirement status.
- Chapter completion.
- Unlock eligibility.
- Consequence completion.
- Final outcome eligibility.

---

## 17. User Experience and Information Architecture

### 17.1 Mission Control

Mission Control is the project workplace.

It answers:

- What is happening now?
- What needs attention?
- Who needs a response?
- What is at risk?
- What is due?
- How healthy is the project?

It may include:

- Today's mission.
- Project health.
- Inbox.
- Team chat.
- Calendar.
- Tasks.
- Risks and issues.
- Stakeholder updates.
- Documents.
- Timeline.
- Notifications.
- Maya.

### 17.2 Program

Program is the learning and progress area.

It answers:

- Where am I in the simulation?
- What have I completed?
- What competencies am I developing?
- What feedback have I received?
- What reports and achievements have I earned?

It may include:

- Chapter progress.
- PM competency.
- XP and levels.
- Assessments.
- Reflection history.
- Learning analytics.
- Achievements.
- Certificates.
- Completed simulation reports.

### 17.3 No Overlap Rule

- Mission Control is for running the project.
- Program is for reviewing learning and progress.

Do not duplicate active project-work widgets in Program or learning analytics in Mission Control unless a small contextual indicator is necessary.

### 17.4 Immersion

The learner should remain inside one continuous workplace during a simulation.

Navigation should feel like moving between project tools, not between course pages.

---

## 18. Content Architecture

### 18.1 Content Is Data

Case-specific content must be stored as structured configuration or database records.

Avoid case-specific branches such as:

```ts
if (businessCaseId === "customer-portal") {
  // customer portal storyline logic
}
```

Prefer:

```ts
const caseDefinition = await loadBusinessCaseDefinition(businessCaseId);
const eligibleEvents = eventEngine.resolve(caseDefinition, simulationState);
```

### 18.2 Recommended Content Objects

- Business case.
- Organization profile.
- Project profile.
- Chapter definition.
- Story thread.
- Stakeholder profile.
- Customer persona.
- Event.
- Message template.
- Meeting.
- Decision.
- Option.
- Deliverable.
- Risk.
- Issue.
- Conflict.
- Change request.
- Commitment.
- Consequence rule.
- Scoring rubric.
- Maya trigger.
- Final outcome.

### 18.3 Generic Content Versus Case Content

Generic catalogs may provide reusable templates.

They must not be automatically appended to every case.

A Business Case Content Bible or case configuration must explicitly select any generic:

- Decision.
- Risk.
- Conflict.
- Email.
- Meeting.
- Exercise.
- Assessment.

This prevents duplicate and contradictory storylines.

---

## 19. Technical Architecture

### 19.1 High-Level Flow

```text
Business Case Definition
        ↓
Simulation Orchestrator
        ↓
Project and Chapter State
        ↓
Event Eligibility Engine
        ↓
Mission Control Experience
        ↓
Learner Action
        ↓
Evaluation and Deterministic Effects
        ↓
Relationship, Memory, and Commitment Engines
        ↓
Stakeholder Response and Maya Coaching
        ↓
Persistence, Analytics, and Next Event
```

### 19.2 Core Services

#### Simulation Orchestrator

Coordinates state transitions and invokes the appropriate engines.

#### State Engine

Owns authoritative project, chapter, metric, and lifecycle state.

#### Event Engine

Determines which events are eligible, visible, required, expired, or triggered.

#### Consequence Engine

Applies configured immediate and delayed effects exactly once.

#### Relationship Engine

Updates per-stakeholder state from deterministic rules.

#### Memory Engine

Stores and retrieves structured project and stakeholder memories.

#### Commitment Engine

Creates, tracks, fulfills, misses, and renegotiates promises.

#### Communication Evaluator

Scores learner communication and decision quality with a structured rubric.

#### Stakeholder Agent Service

Generates role-grounded stakeholder dialogue.

#### Maya Coach Service

Produces contextual coaching according to configured trigger levels.

#### Assessment Engine

Aggregates project, business, communication, stakeholder, customer, and learning results.

### 19.3 Transactional Processing

A learner action that changes simulation state should be processed atomically when possible.

A recommended sequence is:

1. Validate action and permissions.
2. Load current state.
3. Confirm event eligibility.
4. Persist learner input.
5. Evaluate the action.
6. Apply deterministic effects.
7. Create commitments and memories.
8. Trigger downstream events.
9. Generate stakeholder or Maya response.
10. Save completion and analytics data.

Idempotency must prevent duplicate effects during retries.

### 19.4 Security

- Users may read and mutate only their own simulation runs.
- Authoritative scoring tables must not be directly writable by clients.
- AI prompts and hidden stakeholder data must remain server-side.
- Business-case configuration changes require appropriate administrative access.
- Sensitive customer or stakeholder information must not be exposed through client payloads.

---

## 20. Data Model Overview

A complete implementation may include:

- `business_cases`
- `business_case_versions`
- `simulation_runs`
- `simulation_chapters`
- `simulation_state`
- `simulation_events`
- `event_occurrences`
- `story_threads`
- `stakeholder_profiles`
- `stakeholder_relationships`
- `stakeholder_memories`
- `stakeholder_conversations`
- `stakeholder_messages`
- `communication_evaluations`
- `learner_commitments`
- `project_metrics`
- `customer_metrics`
- `risks`
- `issues`
- `conflicts`
- `change_requests`
- `deliverables`
- `decisions`
- `decision_outcomes`
- `maya_interventions`
- `reflections`
- `competency_scores`
- `final_assessments`

Names may vary, but the responsibilities must remain distinct.

---

## 21. Analytics and Reporting

### 21.1 Learner Reporting

Provide:

- Project outcome.
- Business-value outcome.
- Customer outcome.
- Stakeholder relationship summary.
- Communication patterns.
- Leadership strengths.
- PM competency profile.
- Key consequence chains.
- Missed and fulfilled commitments.
- Personalized recommendations.

### 21.2 Executive Review

The final review should reference the actual simulation history.

Executive questions may be generated from:

- Variances.
- Major decisions.
- Crisis response.
- Customer outcomes.
- Scope changes.
- Missed commitments.
- Stakeholder feedback.
- Launch decision.

The final review is a narrative performance assessment, not only a grade.

### 21.3 Instructor and Platform Analytics

Future instructor or administrator views may include:

- Cohort performance.
- Common decision patterns.
- Communication weaknesses.
- Chapter drop-off.
- Scenario difficulty.
- AI quality.
- Event completion.
- Competency trends.
- Content-balance issues.

---

## 22. Content Governance and Authoring

### 22.1 Versioning

Every business case must have:

- Stable identifier.
- Version.
- Status.
- Owner.
- Change history.
- Compatibility notes.
- Review date.

Simulation runs should retain the business-case version used when they began.

### 22.2 Authoring Workflow

1. Define business need and metrics.
2. Define project mandate and lifecycle.
3. Define stakeholder ecosystem.
4. Define story arc and persistent threads.
5. Define chapter contracts.
6. Define required activities and outputs.
7. Define events and triggers.
8. Define decisions and consequence chains.
9. Define scoring rubrics.
10. Define Maya coaching.
11. Validate PM coverage.
12. Validate narrative continuity.
13. Implement structured content.
14. Test all branches.
15. Approve and publish.

### 22.3 Quality Review

Reviewers must verify:

- Business realism.
- Story continuity.
- Lifecycle credibility.
- Stakeholder consistency.
- Customer representation.
- Knowledge-area coverage.
- Ethical treatment.
- Consequence balance.
- Recovery paths.
- Technical feasibility.
- Assessment fairness.
- AI grounding.

### 22.4 No Silent Content Drift

When code changes a storyline, KPI, stakeholder, chapter requirement, or event:

- Update the applicable Content Bible.
- Update structured runtime content.
- Add or update tests.
- Record the version change.

---

## 23. Testing Requirements

### 23.1 Narrative Tests

Confirm:

- Chapters unlock in order.
- Future events remain hidden.
- Cliffhangers unlock the intended next events.
- Persistent threads continue across chapters.
- Crisis severity reflects earlier actions.
- Recovery paths remain available.
- Final outcomes reflect project history.

### 23.2 State Tests

Confirm:

- Chapter, lifecycle, and in-world time are independent.
- Consequences apply once.
- Commitments persist.
- Relationship deltas persist.
- Metrics remain within valid bounds.
- Refreshing or reconnecting does not lose progress.
- Locked chapters cannot be skipped.

### 23.3 AI Tests

Confirm:

- Stakeholders remain in role.
- Stakeholders do not invent facts.
- Knowledge boundaries are respected.
- Conversation history and structured memory are used.
- Evaluation is separate from response generation.
- Maya does not reveal perfect answers.
- Failed AI calls do not corrupt state.

### 23.4 Content Alignment Tests

For every case, compare runtime content to the Content Bible for:

- Identity.
- Cast.
- KPIs.
- Scope.
- Timeline.
- Chapter events.
- Required activities.
- Risks and conflicts.
- Final outcomes.

---

## 24. Recommended Implementation Sequence

### Phase 1 — Foundation

- Establish document hierarchy.
- Define typed business-case schemas.
- Separate chapter, lifecycle, and time state.
- Implement event gating.
- Implement server-authoritative completion.

### Phase 2 — One Complete Chapter

Implement Chapter 1 end to end with:

- Mission Control.
- Gated inbox and calendar.
- Required project documents.
- Stakeholder interactions.
- Communication evaluation.
- Relationship state.
- Commitments.
- Maya coaching.
- Reflection.
- Consequence processing.
- Chapter unlock.

### Phase 3 — Persistent Story

- Add Chapters 2–3.
- Validate delayed consequences.
- Validate stakeholder memory.
- Validate baseline and change-control flow.

### Phase 4 — Crisis and Recovery

- Add Chapters 4–6.
- Validate crisis severity branching.
- Validate recovery paths.
- Validate Go/No-Go logic.

### Phase 5 — Launch and Assessment

- Add Chapter 7.
- Implement final outcome calculation.
- Implement executive review.
- Implement competency and learning reports.

### Phase 6 — Reusability

- Build a second business case using the same engine.
- Remove any remaining case-specific engine logic.
- Document authoring and publishing workflow.

---

## 25. Definition of Done

A ProjectSim business case is implementation-ready when:

- The applicable Content Bible is complete and versioned.
- Runtime content matches the Content Bible.
- All chapters have explicit contracts.
- Every event is gated.
- Required work controls progression.
- Stakeholder relationships persist.
- Commitments persist and return later.
- Communication and decision quality are evaluated separately.
- AI cannot modify authoritative state.
- Maya coaching is contextual and non-directive.
- Customer and stakeholder metrics are based on underlying drivers.
- All major decisions have configured consequences.
- Poor decisions create credible difficulty and possible recovery.
- Final outcomes reflect the actual project history.
- Mission Control and Program have distinct purposes.
- Automated tests cover narrative, state, AI, and alignment behavior.
- The learner experiences one continuous project rather than disconnected lessons.

---

## Appendix A — Blueprint and Content Bible Alignment Matrix

| Blueprint Area | Business Case Content Bible Responsibility |
|---|---|
| Product principles | Applies the principles to the selected case |
| Business-case framework | Defines the organization, problem, initiative, scope, and KPIs |
| Seven-chapter model | Defines exact chapter titles, timing, events, and activities |
| Lifecycle and time model | Defines each chapter's in-world period and lifecycle emphasis |
| Stakeholder framework | Defines the full stakeholder cast and starting relationship states |
| Memory framework | Defines case-specific facts, concerns, promises, and consequence use |
| Event architecture | Defines case-specific emails, chats, meetings, risks, and triggers |
| Communication evaluation | Defines interaction-specific weighting and examples |
| Customer metrics | Defines baseline, targets, factors, and weights |
| PM competency model | Maps activities and decisions to applicable competencies |
| Maya framework | Defines case-specific coaching triggers and examples |
| Completion framework | Defines required activities, outputs, communications, and risks |
| Outcome framework | Defines case-specific launch and final-review outcomes |
| Technical contract | Provides structured content consumed by the reusable engine |

---

## Appendix B — Business Case Consistency Checklist

Before implementation or release, confirm:

- [ ] The company name is consistent.
- [ ] The project name is consistent.
- [ ] The product or initiative name is consistent.
- [ ] The delivery approach is consistent.
- [ ] The budget and in-world duration are consistent.
- [ ] Baseline and target KPIs are consistent.
- [ ] Stakeholder names and roles are consistent.
- [ ] The chapter sequence is consistent.
- [ ] The crisis occurs in the intended chapter.
- [ ] Recovery and readiness occur after the crisis.
- [ ] Launch and executive review occur in the final chapter.
- [ ] Future events are hidden until unlocked.
- [ ] Required actions control chapter completion.
- [ ] Case-specific risks and conflicts are configured.
- [ ] Generic content is explicitly selected rather than automatically appended.
- [ ] Stakeholder memories persist.
- [ ] Commitments persist.
- [ ] Customer feedback affects outcomes.
- [ ] Maya references current context and consequences.
- [ ] Final outcomes reference actual learner decisions.

---

## Appendix C — Permanent Architectural Rule

> Business Case Content defines what happens.  
> The Simulation Engine determines when it can happen and applies the consequences.  
> AI determines how characters express themselves.  
> The learner determines what to do.
