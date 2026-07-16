import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import {
  normalizeSubscriptionStatus,
  PRICE_LOOKUP_ALLOWLIST,
  priceMetaFor,
} from "@/lib/billing/entitlements";

type SupabaseClientLike = ReturnType<typeof createClient<Database>>;

let _supabase: SupabaseClientLike | null = null;
function getSupabase(): SupabaseClientLike {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

const WELCOME_XP_BONUS = 500;

async function sendWelcomeEmail(email: string, displayName: string | null) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log("[welcome-email] RESEND_API_KEY not set, skipping send to", email);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "ProjectSim <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to ProjectSim Pro 🚀",
        html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:auto;padding:24px;">
          <h1 style="margin:0 0 12px;">Welcome${displayName ? `, ${displayName}` : ""}!</h1>
          <p>Your ProjectSim Pro subscription is active.</p>
        </div>`,
      }),
    });
    if (!res.ok) console.error("[welcome-email] resend failed", res.status, await res.text());
  } catch (e) {
    console.error("[welcome-email] error", e);
  }
}

async function grantWelcomeBonusTransactional(subscriptionId: string, env: StripeEnv) {
  const sb = getSupabase();
  const { data, error } = await sb.rpc("grant_welcome_bonus", {
    _subscription_id: subscriptionId,
    _env: env,
    _bonus: WELCOME_XP_BONUS,
  });
  if (error) throw new Error(`grant_welcome_bonus failed: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.granted || !row?.user_id) return;

  // Best-effort side-effect: email. Not transactional with XP.
  const { data: userRes } = await sb.auth.admin.getUserById(row.user_id);
  const email = userRes?.user?.email;
  if (email) await sendWelcomeEmail(email, row.display_name ?? null);
}

function extractRow(subscription: Stripe.Subscription, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const priceId =
    item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const price = item?.price;
  const productId =
    typeof price?.product === "string"
      ? price.product
      : (price?.product as { id?: string } | undefined)?.id ?? null;
  const subAny = subscription as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  };
  const itemAny = item as unknown as {
    current_period_start?: number;
    current_period_end?: number;
  } | undefined;
  const periodStart = itemAny?.current_period_start ?? subAny.current_period_start;
  const periodEnd = itemAny?.current_period_end ?? subAny.current_period_end;
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id ?? null;
  return {
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    product_id: productId,
    price_id: priceId,
    status: normalizeSubscriptionStatus(subscription.status),
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    environment: env,
    updated_at: new Date().toISOString(),
  };
}

async function resolveUserIdForSubscription(
  subscription: Stripe.Subscription,
): Promise<string | null> {
  const meta = subscription.metadata?.userId;
  if (meta) return meta;
  const sb = getSupabase();
  const { data } = await sb
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();
  return data?.user_id ?? null;
}

