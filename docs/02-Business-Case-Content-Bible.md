# ProjectSim Business Case Content Bible

## Customer Self-Service Portal — Project Horizon

**Document type:** Simulation content specification  
**Version:** 2.0  
**Status:** Implementation-ready foundation  
**Intended use:** Lovable, GitHub Copilot, content authors, simulation designers, developers, and QA  
**Related documents:** `AGENTS.md` and `docs/01-Simulation-Design-Blueprint.md`

---

## 1. Purpose of This Document

This document defines the complete business, narrative, stakeholder, learning, scoring, and interaction foundation for the **Customer Self-Service Portal** simulation.

It is not only a storyline. It is the source of truth for:

- Why the project exists.
- What business outcomes matter.
- Who the stakeholders are.
- What each stakeholder knows, wants, fears, and remembers.
- How the project unfolds across seven simulation chapters.
- Which activities the learner must complete.
- Which events are proactive, conditional, or consequence-driven.
- How communication, customer satisfaction, stakeholder engagement, project health, and PM competency are measured.
- When Maya should coach, warn, challenge, or remain silent.
- How earlier decisions affect later events and the final outcome.

The simulation must feel like one continuous project. The learner should finish with the feeling:

> I did not complete seven lessons. I managed a difficult project from initiation through launch.

---

## 2. Content Design Principles

All implementation and content decisions must follow these rules:

1. **Story drives learning.** PM concepts are experienced through project work before they are explained.
2. **Simulation days are chapters, not calendar days.** A learner may complete a chapter in approximately one hour, while the in-world project timeline may advance several days or weeks.
3. **The project never resets between chapters.** Decisions, commitments, risks, relationships, documents, and metrics persist.
4. **Stakeholders are proactive.** They initiate emails, chats, meetings, escalations, and requests when project conditions trigger them.
5. **Stakeholders remember.** Missed commitments, hidden risks, respectful communication, ignored concerns, and successful collaboration affect future behavior.
6. **Every major decision has more than one effect.** A choice may improve stakeholder satisfaction while increasing cost or risk.
7. **Communication is gameplay.** The learner must write, ask questions, negotiate, brief executives, and manage conflict.
8. **Maya coaches without taking control.** She should improve judgment, not provide the perfect answer.
9. **The simulation engine owns truth.** AI may generate dialogue, but deterministic rules own project state, scoring, consequences, facts, and outcomes.
10. **Business value matters more than task completion.** Completing an artifact does not guarantee success if the project fails to deliver value.

---

## 3. Business Case Overview

### 3.1 Company Profile

**Company:** NorthStar Digital Solutions  
**Industry:** B2B software-as-a-service  
**Employees:** 1,350  
**Customers:** 42,000 organizations  
**Annual revenue:** Approximately $185 million  
**Primary offering:** Cloud-based operations and business management software  
**Operating regions:** North America and Europe

NorthStar has grown rapidly, but its customer service model has not scaled with the business. Customers currently rely on phone calls, email, and disconnected support forms. Agents often re-enter information across systems, customers cannot see ticket status, and invoice or account requests require manual intervention.

### 3.2 Strategic Context

NorthStar's executive team has identified customer retention and service efficiency as strategic priorities. Customer churn has begun to rise among mid-market accounts, and several enterprise customers have complained that NorthStar's support experience no longer matches the quality of its software products.

A major competitor has launched a modern customer portal with AI-assisted support, self-service account management, and real-time ticket tracking. NorthStar's Sales team is increasingly asked why similar capabilities are unavailable.

The CEO has publicly committed to improving the digital customer experience during the current fiscal year.

### 3.3 Current-State Problems

Baseline operating indicators at project authorization:

| Measure | Current State | Business Concern |
|---|---:|---|
| Customer satisfaction (CSAT) | 72% | Below the executive target and declining |
| Average phone wait time | 19 minutes | Generates complaints and abandonment |
| Annual support-ticket growth | 28% | Unsustainable without hiring |
| Support operating-cost increase | 18% year over year | Reduces margin |
| First-contact resolution | 61% | Too many handoffs and repeated contacts |
| Self-service resolution rate | 8% | Most issues require a support agent |
| Invoice-related contacts | 9,200 per quarter | High-volume, low-value manual work |
| Customer churn | 7.8% | Increasing in the mid-market segment |

### 3.4 Business Problem Statement

NorthStar cannot continue supporting customer growth through manual service channels alone. Without a scalable self-service experience, support costs, response times, and customer frustration will continue to rise. The company risks losing customers, weakening renewals, and falling behind competitors.

### 3.5 Proposed Initiative

**Project name:** Project Horizon  
**Product:** Customer Self-Service Portal  
**Delivery approach:** Hybrid  
**Business sponsor:** Chief Customer Officer

The project will design, build, test, and launch a secure portal that allows customers to complete common service activities without contacting an agent.

### 3.6 Intended Capabilities

The target portal may include:

- Secure account registration and authentication.
- Profile and contact management.
- Support-ticket submission.
- Ticket-status tracking.
- Invoice access and download.
- Product and subscription information.
- Knowledge-base search.
- Notifications and service updates.
- Customer-support chat.
- Administrative controls for enterprise accounts.

Not every capability must be included in the first release. Prioritization is a core learner responsibility.

---

## 4. Business Objectives and Success Criteria

### 4.1 Strategic Objectives

The project is expected to:

1. Improve the customer support experience.
2. Reduce avoidable support contacts.
3. Lower service operating costs.
4. Increase transparency for customers.
5. Improve customer retention.
6. Establish a scalable digital-service platform.

### 4.2 Target Outcomes

| Outcome | Baseline | Target | Measurement Window |
|---|---:|---:|---|
| Customer satisfaction | 72% | At least 85% after stabilization | First 90 days after launch |
| Support calls | Current baseline | 25–40% reduction in eligible calls | Six months |
| Self-service resolution | 8% | At least 35% | Six months |
| Average ticket-status inquiries | Current baseline | 50% reduction | Three months |
| First-contact resolution | 61% | At least 75% | Six months |
| Portal adoption | 0% | At least 50% of active customers | Six months |
| Benefits realization | Not started | Positive ROI within 18 months | Post-launch review |

