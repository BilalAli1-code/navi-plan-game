# AI Evaluation and Quality

**Document ID:** PS-AI-013  
**Version:** 1.0  
**Status:** Approved

## Evaluation Dimensions

- Groundedness
- Factual consistency
- Persona consistency
- Helpfulness
- Relevance
- Safety
- Bias
- Instruction adherence
- Structured-output validity
- Latency
- Cost

## Evaluation Types

- Golden-set tests
- Regression tests
- Human review
- Pairwise comparison
- Red-team testing
- Production sampling
- User feedback
- Drift monitoring

## Example Rubric

| Dimension | Score |
|---|---|
| Groundedness | 1–5 |
| Persona consistency | 1–5 |
| Helpfulness | 1–5 |
| Safety | Pass/Fail |
| Hidden-answer leakage | Pass/Fail |
| Schema validity | Pass/Fail |

## Release Gate

Prompt, persona, model, or validator changes require evaluation against representative scenarios before production.

## Rules

1. Evaluation datasets are versioned.
2. Results identify model and prompt versions.
3. Critical safety failures block release.
4. Human-reviewed examples anchor subjective scoring.
5. Production feedback informs future tests.
6. Evaluation data respects privacy and tenancy.
7. Cost and latency are quality dimensions.
8. Success thresholds vary by task risk.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial AI evaluation architecture |
