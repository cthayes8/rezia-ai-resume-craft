import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export const runtime = 'nodejs';

/**
 * Creates a Stripe Customer Portal session via Clerk Billing SDK
 */
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const origin = req.headers.get('origin') || '';
  // Return user to their account page after managing billing
  const return_url = `${origin}/dashboard/account`;
  const session = await clerkClient.billing.createBillingPortalSession({ return_url });
  return NextResponse.redirect(session.url);
}