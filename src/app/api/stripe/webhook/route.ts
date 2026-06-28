import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { upsertSubscription, cancelSubscription, sql } from "@/lib/db";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await getStripe().subscriptions.retrieve(
            session.subscription as string
          );
          const customerId = session.customer as string;
          const userResult = await sql`SELECT id FROM users WHERE stripe_customer_id = ${customerId}`;
          const userId = userResult.rows[0]?.id;
          if (userId) {
            await upsertSubscription({
              userId,
              stripeSubscriptionId: sub.id,
              stripePriceId: sub.items.data[0]?.price.id ?? "",
              status: sub.status,
              currentPeriodEnd: new Date((sub.current_period_end ?? 0) * 1000),
            });
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const userResult = await sql`SELECT id FROM users WHERE stripe_customer_id = ${customerId}`;
        const userId = userResult.rows[0]?.id;
        if (userId) {
          await upsertSubscription({
            userId,
            stripeSubscriptionId: sub.id,
            stripePriceId: sub.items.data[0]?.price.id ?? "",
            status: sub.status,
            currentPeriodEnd: new Date((sub.current_period_end ?? 0) * 1000),
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await cancelSubscription(sub.id);
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
