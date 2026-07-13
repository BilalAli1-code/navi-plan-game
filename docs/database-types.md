# Regenerating Supabase Database Types

`src/integrations/supabase/types.ts` is an auto-generated Database type map
consumed by every server function / component that queries Supabase.

## When to regenerate

After any migration in `supabase/migrations/` that:
- creates or drops a table
- adds/removes/renames a column
- changes a column type, default, or nullability
- adds/removes a database function

## How to regenerate

Types are refreshed automatically by Lovable Cloud after an approved
migration runs. If you need to trigger a manual regeneration locally with
the Supabase CLI:

```bash
supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" \
  --schema public > src/integrations/supabase/types.ts
```

The file MUST be treated as generated — never hand-edit it. If a query
needs richer typing than PostgREST returns (e.g. JSON columns typed as
`Json`), define an application-layer type at the call site and use
`as unknown as MyType` at the narrow boundary.
