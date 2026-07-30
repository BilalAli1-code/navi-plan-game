# Internal Projection Operations Contract (PS-ROADMAP-023)

These routes are **internal / administrative**. They are intentionally **excluded**
from the public OpenAPI document (`docs/api/openapi/openapi.yaml`) and must not
be wrapped by the learner web client SDK.

## Authorization

- Authenticated session required (same JWT resolver as public API).
- Tenant from verified token only.
- Membership must include `simulation.projection.ops`.
- Learners with only `simulation.run.view` / `simulation.run.start` are denied.
- Service-role tokens remain rejected by the API session resolver.

## Routes

Base: `/api/v1/internal/projection-operations`

See `docs/operations/projection-relay-runbook.md` for the full table.

## Sensitive fields

Responses never include:

- event payloads
- projection payloads
- database credentials
- authorization headers
- hidden scenario content

Error summaries are truncated safe strings for operator diagnosis only.
