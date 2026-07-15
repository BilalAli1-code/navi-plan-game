import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import { type StripeEnv, verifyWebhook } from '@/lib/stripe.server';
import { priceMetaFor } from '@/lib/billing/entitlements';

let _supabase: any = null;
function getSupabase(): any {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

const WELCOME_XP_BONUS = 500;

async function sendWelcomeEmail(email: string, displayName: string | null) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log('[welcome-email] RESEND_API_KEY not set, skipping send to', email);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'ProjectSim <onboarding@resend.dev>',
        to: [email],
        subject: 'Welcome to ProjectSim Pro 🚀',
        html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;">
          <h1 style="margin:0 0 12px;">Welcome${displayName ? `, ${displayName}` : ''}!</h1>
          <p>Your ProjectSim Pro subscription is active.</p>
        </div>`,
      }),
    });
    if (!res.ok) console.error('[welcome-email] resend failed', res.status, await res.text());
  } catch (e) {
    console.error('[welcome-email] error', e);
  }
}

async function grantWelcomeBonusTransactional(subscriptionId: string, env: StripeEnv) {
  const sb = getSupabase();
  const { data, error } = await sb.rpc('grant_welcome_bonus', {
    _subscription_id: subscriptionId,
    _env: env,
    _bonus: WELCOME_XP_BONUS,
  });
  if (error) throw new Error(`grant_welcome_bonus failed: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.granted || !row?.user_id) return;

  // Best-effort side-effect: email. Not transactional with XP.
  const { data: userRes } = await sb.auth.admin.getUserById(row.user_id);
  const email = userRes?.user?.email;
  if (email) await sendWelcomeEmail(email, row.display_name ?? null);
}

function extractRow(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const priceId =
    item?.price?.lookup_key
    || item?.price?.metadata?.lovable_external_id
    || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  return {
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    product_id: productId,
    price_id: priceId,
    status: subscription.status,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    environment: env,
    updated_at: new Date().toISOString(),
  };
}

async function resolveUserIdForSubscription(subscription: any): Promise<string | null> {
  const meta = subscription.metadata?.userId;
  if (meta) return meta;
  const sb = getSupabase();
  const { data } = await sb
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle();
  return data?.user_id ?? null;
}

async function upsertTeamRow(subscription: any, env: StripeEnv, userId: string) {
  const item = subscription.items?.data?.[0];
  const seats = item?.quantity ?? Number(subscription.metadata?.seats ?? 1);
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const sb = getSupabase();
  const { error } = await sb.from('team_subscriptions').upsert(
    {
      stripe_subscription_id: subscription.id,
      owner_user_id: userId,
      environment: env,
      seats,
      status: subscription.status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_subscription_id' },
  );
  if (error) throw new Error(`team_subscriptions upsert failed: ${error.message}`);
}

async function revokeTeamMemberships(subscriptionId: string) {
  const sb = getSupabase();
  const { data: team } = await sb
    .from('team_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();
  if (!team?.id) return;
  const { error } = await sb
    .from('team_memberships')
    .update({ status: 'revoked' })
    .eq('team_id', team.id);
  if (error) throw new Error(`team_memberships revoke failed: ${error.message}`);
}

async function safeUpsertSubscription(subscription: any, env: StripeEnv) {
  const userId = await resolveUserIdForSubscription(subscription);
  if (!userId) throw new Error(`No userId resolvable for subscription ${subscription.id}`);
  const row = extractRow(subscription, env);
  const sb = getSupabase();
  const { error } = await sb
    .from('subscriptions')
    .upsert({ user_id: userId, ...row }, { onConflict: 'stripe_subscription_id' });
  if (error) throw new Error(`subscriptions upsert failed: ${error.message}`);

  // Team-side mirror
  const priceKey = row.price_id;
  const meta = priceMetaFor(priceKey);
  if (meta?.tier === 'team' && subscription.status !== 'canceled') {
    await upsertTeamRow(subscription, env, userId);
  }

  // Trial → active or created active/trialing → welcome bonus (Pro only)
  if (meta?.tier === 'pro' && (subscription.status === 'active' || subscription.status === 'trialing')) {
    await grantWelcomeBonusTransactional(subscription.id, env);
  }
  return userId;
}

async function handleSubscriptionCreated(sub: any, env: StripeEnv) {
  await safeUpsertSubscription(sub, env);
}
async function handleSubscriptionUpdated(sub: any, env: StripeEnv) {
  await safeUpsertSubscription(sub, env);
}
async function handleSubscriptionDeleted(sub: any, env: StripeEnv) {
  const sb = getSupabase();
  const { error } = await sb
    .from('subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', sub.id)
    .eq('environment', env);
  if (error) throw new Error(`subscriptions cancel failed: ${error.message}`);

  const { error: tErr } = await sb
    .from('team_subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', sub.id);
  if (tErr) throw new Error(`team_subscriptions cancel failed: ${tErr.message}`);

  await revokeTeamMemberships(sub.id);
}

async function claimEvent(eventId: string, eventType: string): Promise<boolean> {
  const sb = getSupabase();
  const { error } = await sb.from('webhook_events').insert({
    event_id: eventId,
    provider: 'stripe',
    event_type: eventType,
  });
  if (!error) return true;
  // Unique-violation = already processed
  if ((error as any).code === '23505') return false;
  throw new Error(`webhook_events insert failed: ${error.message}`);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  const anyEvent = event as any;
  const eventId: string | undefined = anyEvent.id;
  if (!eventId) throw new Error('Missing event id');

  const fresh = await claimEvent(eventId, event.type);
  if (!fresh) {
    console.log('[webhook] duplicate event, skipping:', eventId, event.type);
    return;
  }

  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object, env);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object, env);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    default:
      console.log('[webhook] unhandled event:', event.type);
  }
}

export const Route = createFileRoute('/api/public/payments/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get('env');
        if (rawEnv !== 'sandbox' && rawEnv !== 'live') {
          console.error('Webhook received with invalid env:', rawEnv);
          return Response.json({ received: true, ignored: 'invalid env' });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          // Return 500 so Stripe retries. Idempotency table prevents dup work.
          console.error('[webhook] error:', e);
          return new Response(
            e instanceof Error ? e.message : 'Webhook error',
            { status: 500 },
          );
        }
      },
    },
  },
});