async function upsertTeamRow(subscription: Stripe.Subscription, env: StripeEnv, userId: string) {
  const item = subscription.items?.data?.[0];
  const seats = item?.quantity ?? Number(subscription.metadata?.seats ?? 1);
  const itemAny = item as unknown as { current_period_end?: number } | undefined;
  const subAny = subscription as unknown as { current_period_end?: number };
  const periodEnd = itemAny?.current_period_end ?? subAny.current_period_end;
  const sb = getSupabase();
  const { error } = await sb.from("team_subscriptions").upsert(
    {
      stripe_subscription_id: subscription.id,
      owner_user_id: userId,
      environment: env,
      seats,
      status: normalizeSubscriptionStatus(subscription.status),
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
  if (error) throw new Error(`team_subscriptions upsert failed: ${error.message}`);
}

async function revokeTeamMemberships(subscriptionId: string) {
  const sb = getSupabase();
  const { data: team } = await sb
    .from("team_subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();
  if (!team?.id) return;
  const { error } = await sb
    .from("team_memberships")
    .update({ status: "revoked" })
    .eq("team_id", team.id);
  if (error) throw new Error(`team_memberships revoke failed: ${error.message}`);
}

function validateStripeSubscriptionPrice(subscription: Stripe.Subscription) {
  const item = subscription.items?.data?.[0];
  const price = item?.price;
  const lookupKey = price?.lookup_key;
  if (!lookupKey || !(lookupKey in PRICE_LOOKUP_ALLOWLIST)) {
    throw new Error(
      `Unapproved Stripe price lookup key '${lookupKey ?? "missing"}' for subscription ${subscription.id}`,
    );
  }
  if (price?.type !== "recurring") {
    throw new Error(`Non-recurring Stripe price rejected for subscription ${subscription.id}`);
  }
  const meta = priceMetaFor(lookupKey);
  if (!meta) throw new Error(`Unknown Stripe price lookup key for subscription ${subscription.id}`);
  if (price?.recurring?.interval !== meta.interval) {
    throw new Error(`Stripe interval mismatch for subscription ${subscription.id}`);
  }
  return meta;
}

async function safeUpsertSubscription(subscription: Stripe.Subscription, env: StripeEnv) {
  const userId = await resolveUserIdForSubscription(subscription);
  if (!userId) throw new Error(`No userId resolvable for subscription ${subscription.id}`);
  const meta = validateStripeSubscriptionPrice(subscription);
  const row = extractRow(subscription, env);
  const sb = getSupabase();
  const { error } = await sb
    .from("subscriptions")
    .upsert({ user_id: userId, ...row } as never, { onConflict: "stripe_subscription_id" });
  if (error) throw new Error(`subscriptions upsert failed: ${error.message}`);

  // Team-side mirror
  if (meta?.tier === "team" && subscription.status !== "canceled") {
    await upsertTeamRow(subscription, env, userId);
  }

  // Trial → active or created active/trialing → welcome bonus (Pro only)
  if (
    meta?.tier === "pro" &&
    (subscription.status === "active" || subscription.status === "trialing")
  ) {
    await grantWelcomeBonusTransactional(subscription.id, env);
  }
  return userId;
}

async function handleSubscriptionCreated(sub: Stripe.Subscription, env: StripeEnv) {
  await safeUpsertSubscription(sub, env);
}
async function handleSubscriptionUpdated(sub: Stripe.Subscription, env: StripeEnv) {
  await safeUpsertSubscription(sub, env);
}
async function handleSubscriptionDeleted(sub: Stripe.Subscription, env: StripeEnv) {
  const sb = getSupabase();
  const { error } = await sb
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", sub.id)
    .eq("environment", env);
  if (error) throw new Error(`subscriptions cancel failed: ${error.message}`);

  const { error: tErr } = await sb
    .from("team_subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", sub.id);
  if (tErr) throw new Error(`team_subscriptions cancel failed: ${tErr.message}`);

  await revokeTeamMemberships(sub.id);
}

type EventClaimResult = "claimed" | "completed" | "pending";

async function claimEvent(eventId: string, eventType: string): Promise<EventClaimResult> {
  const sb = getSupabase();
  const attemptedAt = new Date().toISOString();
  const { error } = await sb.from("webhook_events").insert({
    event_id: eventId,
    provider: "stripe",
    event_type: eventType,
    processing_state: "pending",
    error_message: null,
    attempted_at: attemptedAt,
    completed_at: null,
  });
  if (!error) return "claimed";
  if ((error as { code?: string }).code !== "23505") {
    throw new Error(`webhook_events insert failed: ${error.message}`);
  }

  const { data: existing, error: loadError } = await sb
    .from("webhook_events")
    .select("processing_state")
    .eq("event_id", eventId)
    .maybeSingle();
  if (loadError) throw new Error(`webhook_events lookup failed: ${loadError.message}`);
  if (existing?.processing_state === "completed") return "completed";
  if (existing?.processing_state === "pending") return "pending";

  const { data: retryRows, error: retryError } = await sb
    .from("webhook_events")
    .update({
      provider: "stripe",
      event_type: eventType,
      processing_state: "pending",
      error_message: null,
      attempted_at: attemptedAt,
      completed_at: null,
    })
    .eq("event_id", eventId)
    .eq("processing_state", "failed")
    .select("event_id");
  if (retryError) throw new Error(`webhook_events retry failed: ${retryError.message}`);
  if ((retryRows?.length ?? 0) > 0) return "claimed";

  const { data: latest, error: latestError } = await sb
    .from("webhook_events")
    .select("processing_state")
    .eq("event_id", eventId)
    .maybeSingle();
  if (latestError) throw new Error(`webhook_events recheck failed: ${latestError.message}`);
  if (latest?.processing_state === "completed") return "completed";
  if (latest?.processing_state === "pending") return "pending";
  throw new Error(`Failed to insert webhook event after retry check: ${error.message}`);
}

async function markEventCompleted(eventId: string) {
  const { error } = await getSupabase()
    .from("webhook_events")
    .update({
      processing_state: "completed",
      error_message: null,
      completed_at: new Date().toISOString(),
    })
    .eq("event_id", eventId);
  if (error) throw new Error(`webhook_events complete failed: ${error.message}`);
}

async function markEventFailed(eventId: string, errorMessage: string) {
  const { error } = await getSupabase()
    .from("webhook_events")
    .update({
      processing_state: "failed",
      error_message: errorMessage.slice(0, 1000),
      completed_at: null,
    })
    .eq("event_id", eventId);
  if (error) throw new Error(`webhook_events fail failed: ${error.message}`);
}

async function handleWebhook(req: Request, env: StripeEnv): Promise<string | null> {
  const event = (await verifyWebhook(req, env)) as Stripe.Event;
  const eventId: string | undefined = event.id;
  if (!eventId) throw new Error("Missing event id");

  const claimResult = await claimEvent(eventId, event.type);
  if (claimResult === "completed") {
    console.log("[webhook] duplicate event, skipping:", eventId, event.type);
    return null;
  }
  if (claimResult === "pending") {
    throw new Error(`Webhook event ${eventId} is already being processed`);
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object, env);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object, env);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object, env);
        break;
      default:
        console.log("[webhook] unhandled event:", event.type);
    }
    await markEventCompleted(eventId);
  } catch (error) {
    await markEventFailed(eventId, error instanceof Error ? error.message : "Webhook error");
    throw error;
  }
  return eventId;
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook received with invalid env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          // Return 500 so Stripe retries. Idempotency table prevents dup work.
          console.error("[webhook] error:", e);
          return new Response(e instanceof Error ? e.message : "Webhook error", { status: 500 });
        }
      },
    },
  },
});
