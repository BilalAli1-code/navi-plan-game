# Domain and Application Coding Standards

**Document ID:** PS-ENG-005  
**Version:** 1.0  
**Status:** Approved

## Domain Code

Domain code must:

- Use ubiquitous language
- Be framework-independent
- Avoid database calls
- Avoid network calls
- Avoid UI concerns
- Return explicit results
- Enforce invariants
- Emit domain events
- Be deterministic where required

## Application Services

Application services coordinate:

- Authentication context
- Authorization
- Aggregate loading
- Command execution
- Persistence
- Event publication
- Projection refresh

They do not own business rules.

## Commands

Commands use imperative names:

```text
StartSimulationRun
SubmitDecision
CompleteActivity
SendStakeholderMessage
```

## Events

Events use past tense:

```text
SimulationRunStarted
DecisionResolved
ActivityCompleted
StakeholderTrustChanged
```

## Repository Interfaces

Domain and application layers depend on interfaces. Infrastructure provides implementations.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial domain and application standards |
