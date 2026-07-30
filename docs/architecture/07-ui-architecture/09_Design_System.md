# Design System

**Document ID:** PS-UI-009  
**Version:** 1.0  
**Status:** Approved

## Purpose

Create a consistent professional visual language across ProjectSim.

## Foundations

- Color tokens
- Typography
- Spacing
- Borders
- Elevation
- Motion
- Breakpoints
- Focus styles
- Iconography

## Semantic Tokens

```text
surface.default
surface.raised
text.primary
text.secondary
border.default
status.info
status.success
status.warning
status.critical
focus.ring
```

## Component Families

- Navigation
- Inputs
- Feedback
- Data display
- Overlays
- Layout
- Simulation-specific
- Learning-specific
- Reporting-specific

## Rules

1. Use semantic tokens instead of hard-coded colors.
2. Status is never communicated by color alone.
3. Typography hierarchy remains consistent.
4. Components support keyboard and screen-reader use.
5. Dense professional layouts remain readable.
6. Destructive actions require clear confirmation.
7. AI content has a consistent visual marker.
8. Charts include textual summaries.
9. Dark mode may be added without changing semantic meaning.
10. Lovable-generated UI must use the same tokens and components.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial design-system architecture |
