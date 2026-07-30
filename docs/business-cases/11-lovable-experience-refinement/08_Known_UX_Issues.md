# BC-008 — Known UX Issues (Baseline)

No fixes in this PR. Severities: Critical · Major · Minor · Enhancement.

| ID | Severity | Surface | Category | Description |
|---|---|---|---|---|
| UX-001 | Critical | Shell | Navigation friction | Fourteen primary destinations compete in one nav; Decision Workspace omitted |
| UX-002 | Critical | Decision | Visual / hierarchy | `ps-*` components render largely unstyled in web app |
| UX-003 | Critical | Auth | Discoverability | No learner login or sign-out surface |
| UX-004 | Major | Theme | Consistency | Dark body + light page overrides; teal vs blue accents |
| UX-005 | Major | Design system | Consistency | Approved semantic tokens not implemented; hex duplication |
| UX-006 | Major | Freshness | Redundant information | Stale/rebuild messaging copy-pasted instead of shared banner |
| UX-007 | Major | Outcome | Unclear next action | No dedicated run-completion / ending summary screen |
| UX-008 | Major | Mission Control | Information overload | Counts, metrics, actions, chapter, outcomes on one long page |
| UX-009 | Major | Documents | Readability | Long document bodies without reading chrome (TOC, progress) |
| UX-010 | Major | Decision | Navigation friction | Leaving shell during core decision task |
| UX-011 | Major | Mobile | Poor mobile layout | Master–detail surfaces crowd; binary 719px breakpoint only |
| UX-012 | Major | Unavailable | Confusing terminology | “Unavailable” channel counts may look like errors |
| UX-013 | Minor | Progress | Confusing terminology | Nav label “Progress” ≠ H1 “Learner Progression” |
| UX-014 | Minor | Performance | Empty state | No empty-state treatment |
| UX-015 | Minor | Deep link | Discoverability | `?decision=` unused |
| UX-016 | Minor | Learning trio | Inconsistency | Auth gate missing Home / Dev Sign-in links |
| UX-017 | Minor | Notifications vs Inbox | Discoverability | Two message-like surfaces; urgency cues weak |
| UX-018 | Minor | Catalog | Weak hierarchy | Metadata density on cards/details |
| UX-019 | Enhancement | Loading | Skeletons | Text “Loading…” only |
| UX-020 | Enhancement | Icons | Visual scanning | Text-only reduces slower recognition |
| UX-021 | Enhancement | Settings | Missing | No preferences surface |
| UX-022 | Enhancement | Urgency | Weak urgency | Inbox urgency levels present in data but weak visual hierarchy |
| UX-023 | Enhancement | Guidance | Learner guidance | Experience-level guidance exists in content; UI presentation limited |
| UX-024 | Major | A11y | Skip link | See A11Y-001 |
| UX-025 | Major | A11y | Contrast risk | See A11Y-004 |

## Severity counts

| Severity | Count |
|---|---:|
| Critical | 3 |
| Major | 11 |
| Minor | 6 |
| Enhancement | 5 |

These issues are the backlog candidates for later Lovable refinement — still bounded by Lovable MAY / MAY NOT rules.
