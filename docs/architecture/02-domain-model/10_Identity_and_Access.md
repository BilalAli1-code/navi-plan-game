# Identity and Access

**Document ID:** PS-DOM-010  
**Version:** 1.0  
**Status:** Approved

## Aggregate Root

`UserAccount`

## Purpose

Manage authentication, authorization, tenancy, roles, permissions, memberships, enrollments, sessions, and consent.

## Identity Types

- Learner
- Instructor
- Content Author
- Reviewer
- Organization Manager
- Enterprise Administrator
- Platform Administrator
- Service Identity

## Core Entities

- User Account
- Organization
- Organization Membership
- Role
- Permission
- Enrollment
- Session
- Consent Record
- Notification Preference
- Privacy Preference

## Capability-Based Permissions

Examples:

```text
simulation.run.start
simulation.run.reset
content.publish
content.review
analytics.view.enterprise
report.export
organization.manage
```

## Invariants

1. Every command has an authenticated or explicitly anonymous actor.
2. Tenant data remains isolated.
3. Roles grant capabilities, not business outcomes.
4. Domain contexts receive actor IDs, not authentication internals.
5. Sessions are revocable.
6. Audit history is immutable.

## Revision History

| Version | Status | Description |
|---|---|---|
| 1.0 | Approved | Initial Identity and Access model |
