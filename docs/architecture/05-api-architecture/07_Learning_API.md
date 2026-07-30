# Learning API

**Document ID:** PS-API-007  
**Version:** 1.0  
**Status:** Approved

## Query Endpoints

```text
GET /api/v1/learners/me/mastery
GET /api/v1/learners/me/competencies
GET /api/v1/learners/me/recommendations
GET /api/v1/learners/me/exam-readiness
GET /api/v1/simulation-runs/{runId}/learning-summary
```

## Command Endpoints

```text
POST /api/v1/simulation-runs/{runId}/commands/submit-reflection
POST /api/v1/assessments/{assessmentId}/attempts
POST /api/v1/assessment-attempts/{attemptId}/commands/submit
```

## Reflection Payload

```ts
interface SubmitReflectionPayload {
  dayId?: string;
  chapterId?: string;
  promptId: string;
  response: string;
}
```

## Rules

1. Learners do not directly set mastery.
2. Mastery changes are derived from evidence.
3. Assessment attempts are immutable after submission.
4. Reflection history is append-only.
5. AI feedback is clearly distinguished from authoritative mastery.
6. Instructor visibility follows enrollment and organization permissions.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial Learning API |