### 4.3 Project Success Is Multidimensional

The learner must balance:

- Scope.
- Schedule.
- Cost.
- Quality.
- Security.
- Customer value.
- Stakeholder confidence.
- Team health.
- Operational readiness.
- Benefits realization.

A launch can occur on time and still be unsuccessful if adoption, usability, security, or support readiness is poor.

---

## 5. Initial Scope, Constraints, and Assumptions

### 5.1 Initial MVP Scope

The draft MVP includes:

- Secure login and account recovery.
- Customer profile management.
- Support-ticket creation.
- Ticket-status tracking.
- Invoice viewing and download.
- Searchable knowledge base.
- Email notifications.
- Basic portal analytics.

### 5.2 Candidate Features Requiring Prioritization

- Live chat.
- AI-generated support recommendations.
- CRM integration.
- Multilingual support.
- Mobile application.
- Advanced enterprise-account administration.
- Personalized product recommendations.

### 5.3 Out-of-Scope at Authorization

- Replacement of the core customer relationship management system.
- Replacement of the financial billing platform.
- Full redesign of internal support-agent tooling.
- Native mobile applications.
- International launch beyond approved pilot regions.

### 5.4 Constraints

- Executive target date has already been discussed publicly.
- Budget flexibility is limited.
- Security review capacity is constrained.
- Several integrations depend on an external vendor.
- Customer Support cannot release many subject-matter experts for extended workshops.
- Marketing wants sufficient lead time before launch.
- The project must comply with applicable privacy and data-handling requirements.

### 5.5 Initial Assumptions

- Existing identity services can support customer authentication.
- Invoice APIs are available and reliable.
- The CRM vendor can meet the required integration schedule.
- Pilot customers will participate in usability testing.
- Customer Support will provide training and content resources.

Some of these assumptions must later prove false or incomplete to drive the storyline.

---

## 6. Delivery Model and Simulation Timeline

### 6.1 Delivery Model

The project uses a hybrid delivery approach:

- Predictive governance for charter, funding, milestones, security approval, procurement, and executive reporting.
- Iterative discovery and design.
- Agile development and demonstration cycles.
- Formal readiness, acceptance, launch, and transition controls.

### 6.2 Simulation Time Versus Real Project Time

The seven simulation chapters do not represent seven literal project days.

| Simulation Chapter | Approximate In-World Project Period | Lifecycle Emphasis |
|---|---|---|
| Chapter 1 | Project week 1 | Initiation and discovery |
| Chapter 2 | Project weeks 2–3 | Integrated planning |
| Chapter 3 | Project weeks 4–5 | Scope alignment and baseline approval |
| Chapter 4 | Project weeks 6–10 | Execution and team leadership |
| Chapter 5 | Project weeks 11–12 | Monitoring, control, and crisis response |
| Chapter 6 | Project weeks 13–14 | Recovery, UAT, and readiness |
| Chapter 7 | Project weeks 15–16 | Launch, transition, and closure |

The learner advances when required actions are completed, not when real-world time passes.

---

## 7. Story Architecture

### 7.1 Three-Act Structure

#### Act I — The Promise

**Chapters 1–2**

The learner enters the organization, discovers why the project matters, meets the stakeholder network, and begins planning. Optimism is high, but business pressure increases when a competitor announces an advanced portal.

#### Act II — The Project Changes Shape

**Chapters 3–5**

Stakeholder priorities conflict, scope expands, assumptions fail, execution pressure increases, and the team's ability to deliver is tested. A security crisis exposes the consequences of earlier decisions.

#### Act III — Leadership Under Scrutiny

**Chapters 6–7**

The learner must recover the project, rebuild alignment, make a defensible readiness recommendation, lead the launch or delay decision, and explain outcomes to executives.

### 7.2 Persistent Story Threads

The following threads must continue across the full simulation:

1. **Competitive pressure:** Executives compare Project Horizon to a competitor's portal.
2. **Public commitment:** Marketing and Sales have created expectations before scope is stable.
3. **Security readiness:** Early inclusion or exclusion of Security changes the severity of later findings.
4. **Customer voice:** Pilot feedback reveals whether the team is building what customers need.
5. **Support readiness:** Customer Support needs training, knowledge content, and operational procedures.
6. **Vendor dependency:** Integration delivery and contract clarity affect schedule and quality.
7. **Team capacity:** Workload, conflict, and leadership behavior affect morale and execution.
8. **Executive confidence:** Surprises, transparency, and follow-through influence sponsor support.
9. **Scope pressure:** Sales, Marketing, Product, and Support continually request additions.
10. **Learner credibility:** Every promise and commitment can be remembered and revisited.

---

## 8. Stakeholder Ecosystem

### 8.1 Stakeholder Relationship Variables

Each stakeholder has persistent values from 0 to 100:

- **Trust:** Belief that the learner is honest and reliable.
- **Satisfaction:** Perception that stakeholder needs are being addressed.
- **Confidence:** Belief that the learner can lead the project successfully.
- **Engagement:** Willingness to participate and provide support.
- **Alignment:** Support for the current project direction.
- **Frustration:** Accumulated irritation caused by surprises, delays, poor communication, or exclusion.
- **Information level:** How well informed the stakeholder is about project status.

A stakeholder may be dissatisfied with a decision while still trusting the learner. Relationship effects must therefore be multidimensional.

### 8.2 Primary Stakeholders

#### Elena Martinez — Executive Sponsor / Chief Customer Officer

- **Influence:** Very high.
- **Primary goals:** Improve CSAT, protect executive credibility, deliver measurable benefits.
- **Concerns:** Public failure, late surprises, weak ownership, unclear recovery plans.
- **Communication preference:** Concise executive summaries with a clear recommendation.
- **Behavior:** Direct, demanding, supportive when informed early.
- **Hidden pressure:** The CEO has tied part of Elena's performance objectives to this initiative.
- **Positive triggers:** Transparency, clear options, proactive escalation, outcome focus.
- **Negative triggers:** Vague updates, unsupported promises, learning about issues from others.

#### Marcus Reed — Product Owner

