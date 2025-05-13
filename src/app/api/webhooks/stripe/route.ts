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
        // Pull userId from subscription metadata (set via subscription_data.metadata)
        const userId = sub.metadata.userId;
        if (!userId) {
          throw new Error(`Subscription ${subscriptionId} missing userId metadata`);
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
        const planName = subObj.items.data[0]?.price.id || undefined;
        const status = subObj.status;
        const currentPeriodStart = new Date(subObj.current_period_start * 1000);
        const currentPeriodEnd = new Date(subObj.current_period_end * 1000);
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscriptionId },
          data: {
            planName,
            status,
            currentPeriodStart,
            currentPeriodEnd,
            updatedAt: new Date(),
          },
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const subObj = event.data.object as Stripe.Subscription;
        const subscriptionId = subObj.id;
        // mark canceled
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
  } catch (err) {
    console.error('Error handling stripe webhook:', err);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}