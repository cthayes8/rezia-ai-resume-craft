import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Stripe client will be initialized inside handler

export async function GET(req: Request) {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  // Find active subscription for this user
  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: 'active' },
    orderBy: { currentPeriodEnd: 'desc' },
  });
  if (!subscription?.stripeCustomerId) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
  }

  const origin = new URL(req.url).origin;
  // Initialize Stripe client
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2022-11-15' });
  // Create Customer Portal session
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${origin}/dashboard/account`,
  });
  return NextResponse.redirect(portalSession.url);
}