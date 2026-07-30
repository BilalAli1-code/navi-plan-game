# Lovable Implementation Guide

**Document ID:** PS-UI-014  
**Version:** 1.0  
**Status:** Approved

## Purpose

Define how Lovable may accelerate UI implementation without changing ProjectSim architecture.

## Lovable May Generate

- Page layouts
- Responsive structures
- Design-system components
- Form presentation
- Empty, loading, and error states
- Accessible navigation patterns
- Storybook examples
- Visual refinements

## Lovable Must Not

- Create a second business-state store
- Calculate progress from raw logs
- Directly update authoritative Supabase tables
- Hard-code case-specific behavior into components
- Treat informational emails as decisions
- Delete completed conversation history
- Introduce duplicate Mission Control sections
- Bypass typed commands
- Replace projection contracts
- Embed service-role credentials

## Prompt Structure

Every Lovable implementation prompt should state:

```text
Architecture constraints
Projection contract
Command contract
Existing components to preserve
Required states
Accessibility requirements
Responsive behavior
Explicit non-goals
Acceptance criteria
```

## Recommended Workflow

1. Define projection and command contracts.
2. Generate or refine the UI in Lovable.
3. Sync to GitHub.
4. Review package boundaries and imports.
5. Replace mocks with typed query and command hooks.
6. Add tests.
7. Review accessibility.
8. Merge through pull request.

## Acceptance Rule

A visually correct UI is not complete until it consumes the correct projection and sends the correct typed commands.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial Lovable implementation guide |
