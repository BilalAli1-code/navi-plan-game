import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionRow {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  product_id: string;
  price_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  environment: string;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Row filtering: we accept whatever env the webhook wrote for THIS user.
  // The server decides which env is live; the client just displays whatever exists.
  const refetch = async (uid: string) => {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription((data as SubscriptionRow | null) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) { setLoading(false); return; }
      refetch(uid);
      channel = supabase
        .channel(`subs-${uid}`)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'subscriptions',
          filter: `user_id=eq.${uid}`,
        }, () => refetch(uid))
        .subscribe();
    });

    return () => { if (channel) supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isActive = !!subscription && (
    (['active', 'trialing', 'past_due'].includes(subscription.status) &&
      (!subscription.current_period_end || new Date(subscription.current_period_end) > new Date())) ||
    (subscription.status === 'canceled' && !!subscription.current_period_end &&
      new Date(subscription.current_period_end) > new Date())
  );

  return { subscription, isActive, loading, userId };
}
