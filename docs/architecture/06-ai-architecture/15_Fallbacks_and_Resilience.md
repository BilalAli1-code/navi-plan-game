# Fallbacks and Resilience

**Document ID:** PS-AI-015  
**Version:** 1.0  
**Status:** Approved

## Failure Types

- Provider unavailable
- Timeout
- Rate limit
- Invalid structured output
- Safety rejection
- Context-build failure
- Model-policy failure
- Cost-budget breach

## Fallback Strategy

```mermaid
flowchart LR
    A[Primary Model] -->|Failure| B[Secondary Model]
    B -->|Failure| C[Deterministic Template]
    C -->|Unavailable| D[Graceful UI Message]
```

## Rules

1. Core simulation processing never depends on AI success.
2. Critical workflows have deterministic fallbacks.
3. Retries use bounded exponential backoff.
4. Repeated failure triggers circuit breakers.
5. Fallback use is visible in telemetry.
6. Learners receive a clear message when AI is unavailable.
7. No retry may duplicate an authoritative action.
8. Asynchronous tasks can resume safely.
9. Provider-specific failures are normalized.
10. Recovery procedures are documented.

## Deterministic Fallback Examples

- Pre-authored stakeholder replies
- Rule-based Maya prompts
- Template reflection feedback
- Cached executive summary structure
- Static learning recommendations

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial fallback and resilience architecture |
