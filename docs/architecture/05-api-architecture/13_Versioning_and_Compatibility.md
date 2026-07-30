# Versioning and Compatibility

**Document ID:** PS-API-013  
**Version:** 1.0  
**Status:** Approved

## Public Versioning

Major API versions use URL paths:

```text
/api/v1
/api/v2
```

## Contract Evolution

Backward-compatible changes include:

- Adding optional fields
- Adding endpoints
- Adding enum values only when clients are designed for unknown values
- Adding optional query parameters

Breaking changes include:

- Removing or renaming fields
- Changing field meaning
- Changing required fields
- Reusing error codes with new meaning
- Changing authorization semantics

## Command and Event Versions

Commands and events include independent integer versions.

```json
{
  "commandType": "SubmitDecision",
  "commandVersion": 1
}
```

## Deprecation

Deprecation requires:

- Published notice
- Replacement guidance
- Migration window
- Usage monitoring
- Sunset date where applicable

## Compatibility Testing

Consumer-driven contract tests verify important web, mobile, and integration clients before release.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial API versioning strategy |
