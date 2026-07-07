import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StripeEmbeddedCheckout } from '@/components/StripeEmbeddedCheckout';
import { PaymentTestModeBanner } from '@/components/PaymentTestModeBanner';
import { useSubscription } from '@/hooks/useSubscription';
import { createPortalSession } from '@/utils/payments.functions';
import { getStripeEnvironment } from '@/lib/stripe';
import { toast } from 'sonner';

export const Route = createFileRoute('/pricing')({
  head: () => ({
    meta: [
      { title: 'ProjectSim Pro — Pricing' },
      { name: 'description', content: 'Unlock unlimited PMBOK simulation runs, AI coaching, XP tracking, and badges for $19/month.' },
      { property: 'og:title', content: 'ProjectSim Pro — $19/month' },
      { property: 'og:description', content: 'Unlimited PMBOK simulations, AI coach, XP and badges.' },
    ],
  }),
  component: PricingPage,
});

type PlanId = 'starter_monthly' | 'pro_monthly' | 'team_monthly';

function PricingPage() {
  const navigate = useNavigate();
  const [checkoutPrice, setCheckoutPrice] = useState<PlanId | null>(null);
  const { isActive, loading, userId, subscription } = useSubscription();

  const openPortal = async () => {
    try {
      const result = await createPortalSession({
        data: { environment: getStripeEnvironment(), returnUrl: window.location.href },
      });
      if ('error' in result) throw new Error(result.error);
      window.open(result.url, '_blank');
    } catch (e: any) {
      toast.error(e.message ?? 'Could not open billing portal');
    }
  };

  const startCheckout = (priceId: PlanId) => {
    if (!userId) { navigate({ to: '/auth' }); return; }
    setCheckoutPrice(priceId);
  };

  return (
    <div className="min-h-screen bg-[#0b1020] text-slate-100">
      <PaymentTestModeBanner />
      <header className="border-b border-white/5">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 font-black text-slate-950">PS</div>
            <div className="text-sm font-semibold sm:text-base">ProjectSim</div>
          </Link>
          <Button asChild variant="outline" className="border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]">
            <Link to="/play">Open simulator</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Choose your plan</h1>
          <p className="mt-3 text-slate-400">Train like a real PM. Upgrade, downgrade, or cancel anytime.</p>
        </div>

        <div className="mx-auto mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {/* Starter */}
          <div className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <div className="text-sm font-semibold text-slate-400">Starter</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-5xl font-black">$9</span>
              <span className="text-slate-500">/ mo</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">For solo learners starting PMP prep.</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-300">
              <li>✓ Mini exams (20 Q)</li>
              <li>✓ Core simulation scenarios</li>
              <li>✓ Progress & streak tracking</li>
              <li>✗ Full 180-Q exam</li>
              <li>✗ AI PMP coach</li>
            </ul>
            <Button
              onClick={() => startCheckout('starter_monthly')}
              disabled={loading || isActive}
              className="mt-8 w-full border border-white/10 bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
            >
              {userId ? 'Start Starter' : 'Sign in to start'}
            </Button>
          </div>

          {/* Pro — highlighted */}
          <div className="flex flex-col rounded-3xl border border-cyan-400/40 bg-gradient-to-br from-indigo-500/10 to-cyan-400/10 p-8 shadow-[0_0_60px_-20px_rgba(34,211,238,0.5)]">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-cyan-300">Pro</div>
              <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-200">Most popular</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-5xl font-black">$19</span>
              <span className="text-slate-500">/ mo</span>
            </div>
            <div className="mt-2 inline-flex rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
              7-day free trial
            </div>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-200">
              <li>✓ Everything in Starter</li>
              <li>✓ Full 180-Q PMP exam</li>
              <li>✓ AI PMP coach on every decision</li>
              <li>✓ XP, badges & history</li>
              <li>✓ +500 XP welcome bonus</li>
            </ul>
            {loading ? (
              <Button disabled className="mt-8 w-full">Loading…</Button>
            ) : isActive ? (
              <div className="mt-8 space-y-2">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 px-3 py-2 text-center text-sm text-emerald-200">
                  You're subscribed {subscription?.cancel_at_period_end ? '(cancels at period end)' : ''}
                </div>
                <Button onClick={openPortal} className="w-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 hover:opacity-90">
                  Manage billing
                </Button>
              </div>
            ) : (
              <Button onClick={() => startCheckout('pro_monthly')} className="mt-8 w-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 hover:opacity-90">
                {userId ? 'Upgrade to Pro' : 'Sign in to upgrade'}
              </Button>
            )}
          </div>

          {/* Team */}
          <div className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <div className="text-sm font-semibold text-slate-400">Team</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-5xl font-black">$49</span>
              <span className="text-slate-500">/ mo</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">For study groups & small teams.</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-300">
              <li>✓ Everything in Pro</li>
              <li>✓ Up to 5 seats</li>
              <li>✓ Shared analytics dashboard</li>
              <li>✓ Team leaderboard</li>
              <li>✓ Priority support</li>
            </ul>
            <Button
              onClick={() => startCheckout('team_monthly')}
              disabled={loading || isActive}
              className="mt-8 w-full border border-white/10 bg-white/[0.06] text-slate-100 hover:bg-white/[0.1]"
            >
              {userId ? 'Start Team' : 'Sign in to start'}
            </Button>
          </div>

          {/* Enterprise — contact sales, no price */}
          <div className="flex flex-col rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-8">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-amber-300">Enterprise</div>
              <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">Custom</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-black">Let's talk</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">For organizations training PMs at scale.</p>
            <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-300">
              <li>✓ Everything in Team</li>
              <li>✓ Unlimited seats</li>
              <li>✓ SSO / SAML</li>
              <li>✓ Admin dashboard & roles</li>
              <li>✓ Custom scenarios & branding</li>
              <li>✓ Dedicated success manager</li>
            </ul>
            <Button
              asChild
              className="mt-8 w-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 hover:opacity-90"
            >
              <a href="mailto:sales@projectsim.app?subject=Enterprise%20inquiry">Contact sales</a>
            </Button>
          </div>
        </div>

        {checkoutPrice && !isActive && (
          <div className="mx-auto mt-12 max-w-3xl rounded-3xl border border-white/10 bg-white p-2">
            <StripeEmbeddedCheckout priceId={checkoutPrice} />
          </div>
        )}
      </main>
    </div>
  );
}
