import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const runId = Array.isArray(req.query.runId) ? req.query.runId[0] : req.query.runId;
  if (!runId) {
    return res.status(400).json({ error: 'Missing runId parameter' });
  }
  try {
    const cover = await prisma.coverLetter.findFirst({ where: { optimizationRunId: runId, userId } });
    if (!cover) {
      return res.status(404).json({ error: 'Cover letter not found' });
    }
    return res.status(200).json({ coverLetterId: cover.id });
  } catch (err) {
    console.error('[cover-letters] Error:', err);
    // @ts-ignore: err may not have message
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}