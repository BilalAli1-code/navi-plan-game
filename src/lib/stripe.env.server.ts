// Server decides which Stripe environment to use. Clients cannot influence this.
import type { StripeEnv } from './stripe.server';

export function resolveStripeEnv(): StripeEnv {
  // If a live key is configured AND we're not obviously in dev, use live.
  const hasLive = !!process.env.STRIPE_LIVE_API_KEY && !!process.env.PAYMENTS_LIVE_WEBHOOK_SECRET;
  const isProd = process.env.NODE_ENV === 'production';
  return hasLive && isProd ? 'live' : 'sandbox';
}
