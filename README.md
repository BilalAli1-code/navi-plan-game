# ProjectSim Master

Build a web application called “ProjectSim – PMBOK Project Management Training Simulator”.

This is a gamified, interactive project management simulation platform based on PMBOK 6th edition processes, PMBOK 7th edition principles, and modern hybrid project management practices.

The goal is to train users to think and act like real project managers through decision-based simulation, AI coaching, and dynamic project outcomes.



🧭 CORE CONCEPT

Users manage a simulated project from Initiation → Planning → Execution → Monitoring & Control → Closing.

At every stage, users:

Receive realistic project situations

Make decisions (3–4 options per scenario)

See immediate impact on project outcomes

Interact with AI-generated stakeholders

Learn PMBOK principles through feedback



🎮 CORE GAME LOOP

Each simulation cycle works like this:

A project situation is presented (event or phase task)

User selects a decision option

System updates project metrics

AI Project Coach explains impact

New situation/event is generated

Repeat until project completion



📊 PROJECT DASHBOARD (REAL-TIME)

Display a live project dashboard that updates after every decision:

Budget (% remaining)

Schedule (Ahead / On Track / Behind)

Scope Stability

Risk Level

Stakeholder Satisfaction

Team Morale

All metrics dynamically change based on user decisions.



🧠 DECISION SYSTEM

Each scenario presents 3–4 choices.

Every choice affects:

Budget

Timeline

Risk exposure

Stakeholder satisfaction

Team morale

Decisions must reflect PMBOK thinking:

Change control

Risk response strategies

Stakeholder engagement

Scope management

Resource management

Include short feedback after each decision explaining consequences.



🤖 AI PROJECT COACH (CORE FEATURE)

Integrate an AI assistant that acts as a Senior Project Manager / PMP Coach.

The AI must:

Evaluate every user decision

Explain alignment or conflict with PMBOK principles

Provide better alternative actions

Simulate stakeholder reactions (Sponsor, Client, Team, Vendor, PMO)

Response format:

Outcome impact

PMBOK principle insight

Coaching recommendation

Tone: professional, realistic, training-focused.



🧩 PROJECT LIFECYCLE STRUCTURE

The simulation is divided into phases:

1. Initiation

Business case

Project charter

Stakeholder identification

2. Planning

WBS

Schedule

Budget

Risk management plan

Communication plan

3. Execution

Team management

Vendor coordination

Deliverable production

4. Monitoring & Control

Performance tracking

Change requests

Issue resolution

5. Closing

Final delivery

Lessons learned

Success evaluation

Users must progress sequentially through phases.



⚠️ RANDOM EVENT ENGINE

Add dynamic project disruptions during simulation, such as:

Scope change request from client

Vendor delays

Budget cuts

Key team member resignation

Regulatory or compliance change

Technical failure or system outage

Each event:

Interrupts workflow

Requires immediate user decision

Impacts project metrics

Creates branching outcomes



🏁 FINAL PROJECT EVALUATION

At the end of each simulation, generate a Project Performance Report:

Include:

Final budget status

Final schedule performance

Stakeholder satisfaction score

Risk management effectiveness

Overall project success score (0–100)

Also include:

What went well

What went wrong

PMBOK principles applied correctly

Areas for improvement

Display results as a certification-style summary:
“Project Simulation Complete – Level: Beginner / Intermediate / Advanced”



🏆 GAMIFICATION LAYER

Add engagement mechanics:

XP points per decision

Levels: Junior PM → Senior PM → Expert PM

Badges:

Risk Manager

Scope Controller

Stakeholder Expert

Performance streak tracking



🎯 DESIGN REQUIREMENTS

Modern SaaS-style dashboard UI

Clean, professional “enterprise simulation” feel

Not a quiz app — feels like real project execution

Responsive layout:

Left: project phases

Center: scenario & decisions

Right: live metrics dashboard



🔥 END GOAL

This application should feel like:

“Flight simulator for project managers”

Users should learn PMBOK concepts by making decisions under realistic project pressure, not reading theory.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2186a3f5-46d4-4873-91ef-0dd01b18d9a7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
