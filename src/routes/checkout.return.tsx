import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen bg-[#0b1020] text-slate-100">
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/20 text-3xl">✓</div>
        <h1 className="mt-6 text-3xl font-black">
          {session_id ? "You're on ProjectSim Pro" : 'No session information found'}
        </h1>
        <p className="mt-3 text-slate-400">
          {session_id
            ? 'Your subscription is active. Time to run some projects.'
            : 'If you completed a payment, it may take a moment to reflect.'}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild className="bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 hover:opacity-90">
            <Link to="/play">Open simulator</Link>
          </Button>
          <Button asChild variant="outline" className="border-white/10 bg-white/[0.04] text-slate-100 hover:bg-white/[0.08]">
            <Link to="/pricing">Manage billing</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
