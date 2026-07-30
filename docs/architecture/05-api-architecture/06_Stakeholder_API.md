# Stakeholder API

**Document ID:** PS-API-006  
**Version:** 1.0  
**Status:** Approved

## Query Endpoints

```text
GET /api/v1/simulation-runs/{runId}/stakeholders
GET /api/v1/simulation-runs/{runId}/stakeholders/{stakeholderId}
GET /api/v1/simulation-runs/{runId}/stakeholders/{stakeholderId}/conversations
GET /api/v1/simulation-runs/{runId}/stakeholders/{stakeholderId}/commitments
```

## Command Endpoints

```text
POST /api/v1/simulation-runs/{runId}/commands/send-stakeholder-message
POST /api/v1/simulation-runs/{runId}/commands/create-commitment
POST /api/v1/simulation-runs/{runId}/commands/fulfill-commitment
POST /api/v1/simulation-runs/{runId}/commands/escalate-stakeholder-concern
```

## Conversation Contract

```ts
interface SendStakeholderMessagePayload {
  stakeholderId: string;
  threadId?: string;
  message: string;
  interactionType: "chat" | "negotiation" | "escalation" | "follow_up";
}
```

## Rules

1. Conversations are append-only.
2. Messages remain visible after activities are completed.
3. AI-generated replies are stored with provenance.
4. Relationship metrics are not directly writable.
5. Stakeholder changes occur through validated commands and consequences.
6. Learners cannot access hidden internal stakeholder parameters.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial Stakeholder API |
