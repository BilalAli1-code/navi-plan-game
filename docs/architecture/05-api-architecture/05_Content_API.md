# Content API

**Document ID:** PS-API-005  
**Version:** 1.0  
**Status:** Approved

## Public Read Endpoints

```text
GET /api/v1/programs
GET /api/v1/programs/{programId}
GET /api/v1/business-cases
GET /api/v1/business-cases/{businessCaseId}
GET /api/v1/content-packages/{packageId}/versions/{version}
```

## Authoring Endpoints

```text
POST /api/v1/content-packages
POST /api/v1/content-packages/{packageId}/versions
POST /api/v1/content-packages/{packageId}/versions/{version}/validate
POST /api/v1/content-packages/{packageId}/versions/{version}/submit-review
POST /api/v1/content-packages/{packageId}/versions/{version}/publish
POST /api/v1/content-packages/{packageId}/versions/{version}/deprecate
```

## Publication Rules

1. Only validated versions may be published.
2. Published versions are immutable.
3. Publication requires authorization.
4. Validation responses include structured errors and warnings.
5. Simulation Runs reference exact published versions.
6. Content definitions are not returned to unauthorized learners in full.

## Validation Response

```ts
interface ContentValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  checksum?: string;
}
```

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial Content API |
