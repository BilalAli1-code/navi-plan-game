# Reflection and Assessment AI

**Document ID:** PS-AI-008  
**Version:** 1.0  
**Status:** Approved

## Reflection AI

Reflection AI may:

- Identify themes
- Ask follow-up questions
- Highlight evidence
- Compare rationale with outcomes
- Suggest areas for improvement

It may not directly update mastery without validated evidence policy.

## Assessment AI

Assessment AI may support:

- Question drafting
- Distractor review
- Rationale generation
- Item classification
- Difficulty estimation
- Feedback generation

## Evaluation Contract

```ts
interface ReflectionEvaluation {
  summary: string;
  strengths: string[];
  developmentAreas: string[];
  evidenceReferences: string[];
  recommendedFollowUp: string[];
  confidence: number;
}
```

## Rules

1. Free-text evaluation includes confidence.
2. AI feedback is distinguishable from formal scoring.
3. Assessment answer keys are authoritative content, not generated at runtime.
4. AI-generated items require review before publication.
5. Evaluation prompts are calibrated against human-reviewed examples.
6. Bias and consistency are evaluated.
7. Learners may view evidence supporting feedback.
8. Sensitive reflections receive restricted handling.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial reflection and assessment AI architecture |
