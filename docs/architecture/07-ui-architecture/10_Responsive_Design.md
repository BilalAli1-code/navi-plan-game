# Responsive Design

**Document ID:** PS-UI-010  
**Version:** 1.0  
**Status:** Approved

## Breakpoint Strategy

Use content-driven breakpoints rather than device-specific layouts.

## Layout Priorities

### Large Screens
- Persistent navigation
- Multi-column Mission Control
- Side-by-side context and action panels
- Dense data tables

### Medium Screens
- Collapsible navigation
- Two-column summaries
- Reduced secondary detail

### Small Screens
- Single-column task flow
- Bottom or drawer navigation
- Prioritized actions first
- Tables transformed into cards or horizontal-scroll regions

## Rules

1. Core actions remain available at every supported size.
2. Horizontal scrolling is limited to appropriate data regions.
3. Modals do not exceed viewport constraints.
4. Touch targets meet accessibility guidance.
5. Charts provide mobile summaries.
6. Side panels become routes or drawers on narrow screens.
7. Sticky controls must not hide content.
8. Responsive behavior is tested with real scenario content.
9. Desktop density must not be copied directly to mobile.
10. Mobile support preserves simulation continuity, even when some authoring tools remain desktop-first.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial responsive-design architecture |
