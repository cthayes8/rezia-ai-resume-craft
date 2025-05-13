import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) return redirectToSignIn();

  const subscription = await prisma.subscription.findFirst({
    where: { userId, status: { in: ['active', 'trialing'] } },
    orderBy: { currentPeriodEnd: 'desc' },
  });
  if (!subscription) {
    return NextResponse.json({ subscription: null });
  }
  const { planName, status, currentPeriodEnd } = subscription;
  // Map price ID to human-readable tier name (fallback to generic Paid)
  const standardId = process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD;
  const premiumId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM;
  let tierLabel: string;
  if (planName === standardId) tierLabel = 'Standard';
  else if (planName === premiumId) tierLabel = 'Premium';
  else tierLabel = 'Paid';
  return NextResponse.json({ subscription: { tierLabel, status, currentPeriodEnd } });
}