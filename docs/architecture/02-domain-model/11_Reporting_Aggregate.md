# Reporting Aggregate

**Document ID:** PS-DOM-011  
**Version:** 1.0  
**Status:** Approved

## Aggregate Root

`ReportRequest`

## Purpose

Create reproducible, audience-specific reports from approved projections and analytics.

## Report Types

- Learner Report
- Day Summary
- Chapter Summary
- Final Simulation Report
- Competency Report
- Instructor Report
- Executive Report
- Organization Report
- Audit Report

## Core Entities

- Report Definition
- Report Request
- Generated Report
- Report Section
- Report Artifact
- Report Audience
- Report Template
- Export Job

## Invariants

1. Reports never own source data.
2. Reports identify source versions.
3. Access follows authorization.
4. Generated reports are immutable snapshots.
5. Regeneration differences require changed source data, template, or calculation version.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial Reporting Aggregate |
