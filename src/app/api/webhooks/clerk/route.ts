import { NextResponse } from 'next/server';
import { verifyWebhook } from '@clerk/backend';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * Webhook endpoint for Clerk billing events.
 * Configure your Clerk Dashboard to send billing webhooks to /api/webhooks/clerk
 * Set CLERK_WEBHOOK_SIGNING_SECRET in environment variables.
 */
export async function POST(request: Request) {
  try {
    const event = await verifyWebhook(request);
    const { type, data } = event as any;

    if (type === 'billing.subscription.created' || type === 'billing.subscription.updated') {
      const sub = data;
      const userId = sub.userId || sub.clerkUserId;
      const stripeCustomerId = sub.customerId || sub.customer_id;
      const stripeSubscriptionId = sub.id;
      const planName = sub.planId || sub.priceId || sub.plan_id;
      const status = sub.status;
      const currentPeriodStart = sub.currentPeriodStart
        ? new Date(sub.currentPeriodStart * 1000)
        : new Date(sub.current_period_start * 1000);
      const currentPeriodEnd = sub.currentPeriodEnd
        ? new Date(sub.currentPeriodEnd * 1000)
        : new Date(sub.current_period_end * 1000);

      await prisma.subscription.upsert({
        where: { stripeSubscriptionId },
        update: {
          status,
          planName,
          currentPeriodStart,
          currentPeriodEnd,
          updatedAt: new Date(),
        },
        create: {
          userId,
          stripeCustomerId,
          stripeSubscriptionId,
          planName,
          status,
          currentPeriodStart,
          currentPeriodEnd,
        },
      });
    } else if (type === 'billing.subscription.canceled' || type === 'billing.subscription.deleted') {
      const sub = data;
      const stripeSubscriptionId = sub.id;
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId },
        data: {
          status: 'canceled',
          updatedAt: new Date(),
        },
      });
    }
  } catch (err) {
    console.error('Clerk billing webhook error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
  return NextResponse.json({ received: true });
}