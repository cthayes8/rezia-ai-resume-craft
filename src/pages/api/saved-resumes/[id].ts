import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req);
  // Determine the actual DB user ID (may differ when merging by email)
  let dbUserId = userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  // Ensure a User record exists / fetch correct DB user ID
  try {
    const client = await clerkClient();
    const userRecord = await client.users.getUser(userId);
    const email = userRecord.emailAddresses[0]?.emailAddress || '';
    const fullName = `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim();
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (existing) {
      await prisma.user.update({ where: { id: userId }, data: { email, fullName } });
    } else {
      const byEmail = await prisma.user.findUnique({ where: { email } });
      if (byEmail) {
        await prisma.user.update({ where: { email }, data: { fullName } });
        dbUserId = byEmail.id;
      } else {
        await prisma.user.create({ data: { id: userId, email, fullName } });
      }
    }
  } catch (e) {
    console.error('Error upserting user for saved-resume delete/fetch:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (req.method === 'GET') {
    try {
      const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
      const record = await prisma.savedResume.findUnique({
        where: { id, userId: dbUserId },
        select: { id: true, name: true, content: true, parsedData: true, createdAt: true }
      });
      if (!record) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.status(200).json(record);
    } catch (err) {
      console.error('Error fetching saved resume:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  if (req.method === 'DELETE') {
    try {
      const result = await prisma.savedResume.deleteMany({ where: { id, userId: dbUserId } });
      if (result.count === 0) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.status(204).end();
    } catch (err) {
      console.error('Error deleting saved resume:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  res.setHeader('Allow', ['GET', 'DELETE']);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}