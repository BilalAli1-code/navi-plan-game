# UI Risks and ADR Backlog

**Document ID:** PS-UI-016  
**Version:** 1.0  
**Status:** Approved

## Risks

| Risk | Mitigation |
|---|---|
| UI calculates business state | Projection-only contracts |
| Duplicate features across tabs | Clear information architecture |
| Global store becomes authoritative | Query-cache and local-state boundaries |
| Lovable introduces architectural drift | Prompt constraints and PR review |
| Completed records disappear | Archive and history projections |
| Inconsistent counts | Shared projection fields |
| Dense screens overwhelm learners | Progressive disclosure |
| AI appears authoritative | Consistent labeling and visual separation |
| Mobile loses key workflows | Responsive task prioritization |
| Accessibility added too late | Design-system enforcement and automated tests |

## ADR Backlog

- ADR-UI-001: React and TypeScript
- ADR-UI-002: Projection-Driven UI
- ADR-UI-003: TanStack Query for Server State
- ADR-UI-004: React Router for Navigation
- ADR-UI-005: Component-Layer Architecture
- ADR-UI-006: Mission Control as Summary Projection
- ADR-UI-007: Workplace Information Architecture
- ADR-UI-008: Semantic Design Tokens
- ADR-UI-009: WCAG 2.2 AA Target
- ADR-UI-010: Lovable as UI Accelerator
- ADR-UI-011: Storybook for Component Documentation
- ADR-UI-012: Playwright for Critical Journeys

## Review Triggers

Revisit this architecture when native mobile, multiplayer, instructor authoring, white-label themes, or offline simulation become committed roadmap items.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial UI risks and ADR backlog |
