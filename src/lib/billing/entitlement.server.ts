// Server-side entitlement resolution. Import from server functions or API routes.
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import {
  type Tier,
  type Feature,
  hasFeature,
  isActiveStatus,
  priceMetaFor,
} from './entitlements';
import { resolveStripeEnv } from '../stripe.env.server';

type SB = ReturnType<typeof createClient<Database>>;

function newSupabaseKeyFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if ((key.startsWith('sb_publishable_') || key.startsWith('sb_secret_')) &&
        headers.get('Authorization') === `Bearer ${key}`) {
      headers.delete('Authorization');
    }
    headers.set('apikey', key);
    return fetch(input, { ...init, headers });
  };
}

/**
 * Verify a Bearer token from an incoming raw HTTP request.
 * Use inside src/routes/api/**.ts server-route handlers (they don't have
 * requireSupabaseAuth middleware).
 */
export async function authenticateRequest(request: Request): Promise<{
  supabase: SB;
  userId: string;
} | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token || token.split('.').length !== 3) return null;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;

  const supabase = createClient<Database>(url, key, {
    global: {
      fetch: newSupabaseKeyFetch(key),
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;
  return { supabase, userId: String(data.claims.sub) };
}

/**
 * Look up the effective tier for a user in the current Stripe env.
 * Considers direct subscriptions AND team memberships.
 */
export async function resolveUserTier(supabase: SB, userId: string): Promise<Tier> {
  const env = resolveStripeEnv();

  // 1) Direct subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('status, current_period_end, price_id')
    .eq('user_id', userId)
    .eq('environment', env)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let tier: Tier = 'free';
  if (sub && isActiveStatus(sub.status, sub.current_period_end)) {
    const meta = priceMetaFor(sub.price_id);
    if (meta) tier = meta.tier;
  }

  // 2) Team membership overrides UP (never down)
  if (tier !== 'team') {
    const { data: teamOk } = await supabase.rpc('user_has_active_team', {
      _user_id: userId,
      _env: env,
    });
    if (teamOk === true) tier = 'team';
  }

  return tier;
}

/** Throw a 403-style Response if the user lacks the feature. */
export async function requireFeature(
  supabase: SB,
  userId: string,
  feature: Feature,
): Promise<Tier> {
  const tier = await resolveUserTier(supabase, userId);
  if (!hasFeature(tier, feature)) {
    throw new Response(
      JSON.stringify({ error: 'upgrade_required', feature, currentTier: tier }),
      { status: 403, headers: { 'Content-Type': 'application/json' } },
    );
  }
  return tier;
}
