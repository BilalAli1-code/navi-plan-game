# Model Routing and Provider Abstraction

**Document ID:** PS-AI-009  
**Version:** 1.0  
**Status:** Approved

## Purpose

Choose appropriate models by task without coupling application code to one provider.

## Routing Inputs

- Task type
- Persona
- Required output schema
- Latency target
- Cost budget
- Context size
- Safety class
- Quality tier
- Availability
- Tenant policy

## Model Policy

```ts
interface ModelPolicy {
  id: string;
  version: string;
  preferredModels: string[];
  fallbackModels: string[];
  maxLatencyMs: number;
  maxCostUsd: number;
  temperature: number;
  requireStructuredOutput: boolean;
}
```

## Rules

1. Provider SDKs remain behind adapters.
2. Model names are configuration, not domain logic.
3. Fallback order is explicit.
4. High-risk tasks use approved models only.
5. Tenant restrictions may narrow provider choice.
6. Routing decisions are logged.
7. Costs are attributed by interaction and tenant.
8. Model upgrades require evaluation.
9. Deterministic settings are preferred where consistency matters.
10. Provider outages do not break core simulation processing.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial model-routing architecture |
