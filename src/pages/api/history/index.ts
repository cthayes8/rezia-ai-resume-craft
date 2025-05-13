import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET /api/history
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  // Authenticate user
  const { userId } = getAuth(req);
  let dbUserId = userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    // Ensure user record exists and get correct DB user ID
    try {
      const client = await clerkClient();
      const userRecord = await client.users.getUser(userId);
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
      console.error('Error upserting user before fetching history:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    // Fetch user's optimization runs, most recent first
    const runs = await prisma.optimizationRun.findMany({
      where: { userId: dbUserId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        targetTitle: true,
        targetCompany: true
      }
    });
    // Format for front-end
    const history = runs.map(run => ({
      id: run.id,
      date: run.createdAt.toISOString(),
      jobTitle: run.targetTitle,
      company: run.targetCompany
    }));
    return res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}