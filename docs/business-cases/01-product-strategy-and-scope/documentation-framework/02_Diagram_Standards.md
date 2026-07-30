# Diagram Standards

**Document ID:** PS-HBK-002  
**Version:** 1.0  
**Status:** Approved

Use Mermaid whenever practical. Approved types include flowcharts, sequence diagrams, state machines, entity relationships, class diagrams, C4-style context/container diagrams, and journeys.

```mermaid
flowchart LR
    A[Learner Action] --> B[Simulation Runtime]
    B --> C[Core Simulation]
    C --> D[Domain Events]
    D --> E[Projection Builder]
    E --> F[User Interface]
```