- **Influence:** High.
- **Primary goals:** Deliver a compelling customer experience and visible product differentiation.
- **Concerns:** An MVP that feels too limited, slow governance, excessive technical caution.
- **Communication preference:** Collaborative workshops, prototypes, prioritized backlogs.
- **Behavior:** Energetic, persuasive, occasionally expands scope informally.
- **Positive triggers:** Customer evidence, fast decisions, collaborative prioritization.
- **Negative triggers:** Bureaucratic rejection without explanation, long delays, weak product vision.

#### Priya Shah — Customer Service Director

- **Influence:** High.
- **Primary goals:** Reduce ticket volume, improve resolution, ensure operational readiness.
- **Concerns:** Portal features that transfer confusion to customers, weak training, incomplete knowledge content.
- **Communication preference:** Practical detail and operational impact.
- **Behavior:** Cooperative when consulted, resistant when Support is treated as an afterthought.
- **Positive triggers:** Early involvement, realistic training plan, customer evidence.
- **Negative triggers:** Last-minute handoff, incomplete procedures, ignored agent feedback.

#### Daniel Cho — Engineering Manager

- **Influence:** High.
- **Primary goals:** Deliver maintainable, secure, technically feasible software.
- **Concerns:** Unrealistic dates, uncontrolled scope, vendor quality, burnout.
- **Communication preference:** Clear requirements, trade-offs, decisions, and technical facts.
- **Behavior:** Calm but increasingly blunt under pressure.
- **Positive triggers:** Realistic prioritization, protected team focus, evidence-based planning.
- **Negative triggers:** Executive promises made without team input, constant reprioritization.

#### Aisha Rahman — Information Security Officer

- **Influence:** Very high at approval gates.
- **Primary goals:** Protect customer data, verify controls, prevent avoidable exposure.
- **Concerns:** Security being postponed until testing, incomplete threat analysis, weak access controls.
- **Communication preference:** Evidence, documented decisions, clear ownership.
- **Behavior:** Reserved and precise; becomes highly assertive when risk is minimized.
- **Positive triggers:** Early consultation, documented risk response, independent testing.
- **Negative triggers:** Bypass attempts, vague assurances, pressure to approve without evidence.

#### Robert Kim — Finance Business Partner

- **Influence:** Medium to high.
- **Primary goals:** Maintain budget discipline and credible benefits realization.
- **Concerns:** Optimistic forecasts, hidden contingency use, benefits without owners.
- **Communication preference:** Numbers, assumptions, variance explanations, options.
- **Behavior:** Skeptical but fair.
- **Positive triggers:** Accurate forecasts, early warnings, quantified trade-offs.
- **Negative triggers:** Surprise overruns, unsupported ROI claims, missing approvals.

#### Sofia Bennett — Sales Vice President

- **Influence:** High and politically connected.
- **Primary goals:** Protect renewals and win competitive deals.
- **Concerns:** Missing promised features, delayed launch, weak enterprise capabilities.
- **Communication preference:** Fast answers and customer-specific impact.
- **Behavior:** Persuasive, urgent, willing to escalate.
- **Positive triggers:** Visible customer value, credible delivery commitments.
- **Negative triggers:** Generic responses, slow decisions, rejecting requests without alternatives.

#### Liam O'Connor — External Integration Vendor Lead

- **Influence:** Medium.
- **Primary goals:** Deliver contractual scope while protecting vendor margin.
- **Concerns:** Ambiguous requirements, unpaid change requests, delayed client approvals.
- **Communication preference:** Written decisions, acceptance criteria, contractual clarity.
- **Behavior:** Friendly at first, defensive when challenged.
- **Positive triggers:** Clear scope, timely decisions, fair issue resolution.
- **Negative triggers:** Informal requests treated as contractual obligations.

#### Naomi Brooks — UX Research and Design Lead

- **Influence:** Medium.
- **Primary goals:** Deliver an accessible and intuitive customer experience.
- **Concerns:** Designing from internal assumptions, insufficient user testing, accessibility debt.
- **Communication preference:** Research findings, prototypes, facilitated workshops.
- **Behavior:** Evidence-driven and customer-focused.
- **Positive triggers:** Pilot participation, usability testing, willingness to revise.
- **Negative triggers:** Treating design as decoration, ignoring accessibility findings.

#### Jordan Ellis — QA and UAT Lead

- **Influence:** High during readiness.
- **Primary goals:** Protect release quality and establish clear acceptance evidence.
- **Concerns:** Compressed testing, unresolved severity-one defects, unstable environments.
- **Communication preference:** Defect data, acceptance criteria, readiness evidence.
- **Behavior:** Methodical; becomes firm when pressured to lower standards.
- **Positive triggers:** Clear quality thresholds, defect ownership, realistic testing time.
- **Negative triggers:** Reclassifying defects to protect the date, incomplete environments.

### 8.3 Customer Personas

#### Maya Thompson — Enterprise Account Administrator

- Manages 600 users across multiple business units.
- Needs account-level visibility and delegation.
- Values reliability, access control, and clear status.

#### Carlos Vega — Small-Business Owner

- Uses NorthStar without dedicated IT support.
- Needs simple language, fast resolution, and mobile-friendly workflows.
- Becomes frustrated by technical terminology.

#### Hannah Lee — Finance Operations Analyst

- Frequently downloads invoices and verifies subscription information.
- Values search, speed, and data accuracy.

#### David Green — Long-Term Frustrated Customer

- Has experienced repeated support delays.
- Distrusts corporate promises.
- Will respond positively to ownership and visible improvement, not generic apologies.

Customer personas may participate in interviews, prototype reviews, UAT, pilot feedback, complaints, and post-launch surveys.

---

## 9. Project and Learning Metrics

### 9.1 Project Health Metrics

Track each measure from 0 to 100 unless otherwise specified:

- Scope stability.
- Schedule confidence.
- Budget health.
- Product quality.
- Security readiness.
- Team morale.
- Operational readiness.
- Executive confidence.
- Customer value confidence.
- Benefits confidence.

### 9.2 Customer Satisfaction Model

Customer satisfaction should not be directly assigned by AI dialogue. It is calculated from project conditions.

Suggested weighted model:

