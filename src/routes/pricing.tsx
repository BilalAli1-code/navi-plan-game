import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { StripeEmbeddedCheckout } from '@/components/StripeEmbeddedCheckout';
import { PaymentTestModeBanner } from '@/components/PaymentTestModeBanner';
import { AppShell } from '@/components/app-shell';
import { useSubscription } from '@/hooks/useSubscription';
import { createPortalSession } from '@/utils/payments.functions';
import { toast } from 'sonner';
import { Check, X, ArrowRight } from 'lucide-react';

export const Route = createFileRoute('/pricing')({
  head: () => ({
    meta: [
      { title: 'Pricing — ProjectSim' },
      { name: 'description', content: 'Four plans for PMP candidates and teams. Start free, upgrade to Pro at $19/month, scale to Team, or contact us for Enterprise.' },
      { property: 'og:title', content: 'Pricing — ProjectSim' },
      { property: 'og:description', content: 'Four plans for PMP prep — from solo learner to enterprise cohorts.' },
    ],
  }),
  component: PricingPage,
});

type PlanId = 'starter_monthly' | 'pro_monthly' | 'team_monthly';

interface Plan {
  id: PlanId | 'enterprise';
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: { label: string; included: boolean }[];
  cta: string;
  highlight?: boolean;
  contact?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'starter_monthly',
    name: 'Starter',
    price: '$9',
    cadence: '/ month',
    tagline: 'For solo learners starting PMP prep.',
    features: [
      { label: 'Mini exams (20 questions)', included: true },
      { label: 'Core simulation scenarios', included: true },
      { label: 'Progress & streak tracking', included: true },
      { label: 'Full 180-question exam', included: false },
      { label: 'AI PMP coach', included: false },
    ],
    cta: 'Start Starter',
  },
  {
    id: 'pro_monthly',
    name: 'Pro',
    price: '$19',
    cadence: '/ month',
    tagline: 'For serious candidates. 7-day free trial.',
    highlight: true,
    features: [
      { label: 'Everything in Starter', included: true },
      { label: 'Full 180-question PMP exam', included: true },
      { label: 'AI PMP coach on every decision', included: true },
      { label: 'XP, badges & history', included: true },
      { label: '+500 XP welcome bonus', included: true },
    ],
    cta: 'Upgrade to Pro',
  },
  {
    id: 'team_monthly',
    name: 'Team',
    price: '$49',
    cadence: '/ month',
    tagline: 'For study groups & small teams.',
    features: [
      { label: 'Everything in Pro', included: true },
      { label: 'Up to 5 seats', included: true },
      { label: 'Shared analytics dashboard', included: true },
      { label: 'Team leaderboard', included: true },
      { label: 'Priority support', included: true },
    ],
    cta: 'Start Team',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: "Let's talk",
    cadence: '',
    tagline: 'For organizations training PMs at scale.',
    contact: true,
    features: [
      { label: 'Everything in Team', included: true },
      { label: 'Unlimited seats', included: true },
      { label: 'SSO / SAML', included: true },
      { label: 'Admin dashboard & roles', included: true },
      { label: 'Custom scenarios & branding', included: true },
      { label: 'Dedicated success manager', included: true },
    ],
    cta: 'Contact sales',
  },
];

