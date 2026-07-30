# BC-008 — Surface Refinement Matrix

Baseline only. **No redesign.** Priority = future Lovable sequencing hint.

| Surface | Owner | Purpose | API / Projection | Strengths | Weaknesses | A11y concerns | Responsive concerns | Lovable suitability | Architecture restrictions | Priority |
|---|---|---|---|---|---|---|---|---|---|---|
| Application Shell | `WorkplaceShell` | Nav + outlet | None (UI-only) | Clear run context; Escape menu; focus to content | 14-item horizontal crowding; Decision missing | No skip link | ≤719px hamburger | High — layout/nav clarity | Must remain UI-only; no projection fetch | P0 |
| Home | `HomePage` | Entry / dev controls | Dev seed POST | Simple | Not a learner product home | Dev-heavy | OK | Medium | Dev controls must stay gated | P2 |
| Auth | `session.tsx` | Session | Supabase / dev / e2e | Hooked into all pages | No login/settings/sign-out UI | No login form labels | N/A | High (presentation of gates) | Must not invent authz rules | P0 |
| Catalog | `CatalogPage` | Case list | business-cases list | Empty/error states | Teal accent vs blue elsewhere | Error without labelled section | 720px padding | High | Selectable cases only from API | P1 |
| Case Details | `CaseDetailsPage` | Start run | business-case details + create | Clear CTA | Dense metadata | — | 720px | High | Create-run payload fixed | P1 |
| Mission Control | `MissionControlPage` | Overview | mission-control; complete-chapter | Counts + recommended actions | Dense; Unavailable channels | Dense headings | Crowding | High | Counts from projection only | P0 |
| Inbox | `InboxPage` | Messages | inbox | Expandable; empty state | Classification density | aria-expanded OK | Responsive e2e exists | High | No read-state inventing | P0 |
| Meetings | `MeetingsPage` | Schedule | meetings + commands | Start/complete actions | List density | — | — | High | Commands only | P1 |
| Stakeholders | `StakeholdersPage` | People + chat | stakeholders | Master–detail | Conversation empty UX | aria-pressed | Two-pane squeeze on phone | High | No relationship mutation in UI | P1 |
| Documents | `DocumentsPage` | Evidence | documents | Master–detail | Long body readability | aria-pressed | Pane squeeze | High | Hidden sections must stay hidden | P0 |
| Notifications | `NotificationsPage` | System notices | notifications | Empty state | Easy to miss vs Inbox | — | Light-on-dark conflict | Medium | Ending notices learner-safe | P1 |
| Activities | `ActivitiesPage` | Active work | activities + complete | Clear complete action | Light page on dark body | — | — | High | CompleteActivity only | P1 |
| Completed History | `CompletedHistoryPage` | Archive | completed-history | Empty state | Similar to Activities | — | — | Medium | Read-only | P2 |
| Decision Log | `DecisionLogPage` | Past decisions | decision-log | Links to workspace | Overlaps ui history | — | 720px | High | Revealed outcomes only | P0 |
| Decision Workspace | `DecisionPage` + ui | Decide | simulation projection + submit | Structured confirm flow | Outside shell; unstyled `ps-*` | Focus on status after submit | — | High | No client-side outcome invent | P0 |
| Performance | `PerformancePage` | Evidence counts | performance | Honest unavailable XP/mastery elsewhere | No empty state; blue accent | Counts H2 unlabeled | — | Medium | No invent XP | P1 |
| Progress | `LearnerProgressionPage` | Chapters | learner-progression | Requirements visibility | Label “Progress” vs H1 | — | — | High | Catalog from projection | P1 |
| Achievements | `AchievementsPage` | Awards | achievements | Empty + XP honesty | Weaker auth gate links | Covered by axe e2e | — | High | No invent awards | P1 |
| Mastery | `MasteryPage` | Competencies | mastery | Band unavailable honesty | Weaker auth gate | axe e2e | — | High | No invent thresholds | P1 |
| Coaching | `CoachingPage` | Interventions | coaching | Empty state | Weaker auth gate | axe e2e | — | High | AI must not mutate | P1 |
| Loading states | Cross-cutting | Status | — | aria-live polite | No skeletons | — | — | High | Must not fake data | P1 |
| Empty states | Cross-cutting | Guidance | — | data-testid empties | Inconsistent copy depth | — | — | High | No fake content | P1 |
| Error states | Cross-cutting | Recovery | — | Retry when retryable | Inconsistent chrome | alerts present | — | High | Fail closed | P1 |
| Unavailable states | MC / learning | Honesty | — | Explicit Unavailable | Easy to misread as bug | — | — | High | Keep honest | P0 |
| Outcome / completion | Partial | Closure | notifications / MC | Fragments exist | No dedicated outcome screen | — | — | High (future) | Ending from server only | P0 |
| Settings | Missing | — | — | — | Absent | — | — | Future | — | P2 |

## Lovable suitability legend

- **High:** Presentation/layout/readability improvements possible without touching authority.
- **Medium:** Useful later; lower learner impact or more coupling to honesty messaging.
- **Future:** Requires new route/product decision still bounded by architecture.