| Component | Weight |
|---|---:|
| Product quality | 25% |
| Usability and accessibility | 20% |
| Reliability and performance | 15% |
| Issue resolution experience | 15% |
| Customer communication | 10% |
| Delivered customer value | 15% |

Customer conversations and feedback modify the component scores, not the final CSAT number directly.

### 9.3 Stakeholder Engagement Model

Overall stakeholder engagement is derived from individual stakeholder relationships and behavior.

Suggested factors:

- Timeliness of communication.
- Stakeholder inclusion at appropriate decisions.
- Response quality.
- Follow-through on commitments.
- Alignment with communication preference.
- Quality of conflict resolution.
- Number and severity of surprises.
- Participation in required workshops and approvals.

### 9.4 Communication Evaluation

Each meaningful learner message may be scored on applicable dimensions:

- Clarity.
- Relevance.
- Audience fit.
- Empathy.
- Transparency.
- Ownership.
- Actionability.
- Professionalism.
- Risk awareness.
- Decision quality.

The evaluator must distinguish between **communication quality** and **project-management judgment**. A polished message can still contain a poor commitment or decision.

### 9.5 PM Competency Tracking

Each activity may contribute to multiple competency areas:

- Integration.
- Scope.
- Schedule.
- Cost.
- Quality.
- Resources and team leadership.
- Communications.
- Risk.
- Procurement.
- Stakeholder engagement.
- Business value.
- Systems thinking.
- Adaptability.
- Leadership and influence.

Edition-specific PMBOK labels should be mapped through the platform's maintained learning taxonomy rather than hard-coded into narrative content.

---

## 10. Seven-Chapter Simulation Storyline

## Chapter 1 — The Assignment

### Story Theme

**Understand before acting.**

### In-World Timing

Project week 1.

### Lifecycle Emphasis

Initiation, business understanding, stakeholder discovery, and governance setup.

### Opening Experience

The learner arrives at NorthStar as the newly assigned Project Manager for Project Horizon. The previous project lead left unexpectedly after the initial business case was approved. Expectations are high, but key project details remain unresolved.

The simulation opens at **8:15 AM** in Mission Control.

### Initial Workspace State

The learner sees:

- A welcome message from Maya.
- An email from Elena Martinez, the executive sponsor.
- A kickoff meeting invitation.
- A business-case document marked "Approved with Conditions."
- A draft charter with missing success criteria.
- Four stakeholder introductions.
- A dashboard with incomplete baseline information.

### Proactive Stakeholder Activity

1. **Elena Martinez emails:** She expects the learner to establish clarity and credibility before the kickoff.
2. **Daniel Cho sends a chat:** Engineering has not validated the target launch date.
3. **Priya Shah sends a message:** Customer Support was not involved in the original business case.
4. **Robert Kim requests:** An explanation of how benefits will be measured.

### Required Learner Activities

The learner must:

1. Review the business case.
2. Identify missing or weak assumptions.
3. Clarify business objectives and measurable success criteria.
4. Prepare for and lead the kickoff meeting.
5. Build or validate the initial stakeholder register.
6. Record initial risks, assumptions, issues, and dependencies.
7. Establish initial communication expectations.
8. Respond to at least two stakeholder messages.

### Kickoff Meeting Scenario

Participants:

- Elena Martinez.
- Marcus Reed.
- Priya Shah.
- Daniel Cho.
- Aisha Rahman.
- Robert Kim.

Meeting tensions:

- Elena emphasizes the promised launch window.
- Marcus promotes a feature-rich customer experience.
- Daniel states that the timeline has not been technically validated.
- Priya asks who owns knowledge content and support training.
- Aisha asks when security architecture will be reviewed.
- Robert asks whether the benefits forecast has accountable owners.

The learner must set a collaborative tone without making unsupported commitments.

### Key Decisions

- Whether to confirm, qualify, or challenge the target date.
- Whether Security and Customer Support are core team members or later reviewers.
- How success is defined.
- Which uncertainties require immediate investigation.

### Required Outputs

- Updated project-charter draft.
- Initial stakeholder register.
- Initial RAID entries.
- Communication cadence proposal.
- Kickoff decisions and action log.

### Maya Coaching

Maya should intervene only when:

- The learner makes an unsupported guarantee.
- A critical stakeholder is excluded.
- No measurable success criteria are defined.
- The learner ignores a high-priority message.
- The learner asks for help.

Example coaching:

> You can acknowledge the date without guaranteeing it. A strong response would separate the executive target from the team's current confidence level and identify what must be validated next.

### Scoring Emphasis

- Business understanding.
- Stakeholder identification.
- Executive communication.
- Transparency.
- Leadership tone.
- Risk awareness.
- Integration.

### Persistent Consequences

- Including Aisha early increases security readiness and reduces the probability of a severe late finding.
- Excluding Priya lowers operational readiness and makes Day 6 training risk more severe.
- Guaranteeing the date creates a formal commitment that can be challenged later.
- Defining benefits owners improves Finance engagement and final benefits confidence.
- Failing to document assumptions makes later disputes more difficult to resolve.

### End-of-Chapter Reflection

The learner receives:

- A concise performance summary.
- Emerging risks.
- Stakeholder relationship movements.
- Open commitments.
- A short PM concept explanation tied to actual decisions.

### Cliffhanger

At **5:42 PM**, Elena forwards an executive news alert:

> Our largest competitor launched an AI-enabled customer portal this afternoon. The CEO wants an impact assessment and recommendation by tomorrow morning.

---

## Chapter 2 — Planning Under Competitive Pressure

### Story Theme

**Build a credible plan while the target is moving.**

### In-World Timing

Project weeks 2–3.

### Lifecycle Emphasis

Integrated planning, requirements discovery, estimation, risk planning, communications, and benefits alignment.

### Opening Condition

The competitor announcement increases executive urgency. Marketing and Sales argue that NorthStar must match or exceed the competitor's visible features.

### Proactive Stakeholder Activity

1. **Elena requests** a competitor-impact briefing.
2. **Sofia Bennett sends** a list of features allegedly required to protect enterprise renewals.
3. **Marcus asks** to add AI recommendations to the MVP.
4. **Daniel warns** that estimates depend on integration and authentication discovery.
5. **Aisha requests** a threat-modeling workshop.
6. **Robert asks** whether the original ROI still holds if scope expands.

