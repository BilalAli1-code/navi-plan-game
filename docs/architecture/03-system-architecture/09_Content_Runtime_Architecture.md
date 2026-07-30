# Content Runtime Architecture

**Document ID:** PS-ARCH-009  
**Version:** 1.0  
**Status:** Approved

## Purpose

Define how published content is validated, loaded, resolved, cached, and executed safely.

## Lifecycle

```mermaid
flowchart LR
    A[Draft] --> B[Validate]
    B --> C[Review]
    C --> D[Publish]
    D --> E[Install]
    E --> F[Load by Runtime]
```

## Runtime Contract

```ts
interface ContentResolver {
  getPublishedVersion(
    versionId: ContentPackageVersionId,
  ): Promise<SimulationDefinition>;
}
```

## Validation Layers

- Schema validation
- Reference validation
- Completion-rule validation
- Decision and consequence validation
- Stakeholder-reference validation
- Learning-objective validation
- Asset validation
- Runtime-compatibility validation

## Rules

Published content is immutable and may be cached aggressively. Packages cannot execute arbitrary trusted code, access persistence directly, or bypass runtime validation.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial content runtime architecture |
