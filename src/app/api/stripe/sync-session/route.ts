import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2022-11-15' });
  // Retrieve session and its subscription
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
  if (!session.subscription || typeof session.subscription === 'string') {
    return NextResponse.json({ error: 'No subscription found in session' }, { status: 400 });
  }
  const sub = session.subscription as Stripe.Subscription;
  const subscriptionId = sub.id;
  const planName = sub.items.data[0].price.id;
  const status = sub.status;
  const currentPeriodStart = new Date(sub.current_period_start * 1000);
  const currentPeriodEnd = new Date(sub.current_period_end * 1000);
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscriptionId },
    update: { status, planName, currentPeriodStart, currentPeriodEnd, updatedAt: new Date() },
    create: { userId, stripeCustomerId: sub.customer as string, stripeSubscriptionId: subscriptionId, planName, status, currentPeriodStart, currentPeriodEnd },
  });

  // Upgrade user to paid plan
  await prisma.user.update({ where: { id: userId }, data: { plan: 'paid' } });
  return NextResponse.json({ synced: true });
}