import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { AppShell } from '@/components/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getMyTeam, inviteTeamMember, removeTeamMember, acceptTeamInvite } from '@/lib/billing/team.functions';

export const Route = createFileRoute('/_authenticated/team')({
  head: () => ({ meta: [{ title: 'Team — ProjectSim' }] }),
  validateSearch: (s: Record<string, unknown>): { invite?: string } => ({
    invite: typeof s.invite === 'string' ? s.invite : undefined,
  }),
  component: TeamPage,
});

function TeamPage() {
  const { invite } = Route.useSearch();
  const load = useServerFn(getMyTeam);
  const invite$ = useServerFn(inviteTeamMember);
  const remove$ = useServerFn(removeTeamMember);
  const accept$ = useServerFn(acceptTeamInvite);

  const [state, setState] = useState<Awaited<ReturnType<typeof getMyTeam>> | null>(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const r = await load();
    setState(r);
  };

  useEffect(() => {
    refresh();
    if (invite) {
      accept$({ data: { token: invite } })
        .then((r) => {
          if ('ok' in r && r.ok) { toast.success('Joined team'); refresh(); }
          else toast.error(('error' in r && r.error) || 'Invite failed');
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doInvite = async () => {
    setBusy(true);
    try {
      const r = await invite$({ data: { email } });
      if ('ok' in r && r.ok) {
        const link = `${window.location.origin}/team?invite=${r.token}`;
        await navigator.clipboard.writeText(link).catch(() => {});
        toast.success('Invite created — link copied to clipboard');
        setEmail('');
        refresh();
      } else {
        toast.error(('error' in r && r.error) || 'Invite failed');
      }
    } finally { setBusy(false); }
  };

  const doRemove = async (id: string) => {
    const r = await remove$({ data: { membershipId: id } });
    if ('ok' in r && r.ok) refresh();
    else toast.error(('error' in r && r.error) || 'Remove failed');
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="font-display text-4xl tracking-tight">Team</h1>

        {!state ? (
          <p className="mt-6 text-muted-foreground">Loading…</p>
        ) : !state.team ? (
          <div className="mt-8 rounded-2xl border border-border bg-surface/60 p-6">
            <p className="text-muted-foreground">You don't own a Team subscription.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              If someone invited you, open the invite link they sent — it looks like <code>/team?invite=…</code>.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-2xl border border-border bg-surface/60 p-6">
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Plan</div>
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <div className="font-display text-2xl">{state.team.seats} seats</div>
                  <div className="text-sm text-muted-foreground">Status: {state.team.status}</div>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-border bg-surface/60 p-6">
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Invite someone</div>
              <div className="mt-3 flex gap-2">
                <Input
                  type="email"
                  placeholder="teammate@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="max-w-sm"
                />
                <Button onClick={doInvite} disabled={busy || !email}>Send invite</Button>
              </div>
            </div>

            <div className="mt-8">
              <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Members</div>
              <ul className="mt-3 divide-y divide-border/60 rounded-2xl border border-border bg-surface/40">
                {state.memberships.length === 0 && (
                  <li className="p-4 text-sm text-muted-foreground">No invites yet.</li>
                )}
                {state.memberships.map((m) => (
                  <li key={m.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium">{m.invited_email}</div>
                      <div className="text-xs text-muted-foreground">
                        {m.status} · {m.role}
                      </div>
                    </div>
                    {m.status !== 'revoked' && (
                      <Button variant="outline" size="sm" onClick={() => doRemove(m.id)}>
                        Remove
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
