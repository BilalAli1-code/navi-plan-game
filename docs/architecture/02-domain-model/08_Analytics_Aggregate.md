# Analytics Aggregate

**Document ID:** PS-DOM-008  
**Version:** 1.0  
**Status:** Approved

## Aggregate Root

`AnalyticsModel`

## Purpose

Identify patterns across actions, outcomes, learners, simulations, cohorts, and organizations.

## Core Models

- Performance Metrics
- Learning Metrics
- Decision Metrics
- Communication Metrics
- Stakeholder Metrics
- Risk Metrics
- Timeline Metrics
- Behavioral Metrics
- Trend Series
- Benchmarks
- Forecasts
- Insights
- Cohort Comparisons
- Predictive Models

## Time Dimensions

ProjectSim distinguishes:

- Real time
- Simulation time
- Learning time

## Invariants

1. Analytics is observational, not operational.
2. Every metric identifies source data and calculation version.
3. Forecasts identify confidence.
4. Insights cite supporting evidence.
5. Tenant isolation applies to benchmarks.
6. Analytics may be rebuilt.
7. Analytics never changes simulation state.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial Analytics Aggregate |
