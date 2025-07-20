import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
export const runtime = 'nodejs';

// Initialize Stripe client
// Stripe client will be initialized inside handler to avoid missing API key errors at build-time

export async function POST(req: Request) {
  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    return redirectToSignIn();
  }
  const { planId } = await req.json();
  if (!planId) {
    return NextResponse.json({ error: 'Missing planId' }, { status: 400 });
  }

  // Fetch Clerk user email via Clerk client
  const client = await clerkClient();
  const userRecord = await client.users.getUser(userId);
  const email = userRecord.emailAddresses[0]?.emailAddress;

  // Build origin for absolute URLs
  const origin = new URL(req.url).origin;

  // Initialize Stripe client
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2022-11-15' });
  // Create Stripe Checkout Session
  // After subscription, always return user to dashboard optimize
  const success_url = `${origin}/dashboard/unified?session_id={CHECKOUT_SESSION_ID}`;
  const cancel_url = `${origin}/dashboard/unified`;
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: planId, quantity: 1 }],
    // Attach userId to the Checkout Session metadata (for webhook handlers)
    metadata: { userId },
    // Also attach to the subscription metadata (optional)
    subscription_data: { metadata: { userId } },
    customer_email: email ?? undefined,
    success_url,
    cancel_url,
  });

  return NextResponse.json({ url: session.url });
}