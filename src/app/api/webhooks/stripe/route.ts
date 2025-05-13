import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Stripe client will be initialized inside handler
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: Request) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature') || '';
  let event: Stripe.Event;
  // Initialize Stripe client inside handler
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2022-11-15' });
  try {
    event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
  } catch (err: any) {
    console.error('Stripe webhook signature error:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        // A Checkout Session has completed; persist or update the subscription
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string;
        // Retrieve subscription details (metadata is on the subscription)
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const planName = sub.items.data[0].price.id;
        const status = sub.status;
        const currentPeriodStart = new Date(sub.current_period_start * 1000);
        const currentPeriodEnd = new Date(sub.current_period_end * 1000);
        // Determine userId: prefer session metadata, fallback to subscription metadata
        const sess = session as Stripe.Checkout.Session;
        const userId = sess.metadata?.userId || sub.metadata.userId;
        if (!userId) {
          throw new Error(
            `Missing userId metadata on session ${sess.id} and subscription ${subscriptionId}`
          );
        }
        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: subscriptionId },
          update: {
            status,
            planName,
            currentPeriodStart,
            currentPeriodEnd,
            updatedAt: new Date(),
          },
          create: {
            userId,
            stripeCustomerId: sub.customer as string,
            stripeSubscriptionId: subscriptionId,
            planName,
            status,
            currentPeriodStart,
            currentPeriodEnd,
          },
        });
        break;
      }
      case 'customer.subscription.updated': {
        const subObj = event.data.object as Stripe.Subscription;
        const subscriptionId = subObj.id;

        // Try to get the first subscription item (with pricing and period info)
        const item = subObj.items?.data?.[0];
        // Determine planName: prefer item.price.id, fallback to top-level subscription.plan.id
        const planName = item?.price?.id ?? subObj.plan?.id;
        // Determine billing period boundaries (unix seconds)
        const periodStartUnix =
          typeof subObj.current_period_start === 'number'
            ? subObj.current_period_start
            : item?.current_period_start;
        const periodEndUnix =
          typeof subObj.current_period_end === 'number'
            ? subObj.current_period_end
            : item?.current_period_end;
        if (!periodStartUnix || !periodEndUnix) {
          console.warn(
            `Subscription ${subscriptionId} missing period bounds; skipping update.`
          );
          break;
        }
        const currentPeriodStart = new Date(periodStartUnix * 1000);
        const currentPeriodEnd = new Date(periodEndUnix * 1000);
        const status = subObj.status;

        // Use upsert so that updated events create missing records
        const userId = subObj.metadata.userId;
        if (!userId) {
          console.warn(
            `Subscription ${subscriptionId} missing metadata.userId; cannot upsert.`
          );
          break;
        }
        await prisma.subscription.upsert({
          where: { stripeSubscriptionId: subscriptionId },
          update: {
            planName,
            status,
            currentPeriodStart,
            currentPeriodEnd,
            updatedAt: new Date(),
          },
          create: {
            userId,
            stripeCustomerId: subObj.customer as string,
            stripeSubscriptionId: subscriptionId,
            planName,
            status,
            currentPeriodStart,
            currentPeriodEnd,
          },
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const subObj = event.data.object as Stripe.Subscription;
        const subscriptionId = subObj.id;
        // mark canceled
        // Mark cancellation; if no record exists this will have no effect
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscriptionId },
          data: { status: 'canceled', updatedAt: new Date() },
        });
        break;
      }
      default:
        // ignore other events
        break;
    }
  } catch (err: any) {
    console.error('Error handling stripe webhook:', err);
    const message = err?.message || 'Webhook handling failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}