### Required Learner Activities

1. Produce an executive impact assessment.
2. Facilitate a customer-needs or requirements workshop.
3. Separate needs, requirements, assumptions, and solution ideas.
4. Prioritize MVP features.
5. Create a high-level WBS or backlog structure.
6. Develop an initial schedule and milestone plan.
7. Create an initial cost forecast and reserve strategy.
8. Develop risk and communication plans.
9. Assign benefits owners.
10. Define decision and change-control expectations.

### Customer Interaction

The learner conducts discovery with at least two customer personas.

The evaluation checks whether the learner:

- Uses open-ended questions.
- Avoids leading customers toward preselected solutions.
- Distinguishes pain points from requested features.
- Confirms understanding.
- Captures acceptance and usability needs.

### Key Decisions

- Whether AI recommendations belong in the MVP.
- Whether to protect the target date by reducing scope.
- How much contingency to reserve.
- Whether to initiate early security and vendor discovery.
- Whether to formally establish a change authority.

### Required Outputs

- Competitor-impact assessment.
- Prioritized MVP scope.
- Initial WBS or product backlog.
- Milestone schedule.
- Budget forecast.
- Risk register update.
- Communications plan.
- Benefits map.

### Maya Coaching

Maya should warn when:

- Scope expands without time, cost, or capacity adjustments.
- The learner treats executive urgency as evidence.
- The plan contains precise dates without adequate estimation confidence.
- Customer needs are replaced by stakeholder opinions.

### Scoring Emphasis

- Scope definition.
- Requirements quality.
- Planning integration.
- Risk planning.
- Cost and schedule judgment.
- Customer focus.
- Stakeholder facilitation.

### Persistent Consequences

- Adding AI to the MVP increases customer-value potential but raises technical, privacy, and schedule risk.
- Early vendor discovery exposes contract ambiguity sooner.
- Weak customer discovery reduces later usability scores.
- Failure to define change control allows informal requests to accumulate.
- Unrealistic schedule compression increases team stress and defect risk.

### Cliffhanger

Daniel submits the technical-discovery report. Two major assumptions are invalid:

1. The existing identity service cannot support required enterprise delegation without additional work.
2. The invoice API has performance and data-quality limitations.

The current plan is no longer credible without a decision.

---

## Chapter 3 — The Project Changes Shape

### Story Theme

**There is no perfect option; leadership means making the trade-off visible.**

### In-World Timing

Project weeks 4–5.

### Lifecycle Emphasis

Scope alignment, baseline approval, integrated change control, negotiation, procurement clarification, and stakeholder alignment.

### Opening Condition

The technical-discovery findings create a scope, cost, and schedule conflict. At the same time, stakeholders continue requesting additions.

### Proactive Stakeholder Activity

1. **Sofia escalates** that a major renewal depends on CRM integration.
2. **Marcus requests** that live chat remain in the MVP.
3. **Priya argues** that knowledge content is more important than advanced AI.
4. **Aisha states** that enterprise delegation changes the security design.
5. **Robert asks** for revised forecast scenarios.
6. **Liam claims** that the new integration work is outside vendor scope.
7. **Elena asks:** "Can we still hit the date?"

### Required Learner Activities

1. Analyze impacts of the failed assumptions.
2. Prepare at least three delivery scenarios.
3. Facilitate a scope and trade-off workshop.
4. Negotiate priorities and decision rights.
5. Process formal change requests.
6. Update scope, schedule, budget, risk, and benefits information.
7. Clarify vendor obligations and acceptance criteria.
8. Establish the approved baseline.
9. Communicate the decision to affected stakeholders.

### Example Delivery Scenarios

- **Scenario A:** Protect date; reduce MVP scope.
- **Scenario B:** Protect scope; move launch date.
- **Scenario C:** Increase budget and capacity; retain most scope with higher execution risk.

No scenario should be universally correct. The quality of analysis, communication, and alignment matters.

### Key Decisions

- What to remove, defer, or fund.
- Whether to escalate a date change.
- Whether to approve vendor change costs.
- How to communicate an unpopular decision.
- Whether to use phased launch or pilot release.

### Required Outputs

- Options analysis.
- Formal change request records.
- Approved scope baseline or prioritized backlog.
- Updated schedule and cost baseline.
- Vendor action or contract clarification.
- Decision log.
- Stakeholder communication.

### Maya Coaching

Maya should help the learner distinguish:

- A request from an approved change.
- A target from a validated forecast.
- Stakeholder satisfaction from stakeholder alignment.
- Fast agreement from sustainable commitment.

### Scoring Emphasis

- Integrated change control.
- Negotiation.
- Executive recommendation.
- Scope discipline.
- Commercial awareness.
- Stakeholder alignment.
- Systems thinking.

### Persistent Consequences

- Informally accepting Sales requests increases scope volatility.
- Rejecting requests without alternatives reduces alignment and trust.
- A phased launch reduces immediate scope but creates transition complexity.
- Failure to clarify the vendor contract increases Day 4 delivery risk.
- Honest reforecasting may reduce short-term satisfaction but increase trust and confidence.

### Cliffhanger

The baseline is approved, but the vendor reports that its lead integration engineer will be unavailable for three weeks. Daniel also reports that the internal team is already near capacity.

Execution begins under pressure.

---

## Chapter 4 — Plans Meet Reality

### Story Theme

**A plan does not deliver the project; people do.**

### In-World Timing

Project weeks 6–10.

### Lifecycle Emphasis

Execution, team leadership, communications, quality management, vendor coordination, issue resolution, and continuous monitoring.

### Opening Condition

Development is underway. Early progress appears positive, but capacity pressure, vendor delays, and unclear ownership begin affecting delivery.

### Proactive Stakeholder Activity

1. **Daniel reports** overloaded team members and growing technical debt.
2. **Liam requests** a milestone adjustment because of vendor staffing.
3. **Naomi shares** usability-test evidence that customers cannot understand the ticket-status workflow.
4. **Marcus resists** redesign because it may affect the sprint goal.
5. **Priya reports** that support agents disagree with the planned knowledge structure.
6. **Elena requests** a status update before the steering committee.
7. **A team member privately reports** conflict and burnout.

