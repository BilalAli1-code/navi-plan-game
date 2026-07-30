# AI-Assisted Development Guide

**Document ID:** PS-ENG-014  
**Version:** 1.0  
**Status:** Approved

## Purpose

Define safe and effective use of AI coding tools.

## Acceptable Uses

- Code scaffolding
- Test generation
- Refactoring proposals
- Documentation drafts
- Query explanation
- Migration review
- Accessibility suggestions
- Debugging assistance

## Required Human Responsibilities

The engineer remains responsible for:

- Correctness
- Security
- Architecture
- Licensing
- Testing
- Data privacy
- Review
- Production impact

## Rules

1. Never paste production secrets.
2. Do not expose restricted learner data.
3. Provide architecture context in prompts.
4. Ask for minimal, reviewable changes.
5. Verify generated code.
6. Run tests and static analysis.
7. Reject changes that bypass domain boundaries.
8. Record substantial AI-assisted architecture decisions.
9. Review dependency additions carefully.
10. AI-generated code receives normal PR review.

## Prompt Pattern

```text
Goal
Relevant files
Architecture constraints
Existing contracts
Non-goals
Acceptance criteria
Tests required
```

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial AI-assisted development guide |
