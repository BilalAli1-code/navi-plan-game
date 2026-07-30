# Safety, Privacy, and Guardrails

**Document ID:** PS-AI-012  
**Version:** 1.0  
**Status:** Approved

## Safety Areas

- Prompt injection
- Data leakage
- Hallucination
- Hidden-answer disclosure
- Unsafe or inappropriate content
- Bias
- Overreliance
- Impersonation
- Unauthorized actions
- Sensitive-data exposure

## Guardrail Layers

```text
Authorization
→ Context minimization
→ Prompt policy
→ Provider controls
→ Output validation
→ Safety classification
→ Delivery policy
→ Audit
```

## Privacy Rules

1. Send minimum necessary data.
2. Redact restricted data where required.
3. Record provider and region policy.
4. Respect tenant AI settings.
5. Do not use learner data for external model training without explicit policy and consent.
6. Retention is documented.
7. Sensitive reflections receive stricter access.
8. Data-subject requests include AI records where applicable.

## Learner Transparency

The UI should identify:

- AI-generated responses
- Advisory nature
- Material limitations
- When fallback content is used
- When confidence is low

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial safety and privacy architecture |
