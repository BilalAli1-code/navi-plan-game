import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { resolveStripeEnv } from '../stripe.env.server';

type TeamOverview = {
  team: {
    id: string;
    seats: number;
    status: string;
    stripe_subscription_id: string;
    current_period_end: string | null;
  } | null;
  memberships: Array<{
    id: string;
    invited_email: string;
    status: string;
    role: string;
    invited_at: string;
    accepted_at: string | null;
  }>;
  isOwner: boolean;
};

export const getMyTeam = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TeamOverview> => {
    const { supabase, userId } = context;
    const env = resolveStripeEnv();
    const { data: team } = await supabase
      .from('team_subscriptions')
      .select('*')
      .eq('owner_user_id', userId)
      .eq('environment', env)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!team) return { team: null, memberships: [], isOwner: false };

    const { data: memberships } = await supabase
      .from('team_memberships')
      .select('id, invited_email, status, role, invited_at, accepted_at')
      .eq('team_id', team.id);

    return {
      team: {
        id: team.id,
        seats: team.seats,
        status: team.status,
        stripe_subscription_id: team.stripe_subscription_id,
        current_period_end: team.current_period_end,
      },
      memberships: memberships ?? [],
      isOwner: true,
    };
  });

export const inviteTeamMember = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { email: string }) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email ?? '')) throw new Error('Invalid email');
    return { email: data.email.trim().toLowerCase() };
  })
  .handler(async ({ data, context }): Promise<{ ok: true; token: string } | { ok: false; error: string }> => {
    const { supabase, userId } = context;
    const env = resolveStripeEnv();

    const { data: team } = await supabase
      .from('team_subscriptions')
      .select('id, seats')
      .eq('owner_user_id', userId)
      .eq('environment', env)
      .maybeSingle();
    if (!team) return { ok: false, error: 'You do not own a team subscription' };

    // Enforce seat cap (owner counts as 1 seat)
    const { count } = await supabase
      .from('team_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', team.id)
      .in('status', ['invited', 'accepted']);
    if ((count ?? 0) + 1 >= team.seats) {
      return { ok: false, error: 'No seats available. Add seats in billing.' };
    }

    const { data: row, error } = await supabase
      .from('team_memberships')
      .insert({
        team_id: team.id,
        invited_email: data.email,
        role: 'member',
        status: 'invited',
      })
      .select('invite_token')
      .single();
    if (error) return { ok: false, error: error.message };
    return { ok: true, token: row.invite_token as string };
  });

export const removeTeamMember = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { membershipId: string }) => {
    if (!data?.membershipId) throw new Error('membershipId required');
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const env = resolveStripeEnv();
    // Ensure the membership belongs to a team owned by this user
    const { data: mem } = await supabase
      .from('team_memberships')
      .select('id, team_id')
      .eq('id', data.membershipId)
      .maybeSingle();
    if (!mem) return { ok: false, error: 'Not found' };

    const { data: team } = await supabase
      .from('team_subscriptions')
      .select('id')
      .eq('id', mem.team_id)
      .eq('owner_user_id', userId)
      .eq('environment', env)
      .maybeSingle();
    if (!team) return { ok: false, error: 'Not your team' };

    const { error } = await supabase
      .from('team_memberships')
      .update({ status: 'revoked' })
      .eq('id', data.membershipId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  });

export const acceptTeamInvite = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { token: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data?.token ?? '')) throw new Error('Invalid token');
    return { token: data.token };
  })
  .handler(async ({ data, context }) => {
    const { data: rpc, error } = await context.supabase.rpc('accept_team_invite', { _token: data.token });
    if (error) return { ok: false, error: error.message };
    const row = Array.isArray(rpc) ? rpc[0] : rpc;
    return row?.accepted ? { ok: true, teamId: row.team_id } : { ok: false, error: 'Invite not found or already used' };
  });
