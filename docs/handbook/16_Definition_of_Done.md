# Definition of Done

**Document ID:** PS-ENG-016  
**Version:** 1.0  
**Status:** Approved

## Feature Completion

A feature is complete when:

- Acceptance criteria are satisfied
- Architecture boundaries are respected
- Code is reviewed
- Types pass
- Lint passes
- Tests pass
- Error states are handled
- Authorization is verified
- Accessibility is reviewed
- Observability is included
- Documentation is updated
- Migration impact is addressed
- Preview or staging validation is complete

## Domain Feature

Additionally requires:

- Invariant tests
- Event validation
- Idempotency review
- Replay review
- Projection consistency

## UI Feature

Additionally requires:

- Loading state
- Empty state
- Error state
- Permission state
- Responsive behavior
- Keyboard behavior
- Screen-reader review
- Projection contract validation

## Database Change

Additionally requires:

- Migration
- RLS review
- Backfill plan
- Index review
- Generated types
- Staging validation

## Production Release

Additionally requires:

- Release notes
- Rollback path
- Runbook
- Dashboard and alerts
- Smoke test
- Owner available during launch

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial Definition of Done |
