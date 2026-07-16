import { createServerFn } from "@tanstack/react-start";
import Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";
import { resolveStripeEnv } from "@/lib/stripe.env.server";
import { PRICE_LOOKUP_ALLOWLIST, isActiveStatus, priceMetaFor } from "@/lib/billing/entitlements";

type CheckoutSessionResult = { clientSecret: string } | { error: string };
type PortalSessionResult = { url: string } | { error: string };

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error("Invalid userId");
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { priceId: string; returnUrl: string; seats?: number }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error("Invalid priceId");
    if (!(data.priceId in PRICE_LOOKUP_ALLOWLIST)) throw new Error("Unknown plan");
    if (typeof data.returnUrl !== "string" || !/^https?:\/\//.test(data.returnUrl)) {
      throw new Error("Invalid returnUrl");
    }
    if (
      data.seats != null &&
      (!Number.isInteger(data.seats) || data.seats < 1 || data.seats > 50)
    ) {
      throw new Error("seats must be 1-50");
    }
    return { priceId: data.priceId, returnUrl: data.returnUrl, seats: data.seats };
  })
  .handler(async ({ data, context }): Promise<CheckoutSessionResult> => {
    try {
      const env = resolveStripeEnv();
      const stripe = createStripeClient(env);
      const { userId, supabase } = context;
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email ?? undefined;

      const meta = priceMetaFor(data.priceId);
      if (!meta) return { error: "Unknown plan" };

      // Seats: required (>=2) for team plans, ignored otherwise.
      let quantity = 1;
      if (meta.seatBased) {
        quantity = Math.max(2, Math.min(50, data.seats ?? 2));
      }

      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      if (!prices.data.length) return { error: "Price not configured in Stripe" };
      const stripePrice = prices.data[0];
      if (!(stripePrice.lookup_key && stripePrice.lookup_key in PRICE_LOOKUP_ALLOWLIST)) {
        return { error: "Price is not approved for checkout" };
      }
      if (stripePrice.type !== "recurring") {
        return { error: "Only recurring subscription prices are supported" };
      }
      if (stripePrice.recurring?.interval !== meta.interval) {
        return { error: "Price interval does not match the selected plan" };
      }

      const customerId = await resolveOrCreateCustomer(stripe, { email, userId });

      const sessionParams: Stripe.Checkout.SessionCreateParams & {
        managed_payments: { enabled: boolean };
      } = {
        line_items: [{ price: stripePrice.id, quantity }],
        mode: "subscription",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        customer: customerId,
        metadata: { userId, tier: meta.tier, plan: data.priceId },
        managed_payments: { enabled: true },
      };

      sessionParams.subscription_data = {
        metadata: { userId, tier: meta.tier, plan: data.priceId, seats: String(quantity) },
        // Trial ONLY on Pro plans.
        ...(meta.trialDays ? { trial_period_days: meta.trialDays } : {}),
      };

      const session = await stripe.checkout.sessions.create(sessionParams);
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string }) => data ?? {})
  .handler(async ({ data, context }): Promise<PortalSessionResult> => {
    const { supabase, userId } = context;
    const env = resolveStripeEnv();

    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subError || !sub?.stripe_customer_id) return { error: "No subscription found" };

    try {
      const stripe = createStripeClient(env);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        ...(data?.returnUrl && { return_url: data.returnUrl }),
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/**
 * Post-checkout verification. The return page calls this so we don't rely
 * on the URL parameter alone to claim the user is subscribed.
 */
export const verifyCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sessionId: string }) => {
    if (!data?.sessionId || !/^cs_[a-zA-Z0-9_]+$/.test(data.sessionId)) {
      throw new Error("Invalid sessionId");
    }
    return { sessionId: data.sessionId };
  })
  .handler(
    async ({
      data,
      context,
    }): Promise<
      { ok: true; tier: string; planName: string; status: string } | { ok: false; reason: string }
    > => {
      try {
        const env = resolveStripeEnv();
        const stripe = createStripeClient(env);
        const session = await stripe.checkout.sessions.retrieve(data.sessionId, {
          expand: ["subscription", "customer"],
        });

        // Must belong to the caller.
        const customer =
          typeof session.customer === "string"
            ? await stripe.customers.retrieve(session.customer)
            : session.customer;
        const customerUserId =
          customer && !("deleted" in customer && customer.deleted)
            ? customer.metadata?.userId
            : undefined;
        if (customerUserId !== context.userId) {
          return { ok: false, reason: "Session does not belong to current user" };
        }

        const sub =
          session.subscription && typeof session.subscription !== "string"
            ? (session.subscription as Stripe.Subscription)
            : null;
        const priceKey = sub?.items?.data?.[0]?.price?.lookup_key ?? session.metadata?.plan ?? "";
        const meta = priceMetaFor(priceKey);
        const tier = meta?.tier ?? "free";
        const planName = meta?.displayName ?? priceKey ?? "Plan";
        const status = sub?.status ?? "canceled";
        const periodEnd =
          sub?.items?.data?.[0]?.current_period_end ??
          (sub as unknown as { current_period_end?: number } | null)?.current_period_end ??
          null;
        const ok =
          !!sub &&
          isActiveStatus(
            status,
            periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          );
        return ok
          ? { ok: true, tier, planName, status }
          : { ok: false, reason: `Status: ${status}` };
      } catch (error) {
        return { ok: false, reason: getStripeErrorMessage(error) };
      }
    },
  );
