# Workplace Experience Architecture

**Document ID:** PS-UI-005  
**Version:** 1.0  
**Status:** Approved

## Purpose

Define the professional workspace in which learners handle emails, meetings, stakeholder interactions, decisions, risks, and issues.

## Inbox

- Separate informational and action-required messages
- Show linked decision status
- Preserve archived messages
- Support search and filtering
- Never count informational messages as pending decisions

## Meetings

- Show preparation, attendance, decisions, and follow-up
- Link agenda items to decisions or activities
- Preserve completed meeting records
- Display unresolved commitments

## Stakeholders

- Preserve complete conversation history
- Show relationship summaries without exposing hidden simulation variables
- Distinguish messages, negotiations, escalations, and follow-ups
- Change behavior and content based on chapter and project state

## Decision Log

- One authoritative record per decision
- Pending, resolved, superseded, and rejected states
- Rationale, choice, consequences, and feedback
- Links back to originating email, meeting, or stakeholder interaction

## Risks and Issues

- Separate risk and issue lifecycles
- Show owner, status, probability, impact, response, and history
- Support direct commands rather than generic form updates

## Cross-Surface Rule

Completing a decision updates every surface through shared projections; individual tabs do not maintain separate completion state.

## Projection contracts (PS-ROADMAP-009)

Workplace surfaces must consume the shared projection envelope and typed
payloads defined in `docs/architecture/08-workplace-projection-contracts/`
and ADR-006. This UI architecture document remains the experience blueprint;
PS-009 does not implement workplace UI.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial workplace experience architecture |
| 1.1 | Approved | Link PS-ROADMAP-009 projection contracts |
