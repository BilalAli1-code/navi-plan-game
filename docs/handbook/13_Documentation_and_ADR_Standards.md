# Documentation and ADR Standards

**Document ID:** PS-ENG-013  
**Version:** 1.0  
**Status:** Approved

## Documentation Requirements

Code changes should update:

- Package README
- API documentation
- Architecture documentation
- Operational runbooks
- Migration notes
- ADRs where needed

## ADR Template

```markdown
# ADR-XXX: Decision Title

## Status
Proposed | Accepted | Deprecated | Superseded

## Context

## Decision

## Alternatives Considered

## Consequences

## Migration Plan

## References
```

## ADR Triggers

Create an ADR for:

- New infrastructure platform
- New state-management approach
- New persistence strategy
- New API style
- New event-delivery model
- New AI-provider policy
- Changes to package boundaries
- Changes to security or tenancy model

## Rule

Architecture-changing code without corresponding documentation is incomplete.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial documentation and ADR standards |
