# Content Schema

**Document ID:** PS-DB-004  
**Version:** 1.0  
**Status:** Approved

## Core Tables

- `content.learning_programs`
- `content.business_cases`
- `content.content_packages`
- `content.content_package_versions`
- `content.content_assets`
- `content.content_validation_results`
- `content.content_publications`

## Version Storage

```sql
create table content.content_package_versions (
  id uuid primary key,
  content_package_id uuid not null,
  version text not null,
  status text not null,
  schema_version integer not null,
  runtime_compatibility text not null,
  definition jsonb not null,
  checksum text not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (content_package_id, version)
);
```

## Rules

1. Published rows are never updated in place.
2. Corrections create a new version.
3. A Simulation Run references an exact version.
4. Checksums detect accidental modification.
5. Validation results are retained.
6. Assets use stable references and versioned metadata.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial content schema |