### Required Learner Activities

1. Run or participate in a daily coordination meeting.
2. Address resource overload and team conflict.
3. Review iteration or milestone progress.
4. Resolve vendor delivery issues.
5. Assess usability evidence.
6. Update forecasts and risks.
7. Prepare an executive status update.
8. Decide whether to accept, correct, or defer emerging quality concerns.
9. Track actions and commitments.

### Communication Scenarios

- Difficult conversation with the vendor.
- One-on-one with an overloaded team member.
- Executive status briefing.
- Negotiation between Product and UX.

### Key Decisions

- Whether to protect the team by reducing work in progress.
- Whether to redesign the confusing workflow.
- Whether to escalate vendor performance.
- Whether to report a forecast decline before certainty is complete.
- Whether to use contingency.

### Required Outputs

- Updated status report.
- Issue log.
- Resource and workload action plan.
- Vendor recovery plan.
- Usability decision.
- Updated forecast.

### Maya Coaching

Maya should respond to patterns, not isolated mistakes. Examples:

- Repeatedly delaying difficult conversations.
- Overcommitting the team.
- Reporting activity rather than outcomes.
- Ignoring customer evidence to protect schedule.

### Scoring Emphasis

- Team leadership.
- Communication.
- Quality judgment.
- Forecast accuracy.
- Vendor management.
- Conflict resolution.
- Customer focus.

### Persistent Consequences

- Ignoring usability findings lowers adoption and customer satisfaction later.
- Protecting team capacity improves quality and morale but may reduce short-term throughput.
- Hiding forecast deterioration reduces sponsor trust when discovered.
- Strong vendor management can recover part of the schedule.
- Poor conflict handling increases turnover or absence risk.

### Cliffhanger

During a late integration test, QA identifies inconsistent authorization behavior. A customer administrator may be able to view another account's invoice under a rare sequence of conditions.

Aisha requests an immediate security review.

---

## Chapter 5 — The Trust Crisis

### Story Theme

**The technical issue is serious; the leadership issue is whether people can trust the response.**

### In-World Timing

Project weeks 11–12.

### Lifecycle Emphasis

Risk response, issue management, quality control, security escalation, integrated change control, executive communication, and recovery planning.

### Opening Condition

The authorization defect is confirmed as a high-severity security issue. The launch campaign is already in preparation, and the steering committee expects a readiness update.

The severity and recoverability depend on previous decisions:

- Early security involvement reduces investigation time.
- Strong architecture documentation helps isolate the defect.
- Weak change control may have introduced undocumented dependencies.
- Low sponsor trust makes escalation more difficult.
- Burned-out teams recover more slowly.

### Proactive Stakeholder Activity

1. **Aisha demands** containment, investigation, and evidence before further approval.
2. **Elena asks** whether the CEO must be informed immediately.
3. **Marketing asks** whether campaign materials should be paused.
4. **Robert asks** for cost and contingency impact.
5. **Daniel requests** temporary scope freeze and additional testing support.
6. **Liam disputes** whether the defect originated in vendor code.
7. **Priya warns** that support teams are already preparing customers for launch.

### Required Learner Activities

1. Classify and contain the issue.
2. Establish an incident or crisis response structure.
3. Determine who must be informed and when.
4. Protect evidence and avoid unsupported conclusions.
5. Develop recovery options.
6. Quantify schedule, cost, quality, and customer impacts.
7. Lead an executive escalation meeting.
8. Decide whether to pause campaign or launch activity.
9. Update risks, issues, forecasts, and commitments.
10. Communicate with affected teams.

### Recovery Options

- Fix and complete full regression before launch.
- Remove or disable the affected capability.
- Restrict launch to a controlled pilot.
- Delay launch.
- Proceed under explicit accepted risk only if evidence supports it.

The engine must reject impossible or unsafe options when governance rules prohibit them.

### Key Decisions

- Speed versus evidence.
- Transparency versus reputation fear.
- Scope reduction versus delay.
- Vendor accountability versus collaborative recovery.
- Whether to use remaining contingency.

### Required Outputs

- Security issue record.
- Containment and recovery plan.
- Executive briefing.
- Updated forecast and readiness status.
- Decision log.
- Stakeholder communications.

### Maya Coaching

Maya should remain calm and concise. She may ask:

- What facts are confirmed?
- What assumptions are being treated as facts?
- Who is exposed if you wait?
- Which decision is reversible?
- What evidence is required before approval?

She must not tell the learner to conceal, minimize, or bypass security concerns.

### Scoring Emphasis

- Crisis leadership.
- Risk judgment.
- Transparency.
- Security and quality governance.
- Executive communication.
- Decision discipline.
- Emotional control.

### Persistent Consequences

- Transparent escalation may reduce immediate satisfaction but protect trust.
- Concealing or minimizing the defect causes severe trust and final-score penalties.
- A controlled pilot can preserve learning while limiting exposure.
- Blaming the vendor without evidence damages cooperation.
- Clear containment and ownership improve confidence.

### Cliffhanger

The technical fix is available, but full regression testing and UAT cannot both be completed within the original launch window. The executive steering committee schedules a formal Go/No-Go readiness review.

---

## Chapter 6 — Recovery and Readiness

### Story Theme

**Readiness is evidence, not optimism.**

### In-World Timing

Project weeks 13–14.

### Lifecycle Emphasis

Recovery execution, UAT, quality assurance, operational transition, training, stakeholder alignment, and readiness governance.

### Opening Condition

The learner must coordinate recovery while rebuilding confidence. Stakeholder behavior reflects the relationship history created across the previous chapters.

### Proactive Stakeholder Activity

1. **Jordan reports** regression progress and unresolved defects.
2. **Priya reports** incomplete training and knowledge articles.
3. **Naomi presents** final usability and accessibility findings.
4. **Aisha requests** security verification evidence.
5. **Elena asks** for a clear recommendation, not a status summary.
6. **Sofia pushes** to preserve the public date.
7. **Pilot customers provide** mixed feedback.

