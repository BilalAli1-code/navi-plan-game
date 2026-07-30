# Lovable, Cursor, Copilot, and Claude Guide

**Document ID:** PS-ENG-015  
**Version:** 1.0  
**Status:** Approved

## Lovable

Best for:

- UI layout
- Responsive design
- Visual iteration
- Component scaffolding

Must not redefine architecture or business state.

## Cursor

Best for:

- Multi-file implementation
- Repository-aware refactoring
- Package extraction
- Test creation
- Codebase navigation

## GitHub Copilot

Best for:

- Inline completion
- Repetitive code
- Tests
- Pull-request assistance
- Small scoped changes

## Claude

Best for:

- Large-document analysis
- Architecture critique
- Refactoring plans
- Detailed code review
- Long-context reasoning

## Workflow

```text
Blueprint defines architecture
→ Lovable builds visual structure
→ Cursor or Copilot implements contracts
→ Tests validate behavior
→ GitHub PR controls integration
```

## Tooling Rules

1. GitHub is the source of truth.
2. Lovable syncs through normal branch history.
3. Avoid rewriting published history.
4. Provide tools with exact file names and contracts.
5. Split large tasks into reviewable scopes.
6. Do not accept generated architectural changes silently.
7. Always inspect diffs.
8. Require tests for logic changes.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial tooling guide |
