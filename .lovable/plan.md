
# ProjectSim billing & entitlement hardening

## 1. Entitlements model (server-authoritative)

New file `src/lib/billing/entitlements.ts`:
- `Tier = 'free' | 'starter' | 'pro' | 'team'`
- `PRICE_LOOKUP_ALLOWLIST = { starter_monthly, starter_yearly, pro_monthly, pro_yearly, team_monthly, team_yearly }` mapped to `{ tier, seats }`.
- `FEATURE_TIERS`: `basic_sim: free+`, `all_scenarios | ai_coach | adaptive_practice | full_assessment: pro+`, `analytics_export | history_export: team+`.
- `tierRank(tier)` + `hasFeature(tier, feature)`.

New server helper `src/lib/billing/entitlement.server.ts`:
- `resolveUserTier(supabase, userId, env)`: reads latest `subscriptions` row for user in env, maps `price_id` (lookup key) → tier via allowlist, checks `isActiveNow(status, current_period_end)`. Also checks `team_memberships` — user gets `team` if they're an accepted member of an active team subscription.
- `requireFeature(supabase, userId, env, feature)`: throws 403 if not entitled.

Wire `requireFeature` into every premium server fn:
- `src/lib/sim/practice.functions.ts` (adaptive_practice)
- `src/lib/sim/assessment.functions.ts` (full_assessment)
- `src/routes/api/coach.ts`, `exam-coach.ts`, `maya-ask.ts`, `sim-stakeholder.ts`, `process-stakeholder-action.ts` (ai_coach)
- `src/lib/sim/sim.functions.ts` (all_scenarios — allow free tier only for the 1 starter case id)
- `src/lib/sim/mastery.functions.ts` analytics reads (analytics_export for team-only export fn)

## 2. Remove client control over environment

