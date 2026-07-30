# BC-012 — Legacy visual transfer into ProjectSim 2

Reproduce the visual design and UX of `navi-plan-game` inside `projectsim-2` **without** transferring simulation authority.

| Doc | Purpose |
| --- | --- |
| `00_Source_Reference.md` | Exact source branch + commit SHA (currently **blocked**) |
| `01_Screen_Migration_Matrix.md` | Screen-to-screen matrix (PS2 complete; legacy pending SHA verify) |
| `02_Missing_Contracts.md` | Gaps that must not be fabricated |

## Process

1. Pin source SHA (`00`).
2. Complete/re-verify matrix (`01`).
3. One surface per feature branch + draft PR, starting with **Workplace Shell**, then **Mission Control**.
4. Never merge visual work that changes Domain/Application/API/projection/query-key/route/command authority.

## Related

- BC-008 UI baseline: `docs/business-cases/11-lovable-experience-refinement/`
- Closed prior attempt: PR #96 branch `ui/legacy-visual-transfer-20260729` (not merged; no source SHA recorded)
