import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import { type StripeEnv, verifyWebhook } from '@/lib/stripe.server';

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
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ProjectSim <onboarding@resend.dev>',
        to: [email],
        subject: 'Welcome to ProjectSim Pro 🚀',
        html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;">
          <h1 style="margin:0 0 12px;">Welcome${displayName ? `, ${displayName}` : ''}!</h1>
          <p>Your 7-day free trial of <strong>ProjectSim Pro</strong> is active. You've unlocked:</p>
          <ul>
            <li>All PMBOK 6 & 7 scenarios</li>
            <li>AI PMP coach on every decision</li>
            <li>+${WELCOME_XP_BONUS} XP welcome bonus (already added)</li>
          </ul>
          <p><a href="https://projectsim.app/play" style="display:inline-block;padding:10px 18px;background:#22d3ee;color:#0b1020;border-radius:8px;text-decoration:none;font-weight:700;">Start your next run</a></p>
          <p style="color:#64748b;font-size:12px;">Cancel anytime from your billing portal — access continues until the period ends.</p>
        </div>`,
      }),
    });
    if (!res.ok) console.error('[welcome-email] resend failed', res.status, await res.text());
  } catch (e) {
    console.error('[welcome-email] error', e);
  }
}

async function grantWelcomeBonus(userId: string, subscriptionId: string, env: StripeEnv) {
  const sb = getSupabase();
  // Atomically claim the bonus so we only ever grant it once per subscription row.
  const { data: claim, error: claimErr } = await sb
    .from('subscriptions')
    .update({ welcome_bonus_granted: true, updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', subscriptionId)
    .eq('environment', env)
    .eq('welcome_bonus_granted', false)
    .select('user_id')
    .maybeSingle();
  if (claimErr || !claim) return;

  const { data: profile } = await sb
    .from('profiles')
    .select('total_xp, display_name')
    .eq('id', userId)
    .maybeSingle();
  const currentXp = profile?.total_xp ?? 0;
  await sb
    .from('profiles')
    .update({ total_xp: currentXp + WELCOME_XP_BONUS, updated_at: new Date().toISOString() })
    .eq('id', userId);

  const { data: userRes } = await sb.auth.admin.getUserById(userId);
  const email = userRes?.user?.email;
  if (email) await sendWelcomeEmail(email, profile?.display_name ?? null);
}

function extractRow(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.lookup_key
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

async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) { console.error('No userId in subscription metadata'); return; }
  await getSupabase().from('subscriptions').upsert(
    { user_id: userId, ...extractRow(subscription, env) },
    { onConflict: 'stripe_subscription_id' },
  );
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    await grantWelcomeBonus(userId, subscription.id, env);
  }
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const row = extractRow(subscription, env);
  await getSupabase()
    .from('subscriptions')
    .update(row)
    .eq('stripe_subscription_id', subscription.id)
    .eq('environment', env);
  // If trial converted to active (or was activated late), grant bonus.
  if (subscription.status === 'active' || subscription.status === 'trialing') {
    const userId = subscription.metadata?.userId;
    if (userId) await grantWelcomeBonus(userId, subscription.id, env);
  }
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from('subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('stripe_subscription_id', subscription.id)
    .eq('environment', env);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
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
      console.log('Unhandled event:', event.type);
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
          console.error('Webhook error:', e);
          return new Response('Webhook error', { status: 400 });
        }
      },
    },
  },
});
