# AI SDK and Extension Model

**Document ID:** PS-AI-016  
**Version:** 1.0  
**Status:** Approved

## Extension Types

- Persona packages
- Prompt packages
- Model policies
- Evaluation suites
- Safety policies
- Context adapters
- Output schemas
- Provider adapters

## Persona Package Manifest

```yaml
id: projectsim.persona.risk-advisor
version: 1.0.0
minimumRuntime: 2.0.0
personaSchemaVersion: 1
promptPackage: risk-advisor-prompts@1.0.0
modelPolicy: analytical-standard@1.0.0
safetyPolicy: learner-safe@1.0.0
permissions:
  - projection.read.risk
  - projection.read.current_day
```

## Rules

1. Extensions use public contracts.
2. Extensions are versioned independently.
3. Compatibility is explicit.
4. Permissions are least-privilege.
5. Extensions cannot bypass output validation.
6. Extensions cannot directly access persistence.
7. Persona packages cannot expand their own authority.
8. Signed packages are preferred for marketplace distribution.
9. Evaluations accompany production persona packages.
10. Enterprise customization must not require core forks.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial AI SDK architecture |
