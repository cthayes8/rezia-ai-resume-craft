import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * Webhook endpoint for Clerk billing events.
 * Configure your Clerk Dashboard to send billing webhooks to /api/webhooks/clerk
 * Set CLERK_WEBHOOK_SIGNING_SECRET in environment variables.
 */
export async function POST(request: Request) {
  try {
    // TODO: verify Clerk webhook signature here (skipping verifyWebhook for now)
    const event = await request.json();
    const { type, data } = event as any;

    // Handle new user sign-up: ensure every Clerk user is in our database
    if (type === 'user.created') {
      const userId = (data.id || data.userId || data.clerkUserId) as string;
      try {
        const userRecord = await clerkClient.users.getUser(userId);
        const email = userRecord.emailAddresses[0]?.emailAddress || '';
        const fullName = `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim();
        await prisma.user.upsert({
          where: { id: userId },
          update: { email, fullName },
          create: { id: userId, email, fullName },
        });
      } catch (err) {
        console.error('Error upserting user on user.created webhook:', err);
      }
    }
    // Handle subscription billing events
    else if (type === 'billing.subscription.created' || type === 'billing.subscription.updated') {
      const sub = data;
      // Determine Clerk user ID and ensure a DB user record exists
      const userId = sub.userId || sub.clerkUserId;
      let dbUserId = userId;
      try {
        const userRecord = await clerkClient.users.getUser(userId);
        const email = userRecord.emailAddresses[0]?.emailAddress || '';
        const fullName = `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim();
        let dbUser = await prisma.user.findUnique({ where: { id: userId } });
        if (dbUser) {
          await prisma.user.update({ where: { id: userId }, data: { email, fullName } });
        } else {
          const emailUser = await prisma.user.findUnique({ where: { email } });
          if (emailUser) {
            await prisma.user.update({ where: { email }, data: { fullName } });
            dbUserId = emailUser.id;
          } else {
            await prisma.user.create({ data: { id: userId, email, fullName } });
          }
        }
      } catch (err) {
        console.error('Error upserting user in billing webhook:', err);
      }
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
          userId: dbUserId,
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