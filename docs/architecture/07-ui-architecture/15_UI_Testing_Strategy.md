# UI Testing Strategy

**Document ID:** PS-UI-015  
**Version:** 1.0  
**Status:** Approved

## Test Layers

### Unit
- Formatters
- Hooks
- Reducers for local interaction state
- Component behavior

### Component
- Loading, empty, error, and populated states
- Keyboard interaction
- Accessibility
- Responsive variants

### Integration
- Projection rendering
- Command submission
- Projection refresh
- Authorization behavior
- Run-context switching

### End-to-End
- Start Simulation Run
- Complete Day 1
- Respond to email decision
- Complete meeting decision
- Verify Decision Log synchronization
- Verify Mission Control progress
- Submit reflection
- Generate final report

### Visual Regression
- Mission Control
- Workplace tabs
- Decision panel
- Stakeholder chat
- Learning dashboard
- Reports

## Critical Consistency Tests

1. A completed decision appears once in Decision Log.
2. Linked email and meeting statuses update.
3. Informational emails do not affect decision counts.
4. Progress updates from completion requirements.
5. Stakeholder history remains after completion.
6. All tabs display consistent projection versions.
7. Duplicate command retries do not create duplicate UI outcomes.

## Definition of Done

A feature requires automated tests, accessibility review, responsive validation, and projection-contract verification.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial UI testing strategy |
