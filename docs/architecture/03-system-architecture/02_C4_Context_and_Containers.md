# C4 Context and Container Architecture

**Document ID:** PS-ARCH-002  
**Version:** 1.0  
**Status:** Approved

## System Context

```mermaid
flowchart LR
    Learner[Learner] --> Web[ProjectSim Web App]
    Instructor[Instructor] --> Web
    Admin[Enterprise Admin] --> Web
    Web --> Platform[ProjectSim Platform]
    Platform --> AI[AI Providers]
    Platform --> Notify[Notification Providers]
    Platform --> LMS[LMS and Enterprise Integrations]
```

## Container View

```mermaid
flowchart TB
    WEB[Web Application]
    API[Application API]
    RUNTIME[Simulation Runtime]
    CORE[Core Simulation]
    CONTENT[Content Service]
    PROJ[Projection Service]
    AI[AI Orchestration]
    ANALYTICS[Analytics Service]
    REPORT[Reporting Service]
    DB[(PostgreSQL)]
    STORAGE[(Object Storage)]
    OUTBOX[(Event Outbox)]
    AUTH[Supabase Auth]

    WEB --> API
    API --> AUTH
    API --> RUNTIME
    RUNTIME --> CORE
    RUNTIME --> CONTENT
    RUNTIME --> DB
    CORE --> OUTBOX
    OUTBOX --> PROJ
    OUTBOX --> ANALYTICS
    OUTBOX --> AI
    OUTBOX --> REPORT
    PROJ --> DB
    AI --> STORAGE
    CONTENT --> STORAGE
```

## Container Responsibilities

- **Web Application:** rendering, accessibility, navigation, local interaction state
- **Application API:** authentication context, authorization, validation, command/query dispatch
- **Simulation Runtime:** sequencing, idempotency, replay, checkpoints, scheduling
- **Core Simulation:** rules, consequences, project state, progress, completion
- **Projection Service:** read models for Mission Control, Inbox, Meetings, Learning, Reports
- **AI Orchestration:** grounding, routing, validation, fallback
- **Analytics:** derived metrics, trends, insights, forecasts

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial C4 model |
