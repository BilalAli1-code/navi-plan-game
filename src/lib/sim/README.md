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
scenarios, project-state, performance scoring). The active `/performance` route
now reads from canonical simulation runs/actions. The legacy industry dataset
(`legacy/industries.ts`) is still used as a source metadata bridge.
