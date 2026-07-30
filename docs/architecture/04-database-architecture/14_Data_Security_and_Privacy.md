# Data Security and Privacy

**Document ID:** PS-DB-014  
**Version:** 1.0  
**Status:** Approved

## Data Classes

| Class | Examples |
|---|---|
| Public | Published marketing metadata |
| Internal | Architecture and operational metadata |
| Confidential | Learner progress and organization analytics |
| Restricted | Authentication, consent, sensitive audit data |

## Controls

- Encryption in transit and at rest
- Row-level security
- Least-privilege service access
- Secret isolation
- Audit logging
- Redaction in logs
- Controlled exports
- Data minimization
- Deletion and retention workflows

## AI Data Policy

AI grounding receives only the minimum approved data needed. AI records store model, prompt version, persona version, grounding references, safety result, and provenance.

## Deletion

Deletion workflows distinguish account deletion, tenant termination, legal retention, anonymization, immutable audit obligations, and derived-data cleanup.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial data security and privacy architecture |