### Required Learner Activities

1. Review UAT results.
2. Evaluate defect severity and acceptance thresholds.
3. Confirm operational support readiness.
4. Confirm training, communications, and knowledge content.
5. Review security evidence.
6. Prepare a readiness dashboard.
7. Facilitate the Go/No-Go meeting.
8. Make and defend a launch recommendation.
9. Create contingency, rollback, and hypercare plans.
10. Communicate the decision.

### Readiness Dimensions

- Product stability.
- Security approval.
- Data quality.
- Customer usability.
- Support readiness.
- Training completion.
- Monitoring and incident response.
- Rollback capability.
- Stakeholder acceptance.

### Key Decisions

- Full launch, pilot, delay, or phased release.
- Which defects may be accepted.
- Whether support readiness is sufficient.
- Whether business pressure outweighs residual risk.
- How to communicate a delay or constrained launch.

### Required Outputs

- Go/No-Go recommendation.
- Readiness checklist and evidence package.
- Rollback plan.
- Hypercare plan.
- Customer and internal communications.
- Updated risk and issue status.

### Maya Coaching

Maya should challenge unsupported confidence and remind the learner to distinguish:

- Completed work from verified readiness.
- Stakeholder pressure from decision evidence.
- Residual risk from unresolved uncertainty.

### Scoring Emphasis

- Readiness judgment.
- Quality and risk governance.
- Operational planning.
- Customer communication.
- Executive influence.
- Evidence-based decision-making.

### Persistent Consequences

- Strong Support involvement improves operational readiness.
- Ignored usability findings reduce pilot satisfaction.
- Weak commitment tracking results in missing launch tasks.
- High trust increases executive willingness to accept a difficult recommendation.
- Low trust causes more aggressive questioning and reduced flexibility.

### Cliffhanger

The steering committee accepts the learner's recommendation. The launch path is now fixed: full release, phased release, pilot, or delay.

At **11:18 PM before launch**, the monitoring team reports an unusual spike in failed login attempts in the production environment. The learner must decide whether it is expected traffic, a configuration issue, or a security concern requiring escalation.

---

## Chapter 7 — Launch, Transition, and Executive Review

### Story Theme

**Project success is what the organization and customer can sustain after the project team leaves.**

### In-World Timing

Project weeks 15–16.

### Lifecycle Emphasis

Deployment, transition, customer communication, stabilization, acceptance, benefits tracking, knowledge transfer, lessons learned, and closure.

### Opening Condition

The final chapter begins with the pre-launch anomaly. The learner must use evidence and the agreed escalation process before proceeding.

The chapter branches based on the approved launch path and project state.

### Possible Launch Outcomes

#### Outcome A — Controlled Successful Launch

- High readiness.
- Strong customer communication.
- Manageable issues.
- High executive confidence.

#### Outcome B — Successful but Difficult Launch

- Portal launches with service disruption, elevated ticket volume, or reduced initial adoption.
- Hypercare and communication quality determine recovery.

#### Outcome C — Responsible Delay or Pilot

- The learner protects customers through a defensible delay or constrained release.
- Short-term stakeholder disappointment may coexist with high leadership and risk scores.

#### Outcome D — Failed or Unsafe Launch

- Major unresolved risks were ignored.
- Customer impact, trust loss, and executive scrutiny are severe.
- The learner must still lead containment and lessons learned.

### Proactive Stakeholder Activity

1. **Customers submit** feedback and support requests.
2. **Priya reports** operational impact.
3. **Aisha monitors** security conditions.
4. **Elena requests** an executive summary.
5. **Robert requests** updated benefits and cost outlook.
6. **Marcus reviews** adoption and feature feedback.
7. **Daniel reports** technical stability and team condition.

### Required Learner Activities

1. Resolve the pre-launch anomaly.
2. Execute or pause the launch according to evidence.
3. Coordinate hypercare.
4. Prioritize early incidents and customer issues.
5. Communicate with customers and executives.
6. Obtain acceptance or document remaining obligations.
7. Transition ownership to operations and Product.
8. Conduct lessons learned.
9. Update the benefits-realization plan.
10. Deliver the final executive review.

### Final Executive Review

Executives ask dynamic questions based on actual project history, such as:

- Why did the forecast change?
- Which early assumption caused the greatest impact?
- Why was Security involved at that point?
- How did customer evidence affect scope?
- Why did you recommend launch, pilot, or delay?
- Which stakeholder relationship helped or hurt recovery?
- What benefits remain uncertain?
- What would you do differently?

### Required Outputs

- Launch or stabilization report.
- Transition and ownership plan.
- Lessons-learned register.
- Final project performance report.
- Benefits-realization plan.
- Executive presentation.
- Personal reflection.

### Maya Final Coaching

Maya provides a narrative review, not merely a score:

- Strongest leadership behaviors.
- Decisions that created positive downstream effects.
- Missed signals and avoidable consequences.
- Communication patterns.
- PM competency strengths.
- Personalized next learning priorities.

### Final Outcome Measures

- Project success.
- Business-value confidence.
- Customer satisfaction.
- Stakeholder trust and alignment.
- Team health.
- Security and quality outcome.
- Operational readiness.
- Leadership effectiveness.
- PM competency mastery.

---

## 11. Consequence and Memory Framework

### 11.1 Commitment Memory

When the learner makes a promise, the system creates a structured commitment:

```json
{
  "owner": "learner",
  "stakeholderId": "elena-martinez",
  "description": "Provide revised schedule confidence before steering committee",
  "dueSimulationTime": "chapter-3-before-steering",
  "status": "open",
  "importance": "high",
  "sourceInteractionId": "message-id"
}
```

Completed commitments increase trust and confidence. Missed commitments increase frustration and may trigger follow-up messages or executive questioning.

### 11.2 Structured Stakeholder Memory

Stakeholder memory should store concise facts rather than relying only on raw chat history.

Examples:

- Learner reported bad news early.
- Learner excluded Security from planning.
- Learner rejected live chat but offered a phased alternative.
- Learner promised a forecast update.
- Learner blamed the vendor without evidence.
- Learner protected the team from unreasonable workload.

