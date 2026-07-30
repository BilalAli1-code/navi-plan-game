# AI Orchestration API

**Document ID:** PS-API-010  
**Version:** 1.0  
**Status:** Approved

## Endpoints

```text
POST /api/v1/ai/maya/messages
POST /api/v1/ai/reflection-feedback
POST /api/v1/ai/stakeholder-responses
POST /api/v1/ai/executive-briefings
GET /api/v1/ai/interactions/{interactionId}
```

## Maya Request

```ts
interface MayaMessageRequest {
  simulationRunId: string;
  message: string;
  contextScope: "current_day" | "current_chapter" | "full_run";
}
```

## Response

```ts
interface AIInteractionResponse {
  interactionId: string;
  status: "completed" | "fallback" | "rejected";
  content: string;
  provenance: {
    personaVersion: string;
    promptVersion: string;
    modelPolicy: string;
  };
}
```

## Rules

1. AI receives approved grounding packages only.
2. AI responses are validated before delivery.
3. AI endpoints cannot directly mutate authoritative state.
4. AI-proposed actions must be resubmitted as typed domain commands.
5. Sensitive data is minimized.
6. Fallbacks remain available when providers fail.
7. Provider-specific details are not exposed unnecessarily.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial AI Orchestration API |