- Delete `environment` from `createCheckoutSession` / `createPortalSession` input.
- Add `src/lib/stripe.env.server.ts`: `resolveStripeEnv()` returns `'live'` when `process.env.NODE_ENV === 'production'` AND `STRIPE_LIVE_API_KEY` is set, else `'sandbox'`.
- All server fns call `resolveStripeEnv()` internally.
- `src/hooks/useSubscription.ts` / `StripeEmbeddedCheckout.tsx`: drop `getStripeEnvironment()` from payload; keep it only for local publishable-key selection & subscription row filtering (that's fine — still deterministic from build).

## 3. Allowlist Stripe price lookup keys

`createCheckoutSession` rejects any `priceId` not in `PRICE_LOOKUP_ALLOWLIST`.
Return typed error `{ error: 'Invalid plan' }` before hitting Stripe.

## 4. Verify Checkout Session on return page

New server fn `verifyCheckoutSession({ sessionId })`:
- `requireSupabaseAuth`
- Retrieves session, verifies `session.customer` matches a customer with `metadata.userId === context.userId`, verifies `payment_status === 'paid'` or subscription status active/trialing.
- Returns `{ ok, tier, planName }`.

`src/routes/checkout.return.tsx`:
- Calls `verifyCheckoutSession` on mount, shows loading → success/failure.
- Only shows "You're on Pro" after verification succeeds.

## 5. Webhook: throw on DB failure

`src/routes/api/public/payments/webhook.ts`:
- Every `.upsert / .update / .insert` — check `error`, throw. Currently swallowed.
- Wrap `handleWebhook` so any thrown DB error returns HTTP 500 → Stripe retries.

## 6. Webhook idempotency

New migration: `webhook_events` table (`event_id text PRIMARY KEY, type text, received_at timestamptz`).
Handler:
- Insert `event.id` first; on unique-violation, return `{ received: true, duplicate: true }` (Stripe treats 200 as done).
- Only proceed to switch after successful insert.

## 7. Safe upserts for subscription updates

- Replace `.update()` in `subscription.updated`/`deleted` with `.upsert({ user_id, ... }, { onConflict: 'stripe_subscription_id' })` so an out-of-order `updated`-before-`created` still lands the row.
- Extract `userId` from `subscription.metadata.userId`; if absent on update, look it up from existing row via `select user_id`.

## 8. Welcome bonus transactional

New Postgres RPC `grant_welcome_bonus(_subscription_id text, _env text, _bonus int)` — updates `subscriptions.welcome_bonus_granted` and increments `profiles.total_xp` inside a single function (SECURITY DEFINER). Handler calls RPC, returns claimed user_id. Email send stays outside the DB.

## 9. Trial only on Pro

Currently every recurring plan gets `trial_period_days: 7`. Change to only pass `trial_period_days` when tier === `'pro'`. Starter and Team charge immediately.

## 10. Team seats

Migration:
- `team_subscriptions (id, subscription_id text unique, owner_user_id, seats int, created_at)`
- `team_memberships (id, team_id fk, user_id fk auth.users, role text check owner|member, status text check invited|accepted, invited_email text, invited_at, accepted_at)`
- GRANT + RLS: members read own team; owner manages memberships.
- RPC `accept_team_invite(_token uuid)`.

Checkout:
- Team price ids accept `quantity` (seats) in the checkout call, min 2 max 50; passed to Stripe line item + stored on `team_subscriptions.seats` via webhook.

Webhook:
- On `subscription.created` where price maps to team tier: upsert `team_subscriptions` row with owner + seats.
- On `subscription.updated` with quantity change: update `seats`.
- On `subscription.deleted`: cascade `team_memberships.status='revoked'`.

UI: new `src/routes/_authenticated/team.tsx` — list members, invite by email (creates `team_memberships(status=invited)`), remove seat. Invites emailed via existing Resend path.

Entitlement resolution counts owner + accepted members ≤ seats.

## 11. Tests (Playwright + Stripe test clocks)

`tests/billing.spec.ts` runs against `localhost:8080` with a preseeded test user:
- Upgrade: sub to Starter → upgrade to Pro; assert entitlement flips (AI coach 200 → 200, was 403 before).
- Downgrade: Pro → Starter at period end; assert entitlement holds until `current_period_end`, then drops.
- Failed payment: use Stripe test card `4000 0000 0000 0341`; assert `past_due` status → still active per grace, then `canceled` → 403.
- Cancellation: cancel_at_period_end=true; entitlement holds until period end.
- Trial expiration: use Stripe test clock advance 8 days; assert `trialing` → `active` with charge, `trialing` → `canceled` if payment fails.

Where test clocks aren't reachable from the sandbox, script the equivalent webhook payload (signed with `PAYMENTS_SANDBOX_WEBHOOK_SECRET`) and POST to `/api/public/payments/webhook?env=sandbox`.

## Files

Create:
- `src/lib/billing/entitlements.ts`
- `src/lib/billing/entitlement.server.ts`
- `src/lib/stripe.env.server.ts`
- `src/lib/billing/team.functions.ts`
- `src/routes/_authenticated/team.tsx`
- `src/utils/checkout-verify.functions.ts`
- `tests/billing.spec.ts`
- 2 migrations (webhook_events, team tables + RPC, welcome_bonus RPC)

Edit:
- `src/utils/payments.functions.ts`
- `src/routes/api/public/payments/webhook.ts`
- `src/routes/checkout.return.tsx`
- `src/components/StripeEmbeddedCheckout.tsx`, `src/hooks/useSubscription.ts` (drop env param)
- Premium server fns/routes listed in §1
- `src/routes/pricing.tsx` (surface seat quantity for Team, tier labels)

## Rollout order

1. Migrations (webhook_events, welcome bonus RPC, team tables).
2. Entitlements module + env resolver + allowlist.
3. Wire `requireFeature` into premium fns.
4. Refactor checkout / portal / webhook / return-page verification.
5. Team UI + invite flow.
6. Tests.
