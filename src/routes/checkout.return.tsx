import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/app-shell';
import { Check } from 'lucide-react';

export const Route = createFileRoute('/checkout/return')({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === 'string' ? search.session_id : undefined,
  }),
  head: () => ({ meta: [{ title: 'Payment complete — ProjectSim' }] }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  return (
    <AppShell variant="marketing" hideFooter>
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-primary">
          <Check className="h-7 w-7" />
        </div>
        <h1 className="mt-6 font-display text-4xl tracking-tight">
          {session_id ? "You're on ProjectSim Pro" : 'No session information found'}
        </h1>
        <p className="mt-4 text-muted-foreground">
          {session_id
            ? 'Your subscription is active. Time to run some projects.'
            : 'If you completed a payment, it may take a moment to reflect.'}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/play">Open simulator</Link>
          </Button>
          <Button asChild variant="outline" className="border-border bg-surface/60 hover:bg-surface">
            <Link to="/pricing">Manage billing</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
