# Simulation domain

Primary (workplace simulation — used by `/play` and `/sim/$caseId`):

- `types.ts` — SimState, Decision, Metrics, Phase
- `cases.ts` — industry case metadata + stakeholders
- `generator.ts` — synthesizes per-case emails, meetings, docs, decisions
- `engine.ts` — pure reducer: decision → new metrics + phase advance
- `tailoring.ts` — Phase 0 workshop scoring
- `store.tsx` — React context + localStorage persistence

UI lives in `src/components/sim/*`.

## `legacy/`

The `legacy/` folder holds the earlier single-scenario simulator (types,
scenarios, project-state, performance scoring). It is retained ONLY because
`/performance` and the industry-case dataset (`legacy/industries.ts`) still
depend on it. New work should use the primary modules above; treat `legacy/`
as read-only until `/performance` is migrated onto the new engine.
