# Code Review Standards

**Document ID:** PS-ENG-010  
**Version:** 1.0  
**Status:** Approved

## Review Priorities

1. Correctness
2. Security
3. Domain alignment
4. Test adequacy
5. Maintainability
6. Observability
7. Performance
8. Style

## Reviewer Questions

- Does this preserve one source of truth?
- Is business logic in the correct layer?
- Are invalid states handled?
- Are retries safe?
- Are tests meaningful?
- Does this change require an ADR?
- Does this expose tenant or learner data?
- Could this break replay?
- Does the UI consume projections?
- Is operational failure visible?

## Review Behavior

- Be specific
- Explain risk
- Distinguish required changes from suggestions
- Avoid style-only blocking comments when automated tooling can enforce style
- Review the whole change, not isolated lines
- Confirm follow-up debt is recorded

## Approval

At least one qualified reviewer approves each PR. Security, architecture, or data review is required when relevant boundaries change.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial code-review standards |