function PricingPage() {
  const navigate = useNavigate();
  const [checkoutPrice, setCheckoutPrice] = useState<PlanId | null>(null);
  const { isActive, loading, userId, subscription } = useSubscription();

  const openPortal = async () => {
    try {
      const result = await createPortalSession({
        data: { returnUrl: window.location.href },
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
    <AppShell variant="marketing">
      <PaymentTestModeBanner />

      {/* Masthead */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24">
          <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-6 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            <span>Section — Pricing</span>
            <span className="hidden sm:inline">Four plans · Upgrade or cancel anytime</span>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-12 md:items-end">
            <h1 className="font-display text-5xl leading-[1.02] tracking-tight sm:text-6xl md:col-span-8 md:text-7xl">
              A plan for how you actually study.
            </h1>
            <p className="max-w-md text-muted-foreground md:col-span-4">
              Pay for what you use. Every plan includes progress that persists across
              devices and a 30-day money-back promise.
            </p>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              disabled={loading || (isActive && !plan.contact && plan.id !== 'pro_monthly')}
              signedIn={!!userId}
              isActive={isActive}
              cancelAtPeriodEnd={!!subscription?.cancel_at_period_end}
              loading={loading}
              onStart={() => plan.id !== 'enterprise' && startCheckout(plan.id as PlanId)}
              onManage={openPortal}
            />
          ))}
        </div>

        {checkoutPrice && !isActive && (
          <div className="mx-auto mt-14 max-w-3xl rounded-3xl border border-border bg-surface p-2">
            <div className="rounded-2xl bg-background p-2">
              <StripeEmbeddedCheckout priceId={checkoutPrice} />
            </div>
          </div>
        )}
      </section>

      {/* FAQ / trust strip */}
      <section className="border-t border-border/60 bg-surface/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-3">
          {[
            { t: 'Change plans anytime', d: 'Upgrade instantly. Downgrades take effect at the end of your billing period.' },
            { t: 'Cancel with one click', d: "Manage everything in the billing portal — no email required." },
            { t: 'Data belongs to you', d: 'Your exam history, XP, and progress export as JSON on request.' },
          ].map((f) => (
            <div key={f.t}>
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                Guarantee
              </div>
              <div className="mt-2 font-display text-2xl tracking-tight">{f.t}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

function PlanCard({
  plan,
  signedIn,
  isActive,
  cancelAtPeriodEnd,
  loading,
  onStart,
  onManage,
}: {
  plan: Plan;
  disabled: boolean;
  signedIn: boolean;
  isActive: boolean;
  cancelAtPeriodEnd: boolean;
  loading: boolean;
  onStart: () => void;
  onManage: () => void;
}) {
  const isPro = plan.id === 'pro_monthly';
  return (
    <div
      className={
        'relative flex flex-col rounded-2xl border p-8 transition ' +
        (plan.highlight
          ? 'border-primary bg-surface shadow-2xl shadow-primary/20'
          : plan.contact
          ? 'border-border/70 bg-surface/60'
          : 'border-border/70 bg-surface/40 hover:bg-surface')
      }
    >
      {plan.highlight && (
        <div className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-primary-foreground">
          Most popular
        </div>
      )}

      <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
        {plan.name}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-5xl font-bold tracking-tight">
          {plan.price}
        </span>
        {plan.cadence && (
          <span className="text-sm text-muted-foreground">{plan.cadence}</span>
        )}
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{plan.tagline}</p>

      <ul className="mt-8 flex-1 space-y-3 text-sm">
        {plan.features.map((f) => (
          <li key={f.label} className="flex items-start gap-2.5">
            {f.included ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            ) : (
              <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
            )}
            <span className={f.included ? 'text-foreground' : 'text-muted-foreground/70 line-through'}>
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        {plan.contact ? (
          <Button
            asChild
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <a href="mailto:sales@projectsim.app?subject=Enterprise%20inquiry">
              {plan.cta} <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
        ) : loading ? (
          <Button disabled className="w-full">Loading…</Button>
        ) : isPro && isActive ? (
          <div className="space-y-2">
            <div className="rounded-lg border border-primary/40 bg-primary-soft px-3 py-2 text-center text-xs text-foreground">
              You're subscribed {cancelAtPeriodEnd ? '· cancels at period end' : ''}
            </div>
            <Button
              onClick={onManage}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Manage billing
            </Button>
          </div>
        ) : (
          <Button
            onClick={onStart}
            variant={plan.highlight ? 'default' : 'outline'}
            className={
              plan.highlight
                ? 'w-full bg-primary text-primary-foreground hover:bg-primary/90'
                : 'w-full border-border bg-background/40 hover:bg-background'
            }
          >
            {signedIn ? plan.cta : 'Sign in to start'}
          </Button>
        )}
      </div>
    </div>
  );
}
