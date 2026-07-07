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

function PricingPage() {
  const navigate = useNavigate();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
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

  const startCheckout = () => {
    if (!userId) { navigate({ to: '/auth' }); return; }
    setCheckoutOpen(true);
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

      <main className="mx-auto max-w-5xl px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Simple pricing</h1>
          <p className="mt-3 text-slate-400">Train like a real PM. Cancel anytime.</p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
            <div className="text-sm font-semibold text-slate-400">Free</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-5xl font-black">$0</span>
              <span className="text-slate-500">/ forever</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-slate-300">
              <li>✓ Preview business case</li>
              <li>✓ Play the Initiation phase</li>
              <li>✗ Full 5-phase simulation</li>
              <li>✗ AI PMP coach</li>
            </ul>
            <Button asChild variant="outline" className="mt-8 w-full border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]">
              <Link to="/play">Try free</Link>
            </Button>
          </div>

          <div className="rounded-3xl border border-cyan-400/40 bg-gradient-to-br from-indigo-500/10 to-cyan-400/10 p-8 shadow-[0_0_60px_-20px_rgba(34,211,238,0.5)]">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-cyan-300">Pro</div>
              <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-200">Most popular</span>
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-5xl font-black">$19</span>
              <span className="text-slate-500">/ month</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-slate-200">
              <li>✓ Unlimited full simulation runs</li>
              <li>✓ All PMBOK 6 & 7 scenarios</li>
              <li>✓ AI PMP coach on every decision</li>
              <li>✓ XP, badges & progress history</li>
              <li>✓ Installable mobile app</li>
            </ul>
            {loading ? (
              <Button disabled className="mt-8 w-full">Loading…</Button>
            ) : isActive ? (
              <div className="mt-8 space-y-2">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 px-3 py-2 text-center text-sm text-emerald-200">
                  You're on Pro {subscription?.cancel_at_period_end ? '(cancels at period end)' : ''}
                </div>
                <Button onClick={openPortal} className="w-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 hover:opacity-90">
                  Manage billing
                </Button>
              </div>
            ) : (
              <Button onClick={startCheckout} className="mt-8 w-full bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 hover:opacity-90">
                {userId ? 'Upgrade to Pro' : 'Sign in to upgrade'}
              </Button>
            )}
          </div>
        </div>

        {checkoutOpen && !isActive && (
          <div className="mx-auto mt-12 max-w-3xl rounded-3xl border border-white/10 bg-white p-2">
            <StripeEmbeddedCheckout priceId="pro_monthly" />
          </div>
        )}
      </main>
    </div>
  );
}
