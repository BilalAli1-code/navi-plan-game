# Canonical State Machines

**Document ID:** PS-DOM-014  
**Version:** 1.0  
**Status:** Approved

## Simulation Run

```mermaid
stateDiagram-v2
    [*] --> Created
    Created --> Active: Start
    Active --> Paused: Pause
    Paused --> Active: Resume
    Active --> Failed: Failure
    Failed --> Active: Recover
    Active --> Completed: Complete
    Completed --> Archived: Archive
```

## Chapter and Day Progress

```mermaid
stateDiagram-v2
    Locked --> Available: Prerequisites satisfied
    Available --> Active: Activate
    Active --> ReadyForCompletion: Requirements satisfied
    ReadyForCompletion --> Completed: Complete
```

## Activity Progress

```mermaid
stateDiagram-v2
    Locked --> Available
    Available --> InProgress
    InProgress --> Blocked
    Blocked --> InProgress
    InProgress --> Completed
    InProgress --> Failed
    Available --> Skipped
```

## Decision

```mermaid
stateDiagram-v2
    Submitted --> Validated
    Submitted --> Rejected
    Validated --> Resolved
    Resolved --> Superseded: Compensating process
```

## Scheduled Event

```mermaid
stateDiagram-v2
    Scheduled --> Eligible
    Eligible --> Released
    Released --> Processed
    Scheduled --> Cancelled
    Scheduled --> Expired
```

## Stakeholder Relationship

```mermaid
stateDiagram-v2
    Initialized --> Developing
    Developing --> Stable
    Stable --> Champion
    Stable --> AtRisk
    AtRisk --> Escalated
    Escalated --> Recovered
    Recovered --> Stable
```

## AI Interaction

```mermaid
stateDiagram-v2
    Requested --> Grounded
    Grounded --> PromptBuilt
    PromptBuilt --> ModelInvoked
    ModelInvoked --> ResponseReceived
    ResponseReceived --> Validated
    ResponseReceived --> Rejected
    Rejected --> FallbackUsed
    Validated --> Delivered
```

## Rule

No implicit state transitions are permitted. Invalid transitions return typed domain errors.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial canonical state machines |
