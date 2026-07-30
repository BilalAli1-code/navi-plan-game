# Application Shell and Navigation

**Document ID:** PS-UI-002  
**Version:** 1.0  
**Status:** Approved

## Application Shell

The application shell owns:

- Global navigation
- Program and Simulation Run context
- Global notifications
- User menu
- Route boundaries
- Error boundaries
- Loading boundaries
- Accessibility landmarks

## Recommended Navigation

```text
Program
Mission Control
Workplace
├── Inbox
├── Meetings
├── Stakeholders
├── Documents
├── Decisions
└── Risks & Issues
Learning
Reports
Maya
```

## Navigation Rules

1. Mission Control is the operational summary.
2. Program shows curriculum, progression, and learning schedule.
3. Workplace contains operational channels.
4. Decisions are not duplicated as separate business objects across tabs.
5. Completed items remain accessible through archives or filters.
6. Navigation badges use projection counts.
7. A badge count must have one documented meaning.
8. Locked destinations explain prerequisites.
9. Deep links preserve Simulation Run context.
10. Browser back and forward behavior must remain predictable.

## Route Model

```text
/app/programs
/app/programs/:programId
/app/runs/:runId/mission-control
/app/runs/:runId/inbox
/app/runs/:runId/meetings
/app/runs/:runId/stakeholders
/app/runs/:runId/documents
/app/runs/:runId/decisions
/app/runs/:runId/learning
/app/runs/:runId/reports
```

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial shell and navigation architecture |
