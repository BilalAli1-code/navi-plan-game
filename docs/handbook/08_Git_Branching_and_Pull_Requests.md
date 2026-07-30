# Git, Branching, and Pull Requests

**Document ID:** PS-ENG-008  
**Version:** 1.0  
**Status:** Approved

## Branch Model

Use short-lived branches from `main`.

```text
feature/<description>
fix/<description>
architecture/<description>
docs/<description>
chore/<description>
```

## Rules

1. `main` remains deployable.
2. Force-pushing published Lovable history is prohibited.
3. Pull requests are required for production changes.
4. Branches are small and short-lived.
5. Merge conflicts are resolved before review completion.
6. Secrets are never committed.
7. Generated artifacts are committed only when policy requires them.
8. Commit messages use clear scope and intent.

## Commit Examples

```text
feat(simulation): add idempotent decision submission
fix(projection): synchronize mission control counts
test(runtime): cover duplicate command handling
docs(api): define decision command contract
```

## Pull Request Template

Every PR should include:

- Summary
- Motivation
- Scope
- Architecture impact
- Test evidence
- Screenshots where relevant
- Migration impact
- Rollback considerations
- Known limitations

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial Git and PR standards |
