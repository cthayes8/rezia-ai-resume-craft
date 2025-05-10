import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// GET /api/history
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  // Authenticate user
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    // Fetch user's optimization runs, most recent first
    const runs = await prisma.optimizationRun.findMany({
      where: { userId },
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