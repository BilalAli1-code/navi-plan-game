# Prompt Management

**Document ID:** PS-AI-004  
**Version:** 1.0  
**Status:** Approved

## Prompt Registry

Every prompt has:

- Prompt ID
- Version
- Purpose
- Persona
- Input schema
- Output schema
- Model policy
- Safety policy
- Test cases
- Change history

## Prompt Structure

```text
System policy
Persona instructions
Task instructions
Grounding context
Output schema
Safety constraints
Evaluation criteria
```

## Rules

1. Prompts are stored outside UI components.
2. Prompts are version-controlled.
3. Production prompt changes use review.
4. Prompts do not embed secrets.
5. Business invariants remain outside prompts.
6. Prompt variables are escaped and validated.
7. Prompt-injection defenses are explicit.
8. Output format requirements are machine-readable.
9. Every prompt has representative tests.
10. Deprecated prompts remain traceable for historical outputs.

## Prompt Change Categories

- Editorial
- Behavioral
- Safety
- Schema
- Model-policy
- Breaking

Behavioral and breaking changes require evaluation before release.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial prompt-management architecture |
