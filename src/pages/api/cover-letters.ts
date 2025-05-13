import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
  const { userId } = getAuth(req);
  let dbUserId = userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  // Ensure user record exists and get DB user ID
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
    console.error('[cover-letters] Error upserting user:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
  const runId = Array.isArray(req.query.runId) ? req.query.runId[0] : req.query.runId;
  if (!runId) {
    return res.status(400).json({ error: 'Missing runId parameter' });
  }
  try {
    const cover = await prisma.coverLetter.findFirst({ where: { optimizationRunId: runId, userId: dbUserId } });
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