### 11.3 Example Consequence Chains

#### Security Chain

Early Security involvement  
→ better threat understanding  
→ faster defect diagnosis  
→ lower recovery time  
→ stronger Go/No-Go evidence.

#### Scope Chain

Informal feature acceptance  
→ scope volatility  
→ team overload  
→ reduced testing time  
→ higher defect probability  
→ weaker launch readiness.

#### Sponsor Trust Chain

Proactive risk communication  
→ increased sponsor trust  
→ greater flexibility during crisis  
→ stronger support for responsible delay or pilot.

#### Customer Voice Chain

Weak customer discovery  
→ incorrect assumptions  
→ poor usability  
→ low adoption  
→ reduced benefits realization.

---

## 12. AI Stakeholder Conversation Rules

### 12.1 Agent Inputs

Every stakeholder response should be grounded in:

- Stakeholder profile.
- Current chapter and simulation time.
- Current project state.
- Facts known to that stakeholder.
- Stakeholder objectives and concerns.
- Relationship state.
- Structured memories.
- Recent relevant messages.
- Open commitments.
- Allowed actions and response constraints.

### 12.2 Agent Restrictions

Stakeholder agents must not:

- Invent authoritative project facts.
- Change project scores directly.
- Approve changes without permission from the simulation rules.
- Reveal information the stakeholder should not know.
- Resolve tasks for the learner.
- contradict approved documents or deterministic project state.

### 12.3 Separate Response and Evaluation

Use separate operations:

1. Evaluate the learner message against a rubric.
2. Calculate deterministic relationship and project effects.
3. Generate the stakeholder response using the updated state.
4. Create structured actions, commitments, or events when allowed.

The same AI output should not control dialogue, scoring, and project truth simultaneously.

---

## 13. Maya Coaching Framework

### 13.1 Maya's Role

Maya is a project leadership coach embedded in the workplace. She does not play the simulation for the learner.

### 13.2 Coaching Levels

#### Level 1 — Subtle Nudge

Used for minor omissions or emerging patterns.

> The sponsor asked for a recommendation. Your draft explains the problem, but it does not yet state what you think should happen.

#### Level 2 — Reflective Question

Used when the learner needs to reason through a trade-off.

> Which part of this commitment is supported by evidence, and which part is still an assumption?

#### Level 3 — Risk Warning

Used when the learner is about to create a major avoidable consequence.

> Proceeding without Security review may preserve the schedule today, but it could remove your ability to defend launch readiness later.

#### Level 4 — Learning Debrief

Used after an interaction or chapter.

> You maintained trust even though the stakeholder disliked the outcome. That happened because you explained the trade-off, owned the decision, and gave a clear next step.

### 13.3 Maya Trigger Rules

Maya may be triggered by:

- Unsupported commitments.
- Ignored high-priority risks.
- Repeatedly poor communication patterns.
- Stakeholder escalation.
- Missed commitments.
- Learner request for coaching.
- End-of-activity reflection.
- End-of-chapter review.

Maya should not interrupt every interaction. Excessive coaching reduces immersion.

---

## 14. Chapter Completion Rules

A chapter is complete only when:

1. Required activities are completed.
2. Required decisions are recorded.
3. Required deliverables are submitted or updated.
4. Critical stakeholder communications are addressed.
5. Required risks or issues are acknowledged.
6. The chapter reflection is completed.
7. The simulation engine applies consequences and advances the in-world timeline.

The learner should not be able to complete a chapter merely by clicking through screens.

---

## 15. Content Asset Inventory

Each chapter should eventually include the following authored assets:

- Morning briefing.
- Mission summary.
- Business news item.
- Inbox messages.
- Team-chat messages.
- Calendar events.
- Meeting agendas.
- Stakeholder opening statements.
- Dynamic follow-up questions.
- Documents and document templates.
- Required tasks.
- Decision points.
- Event triggers.
- Consequence rules.
- Communication rubrics.
- Maya prompts.
- Reflection questions.
- End-of-chapter summary.
- Cliffhanger.

---

## 16. Implementation Contract for Lovable and GitHub Copilot

When implementing this business case:

1. Read `AGENTS.md` and the Simulation Design Blueprint first.
2. Preserve existing functionality.
3. Reuse existing simulation, messaging, scoring, and UI components.
4. Keep the simulation engine generic.
5. Store business-case content as data or configuration, not case-specific branching scattered through application code.
6. Use stable identifiers for chapters, stakeholders, activities, events, metrics, and consequences.
7. Keep authoritative scoring and state changes on the server.
8. Treat AI dialogue as an interface to the simulation, not the simulation itself.
9. Make chapter progression action-based, not real-time based.
10. Log every material decision, commitment, score effect, and state transition.
11. Ensure each chapter can be tested independently with deterministic fixtures.
12. Do not implement all seven chapters in a single uncontrolled change. Build and validate one complete chapter at a time.

---

## 17. Recommended First Implementation Slice

Implement **Chapter 1 — The Assignment** end to end before building later chapters.

The first slice should prove:

- Mission Control opens with the correct simulation state.
- Inbox and chat events are proactive.
- The learner can respond to stakeholders.
- Communication is evaluated separately from dialogue generation.
- Relationship values update.
- Commitments are created and tracked.
- Required activities control chapter completion.
- Maya provides contextual coaching.
- Project state persists.
- The competitor cliffhanger unlocks Chapter 2.

Once Chapter 1 is stable, its structure becomes the reusable template for Chapters 2–7 and future business cases.

---

## 18. Definition of a Successful Simulation

The Customer Self-Service Portal simulation is successful when:

- The learner experiences one continuous project rather than seven disconnected lessons.
- Stakeholders behave differently based on role, objectives, memory, and relationship history.
- Communication changes stakeholder behavior and project outcomes.
- Customer satisfaction is linked to quality, usability, reliability, communication, and value.
- Early decisions visibly affect later events.
- Maya improves learning without removing learner ownership.
- The final executive review reflects the learner's actual project history.
- Multiple defensible paths can succeed.
- A responsible delay or controlled pilot may score better than an unsafe on-time launch.
- The learner can explain not only what happened, but why it happened.

