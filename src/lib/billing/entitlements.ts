// Client-safe entitlement definitions. Server functions and hooks both import
// from here; keep it free of process.env or Supabase imports.

export type Tier = 'free' | 'starter' | 'pro' | 'team';

export type Feature =
  | 'basic_sim'
  | 'all_scenarios'
  | 'ai_coach'
  | 'adaptive_practice'
  | 'full_assessment'
  | 'exam_history'
  | 'analytics_export'
  | 'team_admin';

export interface PriceMeta {
  tier: Tier;
  interval: 'month' | 'year';
  /** Team plans require seats >= 2; other tiers ignore this. */
  seatBased: boolean;
  /** 7-day trial only offered on Pro. */
  trialDays?: number;
  displayName: string;
}

/**
 * The ONLY Stripe price lookup keys the checkout endpoint will accept.
 * Any other value is rejected before ever reaching Stripe.
 */
export const PRICE_LOOKUP_ALLOWLIST: Record<string, PriceMeta> = {
  starter_monthly: { tier: 'starter', interval: 'month', seatBased: false, displayName: 'Starter (monthly)' },
  starter_yearly:  { tier: 'starter', interval: 'year',  seatBased: false, displayName: 'Starter (yearly)' },
  pro_monthly:     { tier: 'pro',     interval: 'month', seatBased: false, trialDays: 7, displayName: 'Pro (monthly)' },
  pro_yearly:      { tier: 'pro',     interval: 'year',  seatBased: false, trialDays: 7, displayName: 'Pro (yearly)' },
  team_monthly:    { tier: 'team',    interval: 'month', seatBased: true,  displayName: 'Team (monthly)' },
  team_yearly:     { tier: 'team',    interval: 'year',  seatBased: true,  displayName: 'Team (yearly)' },
};

const TIER_RANK: Record<Tier, number> = { free: 0, starter: 1, pro: 2, team: 3 };

/** Minimum tier required to use each feature. */
export const FEATURE_MIN_TIER: Record<Feature, Tier> = {
  basic_sim:         'free',
  all_scenarios:     'pro',
  ai_coach:          'pro',
  adaptive_practice: 'pro',
  full_assessment:   'pro',
  exam_history:      'pro',
  analytics_export:  'team',
  team_admin:        'team',
};

/** Free-tier learners are limited to this single starter case. */
export const FREE_TIER_ALLOWED_CASES = new Set<string>(['software-startup-mvp']);

export function tierRank(tier: Tier): number {
  return TIER_RANK[tier] ?? 0;
}

export function hasFeature(tier: Tier, feature: Feature): boolean {
  return tierRank(tier) >= tierRank(FEATURE_MIN_TIER[feature]);
}

export function priceMetaFor(lookupKey: string | null | undefined): PriceMeta | null {
  if (!lookupKey) return null;
  return PRICE_LOOKUP_ALLOWLIST[lookupKey] ?? null;
}

export function isActiveStatus(status: string, currentPeriodEnd: string | null | undefined): boolean {
  const end = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
  const stillInPeriod = !end || end > new Date();
  if (['active', 'trialing', 'past_due'].includes(status) && stillInPeriod) return true;
  if (status === 'canceled' && end && end > new Date()) return true;
  return false;
}
