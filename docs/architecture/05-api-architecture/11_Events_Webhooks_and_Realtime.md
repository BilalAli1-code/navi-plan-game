# Events, Webhooks, and Realtime

**Document ID:** PS-API-011  
**Version:** 1.0  
**Status:** Approved

## Internal Events

Domain events are internal contracts and are not exposed directly to untrusted clients.

## Realtime Topics

Selected projection updates may use realtime channels:

```text
simulation-run:{runId}:projection-updated
simulation-run:{runId}:notification-created
report:{reportId}:status-changed
```

## Webhooks

Approved enterprise integrations may subscribe to events such as:

- Simulation completed
- Enrollment created
- Report generated
- Content published
- Learner milestone achieved

## Webhook Envelope

```ts
interface WebhookEnvelope<T> {
  webhookId: string;
  eventType: string;
  eventVersion: number;
  occurredAt: string;
  tenantId: string;
  data: T;
}
```

## Security

- HMAC signatures
- Timestamp validation
- Replay protection
- Secret rotation
- Delivery retries
- Dead-letter retention
- Endpoint verification

## Rules

1. Webhooks are at-least-once.
2. Receivers must be idempotent.
3. Internal event payloads may differ from external webhook contracts.
4. Realtime updates carry read-model changes, not authoritative commands.
5. Sensitive events require explicit subscription permission.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial events, webhooks, and realtime architecture |
