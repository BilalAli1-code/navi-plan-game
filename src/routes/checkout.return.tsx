import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/app-shell';
import { Check, AlertTriangle, Loader2 } from 'lucide-react';
import { verifyCheckoutSession } from '@/utils/payments.functions';

export const Route = createFileRoute('/checkout/return')({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === 'string' ? search.session_id : undefined,
  }),
  head: () => ({ meta: [{ title: 'Payment complete — ProjectSim' }] }),
  component: CheckoutReturn,
});

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; planName: string; tier: string }
  | { kind: 'error'; reason: string };

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (!session_id) { setState({ kind: 'error', reason: 'No session id provided' }); return; }
    verifyCheckoutSession({ data: { sessionId: session_id } })
      .then((r) => {
        if (r.ok) setState({ kind: 'ok', planName: r.planName, tier: r.tier });
        else setState({ kind: 'error', reason: r.reason });
      })
      .catch((e) => setState({ kind: 'error', reason: e?.message ?? 'Verification failed' }));
  }, [session_id]);

  return (
    <AppShell variant="marketing" hideFooter>
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        {state.kind === 'loading' && (
          <>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-surface text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin" />
            </div>
            <h1 className="mt-6 font-display text-4xl tracking-tight">Confirming your payment…</h1>
            <p className="mt-4 text-muted-foreground">This usually takes a couple of seconds.</p>
          </>
        )}
        {state.kind === 'ok' && (
          <>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-primary">
              <Check className="h-7 w-7" />
            </div>
            <h1 className="mt-6 font-display text-4xl tracking-tight">You're on {state.planName}</h1>
            <p className="mt-4 text-muted-foreground">Your subscription is active. Time to run some projects.</p>
            <div className="mt-8 flex justify-center gap-3">
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/play">Open simulator</Link>
              </Button>
              {state.tier === 'team' && (
                <Button asChild variant="outline" className="border-border bg-surface/60 hover:bg-surface">
                  <Link to="/team">Invite teammates</Link>
                </Button>
              )}
              <Button asChild variant="outline" className="border-border bg-surface/60 hover:bg-surface">
                <Link to="/pricing">Manage billing</Link>
              </Button>
            </div>
          </>
        )}
        {state.kind === 'error' && (
          <>
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h1 className="mt-6 font-display text-4xl tracking-tight">We couldn't verify that payment</h1>
            <p className="mt-4 text-muted-foreground">{state.reason}</p>
            <div className="mt-8 flex justify-center gap-3">
              <Button asChild variant="outline" className="border-border bg-surface/60 hover:bg-surface">
                <Link to="/pricing">Back to pricing</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
