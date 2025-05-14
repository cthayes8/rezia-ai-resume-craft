import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/quota-status
 * Returns the free-tier status and optimization run count for the current user
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  // Authenticate via Clerk in pages/api
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    // Ensure user record and fetch free run credits without violating unique email constraints
    const client = await clerkClient();
    const userRecord = await client.users.getUser(userId!);
    const email = userRecord.emailAddresses[0]?.emailAddress || '';
    const fullName = `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim();
    let dbUser = await prisma.user.findUnique({ where: { id: userId! } });
    if (dbUser) {
      // Update existing by ID
      dbUser = await prisma.user.update({
        where: { id: userId! },
        data: { email, fullName },
      });
    } else {
      // No user with this ID, check by email
      const emailUser = await prisma.user.findUnique({ where: { email } });
      if (emailUser) {
        // Update existing by email
        dbUser = await prisma.user.update({
          where: { email },
          data: { fullName },
        });
      } else {
        // Create new user
        dbUser = await prisma.user.create({
          data: { id: userId!, email, fullName },
        });
      }
    }
    return res.status(200).json({
      freeRunsRemaining: dbUser.freeRunsRemaining,
      plan: dbUser.plan
    });
  } catch (err) {
    console.error('Quota status error